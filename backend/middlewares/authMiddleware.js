const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

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

        next();

    } catch (error) {

        return res.status(401).json({
            mensaje: 'Token inválido'
        });

    }

};

module.exports = protegerRuta;