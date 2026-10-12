const mongoose = require('mongoose');

const categoriasPermitidas = [
    'Notebooks',
    'Computadores',
    'Monitores',
    'Perifericos',
    'Celulares',
    'Consolas',
    'Componentes',
    'Impresoras',
    'Redes',
    'Otros'
];

const productoSchema = new mongoose.Schema({

    nombre: {
        type: String,
        required: true
    },

    descripcion: {
        type: String,
        required: true
    },

    precio: {
        type: Number,
        required: true
    },

    categoria: {
        type: String,
        required: true,
        enum: categoriasPermitidas
    },

    imagen: {
        type: String,
        required: true
    },

    whatsapp: {
        type: String,
        required: true
    },

    comentario: {
        type: String,
        default: ''
    },

    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Producto', productoSchema);