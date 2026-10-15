const transporter =
require('../config/emailConfig');

const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

const solicitarRecuperacionPassword = async (req, res) => {
    const mensaje =
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';

    try {
        const correoIngresado = req.body?.correo;
        const correo = typeof correoIngresado === 'string'
            ? correoIngresado.trim().toLowerCase()
            : '';

        if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return res.status(400).json({
                mensaje: 'Ingresa un correo válido'
            });
        }

        const usuario = await Usuario.findOne({ correo });

        if (usuario) {
            const token = crypto.randomBytes(32).toString('hex');
            usuario.resetPasswordToken = crypto
                .createHash('sha256')
                .update(token)
                .digest('hex');
            usuario.resetPasswordExpires =
                new Date(Date.now() + 30 * 60 * 1000);
            await usuario.save();

            const appUrl =
                (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`)
                    .replace(/\/+$/, '');
            const enlace =
                `${appUrl}/paginas/recuperarContrasena.html?token=${token}`;

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: correo,
                    subject: 'Recupera tu contraseña',
                    text: `Hola ${usuario.nombre},\n\nUsa este enlace para cambiar tu contraseña. Expira en 30 minutos y solo puede utilizarse una vez:\n\n${enlace}\n\nSi no solicitaste este cambio, ignora este correo.`
                });
            } catch (error) {
                console.error('No se pudo enviar el correo de recuperación:', error);
            }
        }

        return res.json({ mensaje });
    } catch (error) {
        console.error('Error al solicitar recuperación de contraseña:', error);
        return res.status(500).json({
            mensaje: 'No se pudo procesar la solicitud. Inténtalo nuevamente.'
        });
    }
};

const restablecerPassword = async (req, res) => {
    try {
        const { token, password } = req.body || {};

        if (
            typeof token !== 'string' ||
            typeof password !== 'string' ||
            password.length < 8
        ) {
            return res.status(400).json({
                mensaje: 'El enlace o la contraseña no son válidos'
            });
        }

        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        const usuarioPendiente = await Usuario.findOne({
            resetPasswordToken: tokenHash,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!usuarioPendiente) {
            return res.status(400).json({
                mensaje: 'El enlace expiró o ya fue utilizado. Solicita uno nuevo.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const usuario = await Usuario.findOneAndUpdate(
            {
                resetPasswordToken: tokenHash,
                resetPasswordExpires: { $gt: new Date() }
            },
            {
                $set: { password: passwordHash },
                $unset: {
                    resetPasswordToken: 1,
                    resetPasswordExpires: 1
                }
            },
            { new: true }
        );

        if (!usuario) {
            return res.status(400).json({
                mensaje: 'El enlace expiró o ya fue utilizado. Solicita uno nuevo.'
            });
        }

        return res.json({
            mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.'
        });
    } catch (error) {
        console.error('Error al restablecer la contraseña:', error);
        return res.status(500).json({
            mensaje: 'No se pudo restablecer la contraseña. Inténtalo nuevamente.'
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
    verificarCuenta,
    solicitarRecuperacionPassword,
    restablecerPassword
};