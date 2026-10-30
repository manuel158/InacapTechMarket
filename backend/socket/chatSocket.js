const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Conversacion = require('../models/Conversacion');
const Mensaje = require('../models/Mensaje');
const enviarCorreo = require('../config/emailConfig');
const {
    userRoom,
    emitirCantidadNoLeidos
} = require('../utils/chatNotifications');

function esParticipante(conversacion, usuarioId) {
    return conversacion.seller.toString() === usuarioId ||
        conversacion.interested.toString() === usuarioId;
}

async function marcarLeida(io, conversacion, usuarioId) {
    const unreadField = conversacion.seller.toString() === usuarioId
        ? 'sellerUnreadCount'
        : 'interestedUnreadCount';
    await Conversacion.updateOne(
        { _id: conversacion._id },
        { $set: { [unreadField]: 0 } }
    );
    await emitirCantidadNoLeidos(io, usuarioId);
}

async function enviarAvisoPrimerMensaje(conversacionId, nombreRemitente) {
    const conversacion = await Conversacion.findById(conversacionId)
        .populate('seller', 'nombre correo')
        .populate('publication', 'nombre');
    if (!conversacion?.seller?.correo) {
        throw new Error('No se encontró el correo de quien publicó');
    }

    await enviarCorreo({
        toEmail: conversacion.seller.correo,
        toName: conversacion.seller.nombre,
        subject: 'Tienes mensajes nuevos en tu publicación',
        message: `${nombreRemitente} inició una conversación sobre tu publicación "${conversacion.publication?.nombre || 'Publicación'}". Ingresa a InacapTechMarket para revisar el mensaje.`
    });
    await Conversacion.updateOne(
        { _id: conversacionId },
        { $set: { firstMessageEmailSent: true } }
    );
}

function inicializarChat(io) {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (typeof token !== 'string' || !token) {
                return next(new Error('No autorizado'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const usuario = await Usuario.findById(decoded.id).select('_id nombre');
            if (!usuario) {
                return next(new Error('No autorizado'));
            }

            socket.data.usuarioId = usuario._id.toString();
            socket.data.nombre = usuario.nombre;
            return next();
        } catch {
            return next(new Error('Token inválido'));
        }
    });

    io.on('connection', socket => {
        socket.join(userRoom(socket.data.usuarioId));
        emitirCantidadNoLeidos(io, socket.data.usuarioId)
            .catch(error => console.error('Error al notificar mensajes sin leer:', error));

        socket.on('chat:join', async (payload, acknowledge) => {
            const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
            const conversacionId = payload?.conversacionId;

            if (!mongoose.isValidObjectId(conversacionId)) {
                return respond({ ok: false, mensaje: 'La conversación no es válida' });
            }

            try {
                const conversacion = await Conversacion.findById(conversacionId);
                if (!conversacion || !esParticipante(conversacion, socket.data.usuarioId)) {
                    return respond({ ok: false, mensaje: 'No tienes acceso a esta conversación' });
                }

                if (socket.data.conversacionId) {
                    await socket.leave(socket.data.conversacionId);
                }
                socket.data.conversacionId = conversacionId;
                await socket.join(conversacionId);
                return respond({ ok: true });
            } catch (error) {
                console.error('Error al unirse a conversación:', error);
                return respond({ ok: false, mensaje: 'No se pudo conectar al chat' });
            }
        });

        socket.on('chat:send', async (payload, acknowledge) => {
            const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
            const conversacionId = payload?.conversacionId;
            const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

            if (
                !mongoose.isValidObjectId(conversacionId) ||
                text.length === 0 ||
                text.length > 2000
            ) {
                return respond({
                    ok: false,
                    mensaje: 'El mensaje debe tener entre 1 y 2000 caracteres'
                });
            }

            if (socket.data.conversacionId !== conversacionId) {
                return respond({
                    ok: false,
                    mensaje: 'Conéctate a la conversación antes de enviar mensajes'
                });
            }

            try {
                const conversacion = await Conversacion.findById(conversacionId);
                if (!conversacion || !esParticipante(conversacion, socket.data.usuarioId)) {
                    return respond({ ok: false, mensaje: 'No tienes acceso a esta conversación' });
                }

                const mensaje = await Mensaje.create({
                    conversation: conversacionId,
                    sender: socket.data.usuarioId,
                    text
                });
                const esPrimerMensaje = await Conversacion.findOneAndUpdate(
                    {
                        _id: conversacionId,
                        firstMessageEmailClaimed: { $ne: true },
                        $or: [
                            { lastMessage: { $exists: false } },
                            { 'lastMessage.createdAt': { $exists: false } }
                        ]
                    },
                    { $set: { firstMessageEmailClaimed: true } },
                    { new: false }
                );
                const destinatarioId = conversacion.seller.toString() === socket.data.usuarioId
                    ? conversacion.interested
                    : conversacion.seller;
                const campoNoLeidos = conversacion.seller.toString() === socket.data.usuarioId
                    ? 'interestedUnreadCount'
                    : 'sellerUnreadCount';
                await Conversacion.findByIdAndUpdate(conversacionId, {
                    $set: {
                        lastMessage: {
                            text: mensaje.text,
                            sender: mensaje.sender,
                            createdAt: mensaje.createdAt
                        },
                        updatedAt: mensaje.createdAt
                    },
                    $inc: { [campoNoLeidos]: 1 },
                    $pull: { hiddenFor: { $in: [socket.data.usuarioId, destinatarioId] } }
                });

                io.to(conversacionId).emit('chat:message', {
                    _id: mensaje._id.toString(),
                    sender: {
                        _id: socket.data.usuarioId,
                        nombre: socket.data.nombre
                    },
                    text: mensaje.text,
                    createdAt: mensaje.createdAt
                });
                emitirCantidadNoLeidos(io, destinatarioId)
                    .catch(error => console.error('Error al actualizar mensajes sin leer:', error));
                if (
                    esPrimerMensaje &&
                    conversacion.seller.toString() !== socket.data.usuarioId
                ) {
                    enviarAvisoPrimerMensaje(conversacionId, socket.data.nombre)
                        .catch(error => console.error('No se pudo enviar el aviso del primer mensaje:', error));
                }
                return respond({ ok: true });
            } catch (error) {
                console.error('Error al enviar mensaje:', error);
                return respond({ ok: false, mensaje: 'No se pudo enviar el mensaje' });
            }
        });

        socket.on('chat:read', async (payload, acknowledge) => {
            const respond = typeof acknowledge === 'function' ? acknowledge : () => {};
            const conversacionId = payload?.conversacionId;
            if (
                !mongoose.isValidObjectId(conversacionId) ||
                socket.data.conversacionId !== conversacionId
            ) {
                return respond({ ok: false, mensaje: 'La conversación no es válida' });
            }

            try {
                const conversacion = await Conversacion.findById(conversacionId);
                if (!conversacion || !esParticipante(conversacion, socket.data.usuarioId)) {
                    return respond({ ok: false, mensaje: 'No tienes acceso a esta conversación' });
                }
                await marcarLeida(io, conversacion, socket.data.usuarioId);
                return respond({ ok: true });
            } catch (error) {
                console.error('Error al marcar mensajes como leídos:', error);
                return respond({ ok: false, mensaje: 'No se pudo actualizar el contador de mensajes' });
            }
        });
    });
}

module.exports = inicializarChat;
