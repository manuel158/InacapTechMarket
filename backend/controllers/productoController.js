const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const categorias = require('../../shared/categories.json');
const { notificarNuevaPublicacionPendiente } = require('../utils/adminNotifications');
const condicionesProducto = [
    'nuevo',
    'usado-excelente',
    'usado-buen-estado',
    'usado-aceptable'
];

const publicacionesVisibles = {
    $or: [
        { estado: 'aprobada' },
        { estado: { $exists: false } }
    ]
};

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
    return !esCategoriaTrueque(categoria) || Boolean(sePermutaPor?.trim());
}

function esCategoriaTrueque(categoria) {
    return categoria === 'Trueques' ||
        ['Material Académico', 'Tecnología'].includes(categoria) ||
        categorias.Trueques.includes(categoria);
}

function condicionValida(categoria, condicion) {
    return !esCategoriaTrueque(categoria) ||
        condicionesProducto.includes(condicion);
}

async function buscarPublicacionesVisibles(filtro = {}) {
    const usuariosInactivos = await Usuario.find({ activo: false }).distinct('_id');
    const consulta = { ...publicacionesVisibles, ...filtro };
    if (usuariosInactivos.length) {
        consulta.usuario = { $nin: usuariosInactivos };
    }
    return Producto.find(consulta).populate('usuario', 'nombre correo activo');
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

        if (!condicionValida(req.body.categoria, req.body.condicion)) {
            return res.status(400).json({
                mensaje: 'Selecciona la condición del producto'
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

                condicion:
                    esCategoriaTrueque(req.body.categoria) ? req.body.condicion : '',

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

                estado:
                    'pendiente',

                usuario:
                    req.usuario._id

            });

        void notificarNuevaPublicacionPendiente(producto);
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

        const productos = await buscarPublicacionesVisibles();

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
            await Producto.findById(req.params.id)
                .select('+motivoRechazo');

        if (!producto) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }

        const propietario = req.usuario &&
            producto.usuario?.toString() === req.usuario._id.toString();
        const administrador = req.usuario?.rol === 'admin';
        const usuarioActivo = administrador || await Usuario.exists({
            _id: producto.usuario,
            activo: { $ne: false }
        });
        const publicacionVisible = producto.estado === 'aprobada' ||
            producto.estado === undefined;
        if ((!publicacionVisible || !usuarioActivo) && !propietario && !administrador) {
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

        const productos = await buscarPublicacionesVisibles({
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
            }).select('+motivoRechazo');

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

        if (!condicionValida(req.body.categoria, req.body.condicion)) {
            return res.status(400).json({
                mensaje: 'Selecciona la condición del producto'
            });
        }

        producto.nombre = req.body.nombre;
        producto.descripcion = req.body.descripcion;
        producto.precio = req.body.precio || 0;
        producto.categoria = req.body.categoria;
        producto.subcategoria = req.body.subcategoria;
        producto.condicion = esCategoriaTrueque(req.body.categoria)
            ? req.body.condicion
            : '';
        producto.comentario = req.body.comentario;
        producto.sePermutaPor = req.body.sePermutaPor || '';
        producto.detalleCategoria = req.body.detalleCategoria || '';
        producto.estado = 'pendiente';
        producto.motivoRechazo = '';
        producto.revisadoEn = null;
        producto.revisadoPor = null;

        const files = imagenesSubidas(req);
        const imagenesActuales = producto.imagenes?.length
            ? producto.imagenes
            : [producto.imagen].filter(Boolean);
        let imagenesFinales;

        if (req.body.imagenesMantener !== undefined) {
            let imagenesMantener;
            try {
                imagenesMantener = JSON.parse(req.body.imagenesMantener);
            } catch {
                return res.status(400).json({
                    mensaje: 'La selección de imágenes existentes no es válida'
                });
            }

            if (
                !Array.isArray(imagenesMantener) ||
                imagenesMantener.some(image =>
                    typeof image !== 'string' || !imagenesActuales.includes(image)
                ) ||
                new Set(imagenesMantener).size !== imagenesMantener.length
            ) {
                return res.status(400).json({
                    mensaje: 'La selección de imágenes existentes no es válida'
                });
            }
            imagenesFinales = [
                ...imagenesMantener,
                ...files.map(file => file.path)
            ];
        } else if (files.length) {
            imagenesFinales = files.map(file => file.path);
        }

        if (imagenesFinales && (!imagenesFinales.length || imagenesFinales.length > 3)) {
            return res.status(400).json({
                mensaje: imagenesFinales.length
                    ? 'Puedes guardar como máximo 3 imágenes'
                    : 'Debes conservar o agregar al menos una imagen'
            });
        }

        if (imagenesFinales) {
            producto.imagen = imagenesFinales[0];
            producto.imagenes = imagenesFinales;
        }

        await producto.save();

        void notificarNuevaPublicacionPendiente(producto);
        res.json(producto);

    } catch (error) {

        res.status(500).json({
            mensaje:
                error.message
        });

    }

};

const actualizarEstadoMiProducto = async (req, res) => {
    try {
        const estadoSolicitado = req.body?.estado;
        const producto = await Producto.findOne({
            _id: req.params.id,
            usuario: req.usuario._id
        });

        if (!producto) {
            return res.status(404).json({
                mensaje: 'No se encontró la publicación en tu cuenta'
            });
        }

        if ((!producto.estado || producto.estado === 'aprobada') &&
            estadoSolicitado === 'pausada') {
            producto.estado = 'pausada';
        } else if (producto.estado === 'pausada' && estadoSolicitado === 'aprobada') {
            producto.estado = 'aprobada';
        } else {
            return res.status(400).json({
                mensaje: 'Solo puedes pausar una publicación aprobada o reactivar una pausada'
            });
        }

        await producto.save();
        return res.json(producto);
    } catch (error) {
        return res.status(500).json({
            mensaje: error.message
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
    actualizarMiProducto,
    actualizarEstadoMiProducto
};
