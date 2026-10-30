const Conversacion = require('../models/Conversacion');

function userRoom(usuarioId) {
    return `usuario:${usuarioId}`;
}

async function obtenerCantidadNoLeidos(usuarioId) {
    const conversaciones = await Conversacion.find({
        $or: [
            { seller: usuarioId },
            { interested: usuarioId }
        ],
        hiddenFor: { $ne: usuarioId }
    })
        .select('seller sellerUnreadCount interestedUnreadCount')
        .lean();

    return conversaciones.reduce((total, conversacion) => {
        const esVendedor = conversacion.seller.toString() === usuarioId.toString();
        return total + (esVendedor
            ? conversacion.sellerUnreadCount || 0
            : conversacion.interestedUnreadCount || 0);
    }, 0);
}

async function emitirCantidadNoLeidos(io, usuarioId) {
    const count = await obtenerCantidadNoLeidos(usuarioId);
    io.to(userRoom(usuarioId)).emit('chat:unread-count', { count });
}

module.exports = {
    userRoom,
    obtenerCantidadNoLeidos,
    emitirCantidadNoLeidos
};
