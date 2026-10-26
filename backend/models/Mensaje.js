const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversacion',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});

mensajeSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Mensaje', mensajeSchema);
