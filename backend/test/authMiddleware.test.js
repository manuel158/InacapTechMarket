const assert = require('node:assert/strict');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');

const usuario = { _id: 'usuario-1', activo: true };
const usuarioMock = {
    findById() {
        return { select: async () => usuario };
    }
};

function reemplazarModulo(ruta, exports) {
    const id = require.resolve(ruta);
    require.cache[id] = { id, filename: id, loaded: true, exports };
}

reemplazarModulo('../models/Usuario', usuarioMock);
const protegerRuta = require('../middlewares/authMiddleware');
const { serializeSessionCookie } = require('../utils/sessionCookie');
const secret = 'test-secret';

test('autentica solicitudes web usando la cookie HttpOnly', async () => {
    const token = jwt.sign({ id: usuario._id, rol: 'usuario' }, secret);
    const req = {
        headers: {
            cookie: serializeSessionCookie(token, true)
        }
    };
    const res = {
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
    let continued = false;
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;

    try {
        await protegerRuta(req, res, () => {
            continued = true;
        });
    } finally {
        if (previousSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousSecret;
    }

    assert.equal(continued, true);
    assert.equal(req.usuario, usuario);
});
