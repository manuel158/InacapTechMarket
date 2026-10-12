const Producto = require('../models/Producto');

const crearProducto = async (req, res) => {

    try {

        const producto =
            await Producto.create({

                nombre:
                    req.body.nombre,

                descripcion:
                    req.body.descripcion,

                precio:
                    req.body.precio,

                categoria:
                    req.body.categoria,

                whatsapp:
                    req.body.whatsapp,

                comentario:
                    req.body.comentario,

                imagen:
                    req.file.path,

                usuario:
                    req.usuario._id

            });

        res.status(201).json(
            producto
        );

    } catch (error) {

        res.status(500).json({
            mensaje:
                error.message
        });

    }

};

const obtenerProductos = async (req, res) => {

    try {

        const productos = await Producto.find()
            .populate('usuario', 'nombre correo');

        res.json(productos);

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

const obtenerProductoPorId = async (req, res) => {

    try {

        const producto =
            await Producto.findById(req.params.id);

        if (!producto) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }

        res.json(producto);

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

const obtenerPorCategoria =
async (req, res) => {

    try {

        const productos =
            await Producto.find({
                categoria: req.params.categoria
            });

        res.json(productos);

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

const obtenerMisProductos = async (req, res) => {

    try {

        const productos =
            await Producto.find({
                usuario: req.usuario._id
            });

        res.json(productos);

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};
const eliminarMiProducto = async (req, res) => {

    try {

        const producto =
            await Producto.findById(
                req.params.id
            );

        if (!producto) {

            return res.status(404).json({
                mensaje:
                    'Producto no encontrado'
            });

        }

        if (
            producto.usuario.toString()
            !==
            req.usuario._id.toString()
        ) {

            return res.status(403).json({
                mensaje:
                    'No autorizado'
            });

        }

        await producto.deleteOne();

        res.json({
            mensaje:
                'Producto eliminado'
        });

    } catch (error) {

        res.status(500).json({
            mensaje:
                error.message
        });

    }

};

module.exports = {
    crearProducto,
    obtenerProductos,
    obtenerProductoPorId,
    obtenerPorCategoria,
    obtenerMisProductos,
    eliminarMiProducto
};

