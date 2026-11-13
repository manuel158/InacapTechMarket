const express = require('express');
const router = express.Router();

const {
    registrarUsuario,
    loginUsuario,
    verificarCuenta,
    solicitarRecuperacionPassword,
    restablecerPassword,
    obtenerPerfil,
    desactivarCuenta
} = require('../controllers/authController');
const protegerRuta = require('../middlewares/authMiddleware');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/verificar', verificarCuenta);
router.post('/recuperar-password', solicitarRecuperacionPassword);
router.post('/restablecer-password', restablecerPassword);
router.get('/perfil', protegerRuta, obtenerPerfil);
router.delete('/cuenta', protegerRuta, desactivarCuenta);

module.exports = router;