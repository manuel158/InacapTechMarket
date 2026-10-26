const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Conversacion = require('../models/Conversacion');
const Mensaje = require('../models/Mensaje');

function esParticipante(conversacion, usuarioId) {
    return conversacion.seller.toString() === usuarioId ||
        conversacion.interested.toString() === usuarioId;
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
                await Conversacion.findByIdAndUpdate(conversacionId, {
                    $set: {
                        lastMessage: {
                            text: mensaje.text,
                            sender: mensaje.sender,
                            createdAt: mensaje.createdAt
                        },
                        updatedAt: mensaje.createdAt
                    }
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
                return respond({ ok: true });
            } catch (error) {
                console.error('Error al enviar mensaje:', error);
                return respond({ ok: false, mensaje: 'No se pudo enviar el mensaje' });
            }
        });
    });
}

module.exports = inicializarChat;
