const express = require('express');
const router = express.Router();

const {
    registrarUsuario,
    loginUsuario,
    verificarCuenta,
    solicitarRecuperacionPassword,
    restablecerPassword
} = require('../controllers/authController');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/verificar', verificarCuenta);
router.post('/recuperar-password', solicitarRecuperacionPassword);
router.post('/restablecer-password', restablecerPassword);

module.exports = router;