const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { getSessionToken } = require('../utils/sessionCookie');

const protegerRuta = async (req, res, next) => {

    try {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            token = getSessionToken(req.headers.cookie);
        }

        if (!token) {
            return res.status(401).json({
                mensaje: 'No autorizado'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = await Usuario.findById(
            decoded.id
        ).select('-password');

        if (!req.usuario) {
            return res.status(401).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        if (req.usuario.activo === false) {
            return res.status(403).json({
                mensaje: 'La cuenta está desactivada. Contacta a administración para solicitar su reactivación.'
            });
        }

        next();

    } catch (error) {

        return res.status(401).json({
            mensaje: 'Token inválido'
        });

    }

};

module.exports = protegerRuta;