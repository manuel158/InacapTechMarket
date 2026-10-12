const transporter =
require('../config/emailConfig');

const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generarToken = (id, rol) => {
    return jwt.sign(
        {
            id,
            rol
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d'
        }
    );
};

const registrarUsuario = async (req, res) => {

    try {

        const {
            nombre,
            correo,
            password
        } = req.body;

        if (!correo.endsWith('@inacapmail.cl')) {
            return res.status(400).json({
                mensaje: 'Debe utilizar un correo @inacapmail.cl'
            });
        }

        const existeUsuario =
            await Usuario.findOne({ correo });

        if (existeUsuario) {
            return res.status(400).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        const codigoVerificacion =
            Math.floor(
                1000 + Math.random() * 9000
            ).toString();

        global.registroTemporal = {
            nombre,
            correo,
            password,
            codigoVerificacion
        };

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: correo,

            subject: 'Código de verificación',

            text:
                `Tu código es: ${codigoVerificacion}`

        });

        res.status(200).json({

            mensaje:
                'Código enviado al correo'

        });

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

const verificarCuenta = async (req, res) => {

    try {

        const { codigo } = req.body;

        if (
            !global.registroTemporal
        ) {
            return res.status(400).json({
                mensaje:
                    'No existe registro pendiente'
            });
        }

        if (
            codigo !==
            global.registroTemporal.codigoVerificacion
        ) {
            return res.status(400).json({
                mensaje:
                    'Código incorrecto'
            });
        }

        const salt =
            await bcrypt.genSalt(10);

        const passwordHash =
            await bcrypt.hash(
                global.registroTemporal.password,
                salt
            );

        const usuario =
            await Usuario.create({

                nombre:
                    global.registroTemporal.nombre,

                correo:
                    global.registroTemporal.correo,

                password:
                    passwordHash,

                verificado: true

            });

        global.registroTemporal = null;

        res.status(201).json({

            mensaje:
                'Usuario creado correctamente'

        });

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};



const loginUsuario = async (req, res) => {

    try {

        const {
            correo,
            password
        } = req.body;

        const usuario = await Usuario.findOne({
            correo
        });

        if (!usuario) {
            return res.status(401).json({
                mensaje: 'Credenciales incorrectas'
            });
        }

        const coincidePassword =
            await bcrypt.compare(
                password,
                usuario.password
            );

        if (!coincidePassword) {
            return res.status(401).json({
                mensaje: 'Credenciales incorrectas'
            });
        }

        if (!usuario.verificado) {
            return res.status(403).json({
                mensaje: 'Debe verificar la cuenta'
            });
        }

        res.json({
            id: usuario._id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            token: generarToken(
                usuario._id,
                usuario.rol
            )
        });

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

module.exports = {
    registrarUsuario,
    loginUsuario,
    verificarCuenta
};