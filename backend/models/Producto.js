const mongoose = require('mongoose');
const categorias = require('../../shared/categories.json');

const categoriasPermitidas = [
    ...Object.keys(categorias),
    ...categorias.Tecnología
];
const subcategoriasPermitidas = Object.values(categorias).flat();

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

    subcategoria: {
        type: String,
        required: true,
        enum: subcategoriasPermitidas,
        validate: {
            validator(subcategoria) {
                return categorias[this.categoria]?.includes(subcategoria) || false;
            },
            message: 'La subcategoría no corresponde a la categoría seleccionada'
        }
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