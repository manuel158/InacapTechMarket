const assert = require('node:assert/strict');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');

const ownerId = 'owner-1';
const product = {
    _id: 'product-1',
    nombre: 'Memoria RAM',
    estado: 'pendiente',
    usuario: { toString: () => ownerId }
};
const owner = {
    _id: { toString: () => ownerId },
    rol: 'usuario',
    activo: true
};
const usuarioMock = {
    findById() {
        return { select: async () => owner };
    },
    async exists() {
        return null;
    }
};
const productoMock = {
    findById() {
        return { select: async () => product };
    }
};

function reemplazarModulo(ruta, exports) {
    const id = require.resolve(ruta);
    require.cache[id] = { id, filename: id, loaded: true, exports };
}

reemplazarModulo('../models/Usuario', usuarioMock);
reemplazarModulo('../models/Producto', productoMock);

const autenticarOpcional = require('../middlewares/optionalAuthMiddleware');
const { obtenerProductoPorId } = require('../controllers/productoController');
const { serializeSessionCookie } = require('../utils/sessionCookie');

function crearResponse() {
    return {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test('el propietario autenticado por cookie puede ver su publicación pendiente', async () => {
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret';
    const token = jwt.sign({ id: ownerId, rol: 'usuario' }, process.env.JWT_SECRET);
    const req = {
        params: { id: product._id },
        headers: { cookie: serializeSessionCookie(token, true) }
    };
    const response = crearResponse();
    let continued = false;

    try {
        await autenticarOpcional(req, response, () => {
            continued = true;
        });
        assert.equal(continued, true);

        await obtenerProductoPorId(req, response);
    } finally {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    }

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, product);
});
