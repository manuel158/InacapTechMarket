const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { getSessionToken } = require('../utils/sessionCookie');

const autenticarOpcional = async (req, res, next) => {
    const authorization = req.headers.authorization;
    const tokens = [];
    if (authorization?.startsWith('Bearer ')) {
        tokens.push(authorization.slice(7));
    }

    try {
        const cookieToken = getSessionToken(req.headers.cookie);
        if (cookieToken) tokens.push(cookieToken);
    } catch {
        if (!tokens.length) return next();
    }

    let decoded = null;
    for (const token of tokens) {
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            break;
        } catch {
            continue;
        }
    }
    if (!decoded) return next();

    try {
        req.usuario = await Usuario.findById(decoded.id).select('-password');
        if (req.usuario?.activo === false) {
            req.usuario = null;
        }
    } catch (error) {
        return res.status(500).json({
            mensaje: 'No se pudo validar la sesión'
        });
    }

    return next();
};

module.exports = autenticarOpcional;
