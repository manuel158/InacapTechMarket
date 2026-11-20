const express = require('express');

const router = express.Router();

const {
    listarUsuarios,
    reactivarUsuario,
    eliminarUsuario,
    listarProductos,
    contarPublicacionesPendientes,
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

router.patch(
    '/usuario/:id/reactivar',
    protegerRuta,
    esAdministrador,
    reactivarUsuario
);

router.get(
    '/productos',
    protegerRuta,
    esAdministrador,
    listarProductos
);

router.get(
    '/productos/pendientes/count',
    protegerRuta,
    esAdministrador,
    contarPublicacionesPendientes
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