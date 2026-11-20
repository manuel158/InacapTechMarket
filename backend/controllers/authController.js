const enviarCorreo =
require('../config/emailConfig');

const Usuario = require('../models/Usuario');
const RegistroPendiente = require('../models/RegistroPendiente');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
    serializeClearedSessionCookie,
    serializeSessionCookie
} = require('../utils/sessionCookie');
const generarCodigo = require('../utils/generarCodigo');
const terms = require('../../shared/terms.json');
const DURACION_CODIGO_MS = 15 * 60 * 1000;
const MAX_INTENTOS_CODIGO = 5;
const ORIGENES_NATIVOS = new Set([
    'capacitor://localhost',
    'http://localhost',
    'https://localhost'
]);

const hashCodigo = codigo =>
    crypto.createHash('sha256').update(codigo).digest('hex');

const codigoCoincide = (codigo, codigoHash) => {
    const hashRecibido = Buffer.from(hashCodigo(codigo), 'hex');
    const hashAlmacenado = Buffer.from(codigoHash, 'hex');
    return hashRecibido.length === hashAlmacenado.length &&
        crypto.timingSafeEqual(hashRecibido, hashAlmacenado);
};

const passwordValida = password =>
    typeof password === 'string' &&
    password.length >= 8 &&
    Buffer.byteLength(password, 'utf8') <= 72;

function esSolicitudNativa(req) {
    return ORIGENES_NATIVOS.has(req.get('origin'));
}

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
            password,
            whatsapp,
            tipoIntegrante,
            sede,
            sexo,
            fechaNacimiento,
            aceptaTerminos
        } = req.body;
        const correoNormalizado = typeof correo === 'string'
            ? correo.trim().toLowerCase()
            : '';

        if (!passwordValida(password)) {
            return res.status(400).json({
                mensaje: 'La contraseña debe tener al menos 8 caracteres y un máximo de 72 bytes'
            });
        }

        const tiposIntegrante = ['estudiante', 'profesor', 'funcionario'];
        const sexosPermitidos = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decirlo', ''];
        const fechaNacimientoDate = typeof fechaNacimiento === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)
            ? new Date(`${fechaNacimiento}T00:00:00.000Z`)
            : null;
        const fechaNacimientoValida = typeof fechaNacimiento === 'string' &&
            fechaNacimientoDate &&
            !Number.isNaN(fechaNacimientoDate.getTime()) &&
            fechaNacimientoDate.toISOString().slice(0, 10) === fechaNacimiento &&
            fechaNacimientoDate < new Date();
        if (
            !tiposIntegrante.includes(tipoIntegrante) ||
            sede !== 'Valdivia' ||
            !sexosPermitidos.includes(sexo || '') ||
            !fechaNacimientoValida ||
            aceptaTerminos !== true ||
            (whatsapp !== undefined &&
                (typeof whatsapp !== 'string' || whatsapp.trim().length > 20))
        ) {
            return res.status(400).json({
                mensaje: 'Revisa los datos de perfil ingresados'
            });
        }

        if (!correoNormalizado.endsWith('@inacapmail.cl')) {
            return res.status(400).json({
                mensaje: 'Debe utilizar un correo @inacapmail.cl'
            });
        }

        const existeUsuario =
            await Usuario.findOne({ correo: correoNormalizado });

        if (existeUsuario) {
            return res.status(400).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        const codigoVerificacion = generarCodigo();
        const passwordHash = await bcrypt.hash(password, 10);
        const registroPendiente = {
            nombre,
            correo: correoNormalizado,
            password: passwordHash,
            codigoHash: hashCodigo(codigoVerificacion),
            intentos: 0,
            whatsapp: whatsapp?.trim() || '',
            tipoIntegrante,
            sede,
            sexo: sexo || '',
            fechaNacimiento,
            terminosVersionAceptada: terms.version,
            terminosAceptadosEn: new Date(),
            expiresAt: new Date(Date.now() + DURACION_CODIGO_MS)
        };

        await RegistroPendiente.findOneAndUpdate(
            { correo: correoNormalizado },
            { $set: registroPendiente },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );

        await enviarCorreo({
            toEmail: correoNormalizado,
            toName: nombre,
            subject: 'Código de verificación',
            message: `Tu código de verificación es: ${codigoVerificacion}`
        });

        res.status(200).json({
            mensaje: 'Código enviado al correo. Tienes 15 minutos para verificar la cuenta.'
        });

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

const verificarCuenta = async (req, res) => {

    try {

        const { codigo, correo } = req.body || {};
        const correoNormalizado = typeof correo === 'string'
            ? correo.trim().toLowerCase()
            : '';
        if (
            (correo !== undefined && !correoNormalizado) ||
            typeof codigo !== 'string' ||
            !/^\d{6}$/.test(codigo)
        ) {
            return res.status(400).json({
                mensaje: 'El correo o código de verificación no son válidos'
            });
        }

        const filtroRegistro = {
            expiresAt: { $gt: new Date() }
        };
        let registro;
        if (correoNormalizado) {
            filtroRegistro.correo = correoNormalizado;
            registro = await RegistroPendiente.findOne(filtroRegistro)
                .select('+password +codigoHash');
        } else {
            filtroRegistro.codigoHash = hashCodigo(codigo);
            const registros = await RegistroPendiente.find(filtroRegistro)
                .limit(2)
                .select('+password +codigoHash');
            registro = registros.length === 1 ? registros[0] : null;
        }

        if (!registro) {
            return res.status(400).json({
                mensaje:
                    'No existe registro pendiente'
            });
        }

        if (!codigoCoincide(codigo, registro.codigoHash)) {
            const intento = await RegistroPendiente.findOneAndUpdate(
                {
                    _id: registro._id,
                    expiresAt: { $gt: new Date() },
                    intentos: { $lt: MAX_INTENTOS_CODIGO }
                },
                { $inc: { intentos: 1 } },
                { new: true }
            );
            if (intento?.intentos >= MAX_INTENTOS_CODIGO) {
                await RegistroPendiente.deleteOne({ _id: registro._id });
            }
            return res.status(400).json({
                mensaje:
                    'Código incorrecto o expirado'
            });
        }

        await Usuario.create({
            nombre: registro.nombre,
            correo: registro.correo,
            password: registro.password,
            whatsapp: registro.whatsapp,
            tipoIntegrante: registro.tipoIntegrante,
            sede: registro.sede,
            sexo: registro.sexo,
            fechaNacimiento: registro.fechaNacimiento,
            terminosVersionAceptada: registro.terminosVersionAceptada,
            terminosAceptadosEn: registro.terminosAceptadosEn,
            verificado: true
        });

        await RegistroPendiente.deleteOne({ _id: registro._id });

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
                `${appUrl}/#/recuperar-password?token=${encodeURIComponent(token)}`;

            try {
                await enviarCorreo({
                    toEmail: correo,
                    toName: usuario.nombre,
                    subject: 'Recupera tu contraseña',
                    message: `Hola ${usuario.nombre},\n\nUsa este enlace para cambiar tu contraseña. Expira en 30 minutos y solo puede utilizarse una vez:\n\n${enlace}\n\nSi no solicitaste este cambio, ignora este correo.`
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
            !passwordValida(password)
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

function enmascararWhatsapp(whatsapp) {
    const digits = String(whatsapp || '').replace(/\D/g, '');
    if (!digits) return '';

    const visiblePrefixLength = Math.min(3, Math.max(digits.length - 2, 0));
    const hiddenLength = Math.max(digits.length - visiblePrefixLength - 2, 0);
    const prefix = String(whatsapp).trim().startsWith('+') ? '+' : '';

    return `${prefix}${digits.slice(0, visiblePrefixLength)}${'*'.repeat(hiddenLength)}${digits.slice(-2)}`;
}

const obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario._id)
            .select('nombre correo rol +whatsapp +tipoIntegrante +sede +sexo');

        if (!usuario || usuario.activo === false) {
            return res.status(404).json({
                mensaje: 'No se encontró el perfil'
            });
        }

        return res.json({
            id: usuario._id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol,
            whatsapp: enmascararWhatsapp(usuario.whatsapp),
            tipoIntegrante: usuario.tipoIntegrante || '',
            sede: usuario.sede || '',
            sexo: usuario.sexo || ''
        });
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        return res.status(500).json({
            mensaje: 'No se pudo cargar el perfil'
        });
    }
};

const desactivarCuenta = async (req, res) => {
    try {
        const { password } = req.body || {};
        if (typeof password !== 'string' || !password) {
            return res.status(400).json({
                mensaje: 'Ingresa tu contraseña para confirmar la baja'
            });
        }

        const usuario = await Usuario.findById(req.usuario._id).select('+password');
        if (!usuario || usuario.activo === false) {
            return res.status(404).json({
                mensaje: 'No se encontró una cuenta activa'
            });
        }

        const coincidePassword = await bcrypt.compare(password, usuario.password);
        if (!coincidePassword) {
            return res.status(401).json({
                mensaje: 'La contraseña no es correcta'
            });
        }

        usuario.activo = false;
        await usuario.save();

        const io = req.app.get('io');
        if (io) {
            io.in(`usuario:${usuario._id}`).disconnectSockets(true);
        }

        return res.json({
            mensaje: 'Cuenta desactivada. Tus publicaciones se ocultaron y el historial de conversaciones se conservó. Contacta a administración para solicitar la reactivación.'
        });
    } catch (error) {
        console.error('Error al desactivar cuenta:', error);
        return res.status(500).json({
            mensaje: 'No se pudo desactivar la cuenta'
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

        if (usuario.activo === false) {
            return res.status(403).json({
                mensaje: 'La cuenta está desactivada. Contacta a administración para solicitar su reactivación.'
            });
        }

        if (!usuario.verificado) {
            return res.status(403).json({
                mensaje: 'Debe verificar la cuenta'
            });
        }

        const token = generarToken(usuario._id, usuario.rol);
        const datosUsuario = {
            id: usuario._id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol
        };

        if (esSolicitudNativa(req)) {
            return res.json({ ...datosUsuario, token });
        }

        res.setHeader(
            'Set-Cookie',
            serializeSessionCookie(token, req.secure)
        );
        return res.json(datosUsuario);

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

const cerrarSesion = (req, res) => {
    res.setHeader(
        'Set-Cookie',
        serializeClearedSessionCookie(req.secure)
    );
    return res.sendStatus(204);
};

module.exports = {
    registrarUsuario,
    loginUsuario,
    verificarCuenta,
    solicitarRecuperacionPassword,
    restablecerPassword,
    cerrarSesion,
    obtenerPerfil,
    desactivarCuenta
};