const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Conversacion = require('../models/Conversacion');
const Mensaje = require('../models/Mensaje');
const Producto = require('../models/Producto');
const { emitirCantidadNoLeidos } = require('../utils/chatNotifications');

const populateConversacion = [
    { path: 'publication', select: 'nombre imagen categoria subcategoria precio' },
    { path: 'seller', select: 'nombre activo' },
    { path: 'interested', select: 'nombre activo' },
    { path: 'lastMessage.sender', select: 'nombre activo' }
];

function anonimizarUsuario(usuario) {
    if (!usuario || usuario.activo !== false) return usuario;
    return {
        _id: usuario._id,
        nombre: 'Usuario eliminado'
    };
}

function anonimizarConversacion(conversacion) {
    const data = conversacion.toObject();
    data.seller = anonimizarUsuario(data.seller);
    data.interested = anonimizarUsuario(data.interested);
    if (data.lastMessage) {
        data.lastMessage.sender = anonimizarUsuario(data.lastMessage.sender);
    }
    return data;
}

function participantes(usuarioId) {
    return {
        $or: [
            { seller: usuarioId },
            { interested: usuarioId }
        ]
    };
}

const listarConversaciones = async (req, res) => {
    try {
        const conversaciones = await Conversacion.find(
            {
                $and: [
                    participantes(req.usuario._id),
                    { hiddenFor: { $ne: req.usuario._id } }
                ]
            }
        )
            .populate(populateConversacion)
            .sort({ updatedAt: -1 });

        return res.json(conversaciones.map(anonimizarConversacion));
    } catch (error) {
        console.error('Error al listar conversaciones:', error);
        return res.status(500).json({
            mensaje: 'No se pudieron cargar las conversaciones'
        });
    }
};

const eliminarConversacion = async (req, res) => {
    let session;
    try {
        const { conversacionId } = req.params;
        if (!mongoose.isValidObjectId(conversacionId)) {
            return res.status(400).json({
                mensaje: 'La conversación no es válida'
            });
        }

        const usuarioId = req.usuario._id;
        let participantesIds = null;
        session = await mongoose.startSession();
        await session.withTransaction(async () => {
            const conversacion = await Conversacion.findOne({
                _id: conversacionId,
                ...participantes(usuarioId)
            }).select('seller interested').session(session);
            if (!conversacion) return;

            const resultado = await Conversacion.deleteOne({
                _id: conversacionId,
                ...participantes(usuarioId)
            }, { session });
            if (resultado.deletedCount !== 1) return;

            await Mensaje.deleteMany(
                { conversation: conversacion._id },
                { session }
            );
            participantesIds = [
                conversacion.seller.toString(),
                conversacion.interested.toString()
            ];
        });
        if (!participantesIds) {
            return res.status(404).json({
                mensaje: 'No se encontró la conversación'
            });
        }

        const io = req.app.get('io');
        if (io) {
            for (const id of new Set(participantesIds)) {
                io.to(`usuario:${id}`).emit('chat:conversation-deleted', {
                    conversacionId
                });
            }
            try {
                await Promise.all([...new Set(participantesIds)].map(id =>
                    emitirCantidadNoLeidos(io, id)
                ));
            } catch (error) {
                console.error('No se pudieron actualizar los contadores de mensajes:', error);
            }
        }
        return res.json({
            mensaje: 'La conversación y sus mensajes se eliminaron permanentemente'
        });
    } catch (error) {
        console.error('Error al eliminar conversación y mensajes:', error);
        return res.status(500).json({
            mensaje: 'No se pudo eliminar la conversación'
        });
    } finally {
        if (session) {
            try {
                await session.endSession();
            } catch (error) {
                console.error('No se pudo cerrar la sesión de MongoDB:', error);
            }
        }
    }
};

const obtenerNoLeidos = async (req, res) => {
    try {
        const count = await obtenerCantidadNoLeidos(req.usuario._id);
        return res.json({ count });
    } catch (error) {
        console.error('Error al contar mensajes sin leer:', error);
        return res.status(500).json({
            mensaje: 'No se pudo cargar el contador de mensajes'
        });
    }
};

const iniciarConversacion = async (req, res) => {
    try {
        const { publicacionId } = req.params;
        if (!mongoose.isValidObjectId(publicacionId)) {
            return res.status(400).json({
                mensaje: 'La publicación no es válida'
            });
        }

        const publicacion = await Producto.findById(publicacionId);
        if (!publicacion || !publicacion.usuario) {
            return res.status(404).json({
                mensaje: 'No se encontró la publicación'
            });
        }

        const publicadorActivo = await Usuario.findOne({
            _id: publicacion.usuario,
            activo: { $ne: false }
        }).select('_id');
        if (!publicadorActivo) {
            return res.status(404).json({
                mensaje: 'No se encontró la publicación'
            });
        }

        if (publicacion.estado &&
            publicacion.estado !== 'aprobada') {
            return res.status(404).json({
                mensaje: 'No se encontró la publicación'
            });
        }

        if (publicacion.usuario.toString() === req.usuario._id.toString()) {
            return res.status(400).json({
                mensaje: 'No puedes iniciar un chat con tu propia publicación'
            });
        }

        let conversacion = await Conversacion.findOne({
            publication: publicacion._id,
            interested: req.usuario._id
        });
        let creada = false;

        if (!conversacion) {
            try {
                conversacion = await Conversacion.create({
                    publication: publicacion._id,
                    seller: publicacion.usuario,
                    interested: req.usuario._id
                });
                creada = true;
            } catch (error) {
                if (error.code !== 11000) throw error;
                conversacion = await Conversacion.findOne({
                    publication: publicacion._id,
                    interested: req.usuario._id
                });
                if (!conversacion) throw error;
            }
        }

        await conversacion.populate(populateConversacion);
        return res.status(creada ? 201 : 200).json(
            anonimizarConversacion(conversacion)
        );
    } catch (error) {
        console.error('Error al iniciar conversación:', error);
        return res.status(500).json({
            mensaje: 'No se pudo iniciar la conversación'
        });
    }
};

const obtenerConversacion = async (req, res) => {
    try {
        const { conversacionId } = req.params;
        if (!mongoose.isValidObjectId(conversacionId)) {
            return res.status(400).json({
                mensaje: 'La conversación no es válida'
            });
        }

        const conversacion = await Conversacion.findOne({
            _id: conversacionId,
            ...participantes(req.usuario._id)
        }).populate(populateConversacion);

        if (!conversacion) {
            return res.status(404).json({
                mensaje: 'No se encontró la conversación'
            });
        }

        const mensajes = await Mensaje.find({ conversation: conversacion._id })
            .populate('sender', 'nombre activo')
            .sort({ createdAt: 1, _id: 1 });

        return res.json({
            ...anonimizarConversacion(conversacion),
            messages: mensajes.map(mensaje => {
                const data = mensaje.toObject();
                data.sender = anonimizarUsuario(data.sender);
                return data;
            })
        });
    } catch (error) {
        console.error('Error al cargar conversación:', error);
        return res.status(500).json({
            mensaje: 'No se pudo cargar la conversación'
        });
    }
};

module.exports = {
    listarConversaciones,
    eliminarConversacion,
    obtenerNoLeidos,
    iniciarConversacion,
    obtenerConversacion
};
