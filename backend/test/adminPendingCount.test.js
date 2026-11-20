const assert = require('node:assert/strict');
const { test } = require('node:test');

const productoMock = {
    async countDocuments(filtro) {
        assert.deepEqual(filtro, { estado: 'pendiente' });
        return 2;
    }
};

function reemplazarModulo(ruta, exports) {
    const id = require.resolve(ruta);
    require.cache[id] = { id, filename: id, loaded: true, exports };
}

reemplazarModulo('../models/Usuario', {});
reemplazarModulo('../models/Producto', productoMock);

const { contarPublicacionesPendientes } = require('../controllers/adminController');

test('devuelve el número actual de publicaciones pendientes', async () => {
    const response = {
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

    await contarPublicacionesPendientes({}, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { count: 2 });
});
