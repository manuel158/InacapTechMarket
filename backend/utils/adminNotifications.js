const Usuario = require('../models/Usuario');
const enviarCorreo = require('../config/emailConfig');

async function notificarNuevaPublicacionPendiente(producto) {
    try {
        const administradores = await Usuario.find({
            rol: 'admin',
            activo: { $ne: false }
        }).select('nombre correo');

        if (!administradores.length) {
            console.warn(
                `No hay administradores activos para notificar la publicación ${producto._id}`
            );
            return;
        }

        const frontendUrl = (
            process.env.FRONTEND_URL || 'https://inacaptechmarket.onrender.com'
        ).replace(/\/+$/, '');
        const enlacePanel = `${frontendUrl}/#/admin?seccion=publicaciones`;
        const subcategoria = producto.subcategoria
            ? ` · ${producto.subcategoria}`
            : '';
        const message = [
            `La publicación "${producto.nombre}" está pendiente de revisión.`,
            `Categoría: ${producto.categoria}${subcategoria}.`,
            `Abre el panel de administración para revisarla: ${enlacePanel}`
        ].join('\n');

        const resultados = await Promise.allSettled(administradores.map(administrador =>
            enviarCorreo({
                toEmail: administrador.correo,
                toName: administrador.nombre,
                subject: 'Nueva publicación pendiente de revisión',
                message
            })
        ));
        const fallidos = resultados.filter(resultado => resultado.status === 'rejected');

        if (fallidos.length) {
            console.error(
                `No se pudieron enviar ${fallidos.length} de ${administradores.length} avisos de revisión para la publicación ${producto._id}:`,
                fallidos.map(resultado => resultado.reason instanceof Error
                    ? resultado.reason.message
                    : String(resultado.reason))
            );
        }
    } catch (error) {
        console.error(
            `No se pudo notificar a los administradores sobre la publicación ${producto._id}:`,
            error instanceof Error ? error.message : String(error)
        );
    }
}

module.exports = { notificarNuevaPublicacionPendiente };
