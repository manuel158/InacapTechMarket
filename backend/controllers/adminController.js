const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');

const listarUsuarios = async (req, res) => {

    try {

        const usuarios =
            await Usuario.find()
            .select('-password');

        res.json(usuarios);

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

const listarProductos = async (req, res) => {

    try {

        const productos =
            await Producto.find();

        res.json(productos);

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

const eliminarProducto = async (req, res) => {

    try {

        const producto =
            await Producto.findById(
                req.params.id
            );

        if (!producto) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }

        await producto.deleteOne();

        res.json({
            mensaje: 'Producto eliminado'
        });

    } catch (error) {

        res.status(500).json({
            mensaje: error.message
        });

    }

};

module.exports = {
    listarUsuarios,
    listarProductos,
    eliminarProducto
};