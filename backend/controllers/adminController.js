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

const eliminarUsuario = async (req, res) => {

    try {

        if (
            req.usuario._id.toString() === req.params.id
        ) {
            return res.status(400).json({
                mensaje: 'No puedes eliminar tu propia cuenta'
            });
        }

        const usuario =
            await Usuario.findById(
                req.params.id
            );

        if (!usuario) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        await usuario.deleteOne();

        res.json({
            mensaje: 'Usuario eliminado'
        });

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
    eliminarUsuario,
    listarProductos,
    eliminarProducto
};