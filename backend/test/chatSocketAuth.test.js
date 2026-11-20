const assert = require('node:assert/strict');
const { test } = require('node:test');
const jwt = require('jsonwebtoken');

const usuario = { _id: 'usuario-1', nombre: 'Manuel', activo: true };
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
const inicializarChat = require('../socket/chatSocket');
const { serializeSessionCookie } = require('../utils/sessionCookie');

test('autentica Socket.IO mediante la cookie web', async () => {
    const token = jwt.sign({ id: usuario._id, rol: 'usuario' }, 'test-secret');
    let middleware;
    const io = {
        use(callback) {
            middleware = callback;
        },
        on() {}
    };
    inicializarChat(io);

    const socket = {
        handshake: {
            auth: {},
            headers: { cookie: serializeSessionCookie(token, true) }
        },
        data: {}
    };
    let middlewareError;
    process.env.JWT_SECRET = 'test-secret';

    await middleware(socket, error => {
        middlewareError = error;
    });

    assert.equal(middlewareError, undefined);
    assert.equal(socket.data.usuarioId, 'usuario-1');
    assert.equal(socket.data.nombre, 'Manuel');
});
