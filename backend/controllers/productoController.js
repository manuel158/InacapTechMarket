const Producto = require('../models/Producto');
const categorias = require('../../shared/categories.json');

function categoriaValida(categoria, subcategoria) {
    let categoriaActual = categoria;
    if (['Material Académico', 'Tecnología'].includes(categoria) ||
        categorias.Trueques.includes(categoria)) {
        categoriaActual = 'Trueques';
    } else if (categoria === 'Vivienda') {
        categoriaActual = 'Vivienda y arriendo de cabañas';
    }
    const subcategoriasAntiguas = {
        'Avisos y Oportunidades': ['Prácticas profesionales'],
        'Comunidad y Recreación': ['Venta de entradas para eventos autorizados'],
        'Material Académico': [
            'Compra de libros usados',
            'Venta de libros usados',
            'Intercambio de libros',
            'Donación de libros',
            'Donación de materiales académicos',
            'Préstamo de libros'
        ]
    };
    if (categoria === 'Material Académico') {
        return subcategoriasAntiguas[categoria].includes(subcategoria);
    }
    return Object.prototype.hasOwnProperty.call(categorias, categoriaActual) &&
        (categorias[categoriaActual].includes(subcategoria) ||
            subcategoriasAntiguas[categoriaActual]?.includes(subcategoria));
}

function imagenesSubidas(req) {
    const files = req.files || {};
    return [...(files.imagenes || []), ...(files.imagen || [])];
}

function datosPermutaValidos(categoria, sePermutaPor) {
    const esTrueque = categoria === 'Trueques' ||
        ['Material Académico', 'Tecnología'].includes(categoria) ||
        categorias.Trueques.includes(categoria);
    return !esTrueque || Boolean(sePermutaPor?.trim());
}

const crearProducto = async (req, res) => {

    try {
        if (!categoriaValida(req.body.categoria, req.body.subcategoria)) {
            return res.status(400).json({
                mensaje: 'Selecciona una categoría y subcategoría válidas'
            });
        }

        if (!datosPermutaValidos(req.body.categoria, req.body.sePermutaPor)) {
            return res.status(400).json({
                mensaje: 'Indica qué producto aceptarías a cambio'
            });
        }

        const files = imagenesSubidas(req);
        if (!files.length || files.length > 3) {
            return res.status(400).json({
                mensaje: 'Debes subir entre 1 y 3 imágenes'
            });
        }

        const producto =
            await Producto.create({

                nombre:
                    req.body.nombre,

                descripcion:
                    req.body.descripcion,

                precio:
                    req.body.precio || 0,

                categoria:
                    req.body.categoria,

                subcategoria:
                    req.body.subcategoria,

                whatsapp:
                    '',

                comentario:
                    req.body.comentario,

                imagen:
                    files[0].path,

                imagenes:
                    files.map(file => file.path),

                sePermutaPor:
                    req.body.sePermutaPor,

                detalleCategoria:
                    req.body.detalleCategoria,

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
            !producto.usuario ||
            producto.usuario.toString() !== req.usuario._id.toString()
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

const actualizarMiProducto = async (req, res) => {

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
            !producto.usuario ||
            producto.usuario.toString() !== req.usuario._id.toString()
        ) {

            return res.status(403).json({
                mensaje:
                    'No autorizado'
            });

        }

        if (!categoriaValida(req.body.categoria, req.body.subcategoria)) {
            return res.status(400).json({
                mensaje: 'Selecciona una categoría y subcategoría válidas'
            });
        }

        if (!datosPermutaValidos(req.body.categoria, req.body.sePermutaPor)) {
            return res.status(400).json({
                mensaje: 'Indica qué producto aceptarías a cambio'
            });
        }

        producto.nombre = req.body.nombre;
        producto.descripcion = req.body.descripcion;
        producto.precio = req.body.precio || 0;
        producto.categoria = req.body.categoria;
        producto.subcategoria = req.body.subcategoria;
        producto.comentario = req.body.comentario;
        producto.sePermutaPor = req.body.sePermutaPor || '';
        producto.detalleCategoria = req.body.detalleCategoria || '';

        const files = imagenesSubidas(req);
        if (files.length > 3) {
            return res.status(400).json({
                mensaje: 'Puedes subir como máximo 3 imágenes'
            });
        }
        if (files.length) {
            producto.imagen = files[0].path;
            producto.imagenes = files.map(file => file.path);
        }

        await producto.save();

        res.json(producto);

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
    eliminarMiProducto,
    actualizarMiProducto
};
