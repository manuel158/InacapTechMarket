const mongoose = require('mongoose');
const categorias = require('../../shared/categories.json');

const categoriasPermitidas = [
    ...Object.keys(categorias),
    ...categorias.Trueques,
    'Material Académico',
    'Tecnología',
    'Vivienda'
];
const subcategoriasAntiguas = {
    'Avisos y Oportunidades': ['Prácticas profesionales'],
    'Comunidad y Recreación': ['Venta de entradas para eventos autorizados'],
    'Material Académico': [
        'Compra de libros usados',
        'Venta de libros usados',
        'Intercambio de libros',
        'Donación de libros',
        'Donación de materiales académicos',
        'Préstamo de libros'
    ]
};
const subcategoriasPermitidas = [
    ...Object.values(categorias).flat(),
    ...Object.values(subcategoriasAntiguas).flat()
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

    subcategoria: {
        type: String,
        required: true,
        enum: subcategoriasPermitidas,
        validate: {
            validator(subcategoria) {
                let categoria = this.categoria;
                if (['Material Académico', 'Tecnología'].includes(categoria) ||
                    categorias.Trueques.includes(categoria)) {
                    if (categoria === 'Material Académico') {
                        return subcategoriasAntiguas[categoria].includes(subcategoria);
                    }
                    categoria = 'Trueques';
                } else if (categoria === 'Vivienda') {
                    categoria = 'Vivienda y arriendo de cabañas';
                }
                return categorias[categoria]?.includes(subcategoria) ||
                    subcategoriasAntiguas[categoria]?.includes(subcategoria) ||
                    false;
            },
            message: 'La subcategoría no corresponde a la categoría seleccionada'
        }
    },

    imagen: {
        type: String,
        required: true
    },

    imagenes: {
        type: [String],
        default: []
    },

    sePermutaPor: {
        type: String,
        default: ''
    },

    detalleCategoria: {
        type: String,
        default: ''
    },

    whatsapp: {
        type: String,
        default: '',
        select: false
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