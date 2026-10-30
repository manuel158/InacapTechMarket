const mongoose = require('mongoose');

const conversacionSchema = new mongoose.Schema({
    publication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    interested: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    sellerUnreadCount: {
        type: Number,
        default: 0,
        min: 0
    },
    interestedUnreadCount: {
        type: Number,
        default: 0,
        min: 0
    },
    firstMessageEmailClaimed: {
        type: Boolean,
        default: false
    },
    firstMessageEmailSent: {
        type: Boolean,
        default: false
    },
    lastMessage: {
        text: {
            type: String,
            maxlength: 2000
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario'
        },
        createdAt: Date
    }
}, {
    timestamps: true
});

conversacionSchema.index(
    { publication: 1, interested: 1 },
    { unique: true }
);

module.exports = mongoose.model('Conversacion', conversacionSchema);
