const express = require('express');
const protegerRuta = require('../middlewares/authMiddleware');
const {
    listarConversaciones,
    obtenerNoLeidos,
    iniciarConversacion,
    obtenerConversacion
} = require('../controllers/chatController');

const router = express.Router();

router.use(protegerRuta);
router.get('/no-leidos', obtenerNoLeidos);
router.get('/conversaciones', listarConversaciones);
router.post('/publicaciones/:publicacionId/conversacion', iniciarConversacion);
router.get('/conversaciones/:conversacionId', obtenerConversacion);

module.exports = router;
