const express = require('express');
const router = express.Router();

const {
    registrarUsuario,
    loginUsuario,
    verificarCuenta,
    solicitarRecuperacionPassword,
    restablecerPassword,
    cerrarSesion,
    obtenerPerfil,
    desactivarCuenta
} = require('../controllers/authController');
const protegerRuta = require('../middlewares/authMiddleware');
const limitadores = require('../middlewares/authRateLimiters');

router.post('/registro', limitadores.registro, registrarUsuario);
router.post('/login', limitadores.inicioSesion, loginUsuario);
router.post('/verificar', limitadores.verificacion, verificarCuenta);
router.post('/recuperar-password', limitadores.recuperacion, solicitarRecuperacionPassword);
router.post('/restablecer-password', limitadores.restablecimiento, restablecerPassword);
router.post('/logout', cerrarSesion);
router.get('/perfil', protegerRuta, obtenerPerfil);
router.delete('/cuenta', protegerRuta, desactivarCuenta);

module.exports = router;