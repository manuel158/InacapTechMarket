const express = require('express');

const router = express.Router();

const {
    listarUsuarios,
    eliminarUsuario,
    listarProductos,
    eliminarProducto,
    revisarProducto
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

router.delete(
    '/usuario/:id',
    protegerRuta,
    esAdministrador,
    eliminarUsuario
);

router.get(
    '/productos',
    protegerRuta,
    esAdministrador,
    listarProductos
);

router.patch(
    '/producto/:id/revision',
    protegerRuta,
    esAdministrador,
    revisarProducto
);

router.delete(
    '/producto/:id',
    protegerRuta,
    esAdministrador,
    eliminarProducto
);

module.exports = router;