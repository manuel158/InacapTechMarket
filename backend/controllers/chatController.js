const mongoose = require('mongoose');
const Conversacion = require('../models/Conversacion');
const Mensaje = require('../models/Mensaje');
const Producto = require('../models/Producto');

const populateConversacion = [
    { path: 'publication', select: 'nombre imagen categoria subcategoria precio' },
    { path: 'seller', select: 'nombre' },
    { path: 'interested', select: 'nombre' },
    { path: 'lastMessage.sender', select: 'nombre' }
];

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
            participantes(req.usuario._id)
        )
            .populate(populateConversacion)
            .sort({ updatedAt: -1 });

        return res.json(conversaciones);
    } catch (error) {
        console.error('Error al listar conversaciones:', error);
        return res.status(500).json({
            mensaje: 'No se pudieron cargar las conversaciones'
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
        return res.status(creada ? 201 : 200).json(conversacion);
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
            .populate('sender', 'nombre')
            .sort({ createdAt: 1, _id: 1 });

        return res.json({
            ...conversacion.toObject(),
            messages: mensajes
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
    iniciarConversacion,
    obtenerConversacion
};
