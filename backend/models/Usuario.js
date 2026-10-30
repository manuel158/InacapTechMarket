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

    whatsapp: {
        type: String,
        default: '',
        select: false,
        trim: true
    },

    tipoIntegrante: {
        type: String,
        enum: ['estudiante', 'profesor', 'funcionario'],
        select: false
    },

    sede: {
        type: String,
        enum: ['Valdivia'],
        select: false
    },

    sexo: {
        type: String,
        enum: ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo', ''],
        default: '',
        select: false
    },

    fechaNacimiento: {
        type: Date,
        select: false
    },

    terminosVersionAceptada: {
        type: String,
        select: false
    },

    terminosAceptadosEn: {
        type: Date,
        select: false
    },

    codigoVerificacion: {
        type: String,
        default: null
    },

    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
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
    timestamps: true,
    toJSON: {
        transform(_document, value) {
            delete value.whatsapp;
            delete value.tipoIntegrante;
            delete value.sede;
            delete value.sexo;
            delete value.fechaNacimiento;
            delete value.terminosVersionAceptada;
            delete value.terminosAceptadosEn;
            return value;
        }
    }
});

module.exports = mongoose.model('Usuario', usuarioSchema);