const express = require('express');
const protegerRuta = require('../middlewares/authMiddleware');
const {
    listarConversaciones,
    iniciarConversacion,
    obtenerConversacion
} = require('../controllers/chatController');

const router = express.Router();

router.use(protegerRuta);
router.get('/conversaciones', listarConversaciones);
router.post('/publicaciones/:publicacionId/conversacion', iniciarConversacion);
router.get('/conversaciones/:conversacionId', obtenerConversacion);

module.exports = router;
