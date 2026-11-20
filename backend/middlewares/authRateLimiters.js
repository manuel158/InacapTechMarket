const { ipKeyGenerator, rateLimit } = require('express-rate-limit');

function crearLimitador({ windowMs, limit, mensaje }) {
    return rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        keyGenerator(req) {
            const ip = ipKeyGenerator(req.ip || 'unknown');
            const correo = typeof req.body?.correo === 'string'
                ? req.body.correo.trim().toLowerCase()
                : '';
            return `${ip}:${correo || 'sin-correo'}`;
        },
        message: { mensaje }
    });
}

module.exports = {
    registro: crearLimitador({
        windowMs: 60 * 60 * 1000,
        limit: 3,
        mensaje: 'Demasiadas solicitudes de registro para este correo. Inténtalo más tarde.'
    }),
    verificacion: crearLimitador({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        mensaje: 'Demasiados intentos de verificación. Inténtalo más tarde.'
    }),
    inicioSesion: crearLimitador({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        mensaje: 'Demasiados intentos de inicio de sesión. Inténtalo más tarde.'
    }),
    recuperacion: crearLimitador({
        windowMs: 60 * 60 * 1000,
        limit: 3,
        mensaje: 'Demasiadas solicitudes de recuperación. Inténtalo más tarde.'
    }),
    restablecimiento: crearLimitador({
        windowMs: 15 * 60 * 1000,
        limit: 5,
        mensaje: 'Demasiados intentos de cambio de contraseña. Inténtalo más tarde.'
    })
};
