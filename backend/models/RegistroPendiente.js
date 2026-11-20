const mongoose = require('mongoose');

const registroPendienteSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    codigoHash: { type: String, required: true, select: false },
    intentos: { type: Number, default: 0 },
    whatsapp: { type: String, default: '' },
    tipoIntegrante: { type: String, required: true },
    sede: { type: String, required: true },
    sexo: { type: String, default: '' },
    fechaNacimiento: { type: String, required: true },
    terminosVersionAceptada: { type: String, required: true },
    terminosAceptadosEn: { type: Date, required: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true });

registroPendienteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
registroPendienteSchema.index({ codigoHash: 1 });

module.exports = mongoose.model('RegistroPendiente', registroPendienteSchema);
