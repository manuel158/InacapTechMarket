const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },

    correo: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true
    },

    codigoVerificacion: {
        type: String,
        default: null
    },

    verificado: {
        type: Boolean,
        default: false
    },

    rol: {
        type: String,
        enum: ['usuario', 'admin'],
        default: 'usuario'
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Usuario', usuarioSchema);