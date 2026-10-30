const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const autenticarOpcional = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) return next();

    let decoded;
    try {
        if (!authorization.startsWith('Bearer ')) return next();
        decoded = jwt.verify(
            authorization.slice(7),
            process.env.JWT_SECRET
        );
    } catch {
        return next();
    }

    try {
        req.usuario = await Usuario.findById(decoded.id).select('-password');
    } catch (error) {
        return res.status(500).json({
            mensaje: 'No se pudo validar la sesión'
        });
    }

    return next();
};

module.exports = autenticarOpcional;
