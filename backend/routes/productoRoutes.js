const express = require('express');
const router = express.Router();

const upload = require('../middlewares/uploadMiddleware');
const {
    crearProducto,
    obtenerProductos,
    obtenerProductoPorId,
    obtenerPorCategoria,
    obtenerMisProductos,
    eliminarMiProducto,
    actualizarMiProducto,
    actualizarEstadoMiProducto
} = require('../controllers/productoController');

const protegerRuta = require('../middlewares/authMiddleware');
const autenticarOpcional = require('../middlewares/optionalAuthMiddleware');

router.patch(
    '/mis-publicaciones/:id/estado',
    protegerRuta,
    actualizarEstadoMiProducto
);
router.delete(
    '/mis-publicaciones/:id',
    protegerRuta,
    eliminarMiProducto
);
router.put(
    '/mis-publicaciones/:id',
    protegerRuta,
    upload.fields([
        { name: 'imagenes', maxCount: 3 },
        { name: 'imagen', maxCount: 1 }
    ]),
    actualizarMiProducto
);
router.get('/', obtenerProductos);
router.get('/mis-publicaciones', protegerRuta, obtenerMisProductos);
router.get('/categoria/:categoria', obtenerPorCategoria);
router.get('/:id', autenticarOpcional, obtenerProductoPorId);

router.post(
    '/',
    protegerRuta,
    upload.fields([
        { name: 'imagenes', maxCount: 3 },
        { name: 'imagen', maxCount: 1 }
    ]),
    crearProducto
);

module.exports = router;