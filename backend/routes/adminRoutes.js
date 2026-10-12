const express = require('express');

const router = express.Router();

const {
    listarUsuarios,
    listarProductos,
    eliminarProducto
} = require('../controllers/adminController');

const protegerRuta =
    require('../middlewares/authMiddleware');

const esAdministrador =
    require('../middlewares/adminMiddleware');

router.get(
    '/usuarios',
    protegerRuta,
    esAdministrador,
    listarUsuarios
);

router.get(
    '/productos',
    protegerRuta,
    esAdministrador,
    listarProductos
);

router.delete(
    '/producto/:id',
    protegerRuta,
    esAdministrador,
    eliminarProducto
);

module.exports = router;