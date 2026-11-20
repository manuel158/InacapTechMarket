const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const limitadores = require('../middlewares/authRateLimiters');

test('limita el registro por correo sin bloquear otros usuarios de la misma IP', async () => {
    const app = express();
    app.use(express.json());
    app.post('/registro', limitadores.registro, (_req, res) => res.sendStatus(200));
    const server = app.listen(0);

    try {
        const { port } = server.address();
        const solicitar = correo => fetch(`http://127.0.0.1:${port}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo })
        });

        for (let intento = 0; intento < 3; intento += 1) {
            assert.equal((await solicitar('persona@inacapmail.cl')).status, 200);
        }
        assert.equal((await solicitar('persona@inacapmail.cl')).status, 429);
        assert.equal((await solicitar('otra@inacapmail.cl')).status, 200);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
});
