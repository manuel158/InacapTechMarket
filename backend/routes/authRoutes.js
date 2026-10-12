const express = require('express');
const router = express.Router();

const {
    registrarUsuario,
    loginUsuario,
    verificarCuenta
} = require('../controllers/authController');

router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/verificar', verificarCuenta);

module.exports = router;