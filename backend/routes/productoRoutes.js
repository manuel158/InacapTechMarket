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
    actualizarMiProducto
} = require('../controllers/productoController');

const protegerRuta = require('../middlewares/authMiddleware');

router.delete(
    '/mis-publicaciones/:id',
    protegerRuta,
    eliminarMiProducto
);
router.put(
    '/mis-publicaciones/:id',
    protegerRuta,
    upload.single('imagen'),
    actualizarMiProducto
);
router.get('/', obtenerProductos);
router.get('/mis-publicaciones', protegerRuta, obtenerMisProductos);
router.get('/categoria/:categoria', obtenerPorCategoria);
router.get('/:id', obtenerProductoPorId);

router.post('/', protegerRuta, upload.single('imagen'), crearProducto);

module.exports = router;