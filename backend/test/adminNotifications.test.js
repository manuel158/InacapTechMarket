const assert = require('node:assert/strict');
const { test } = require('node:test');

const administradores = [
    { nombre: 'Admin Uno', correo: 'admin1@example.com' },
    { nombre: 'Admin Dos', correo: 'admin2@example.com' }
];
const correosEnviados = [];
const usuarioMock = {
    find(filtro) {
        assert.deepEqual(filtro, {
            rol: 'admin',
            activo: { $ne: false }
        });
        return {
            select(campos) {
                assert.equal(campos, 'nombre correo');
                return Promise.resolve(administradores);
            }
        };
    }
};
const enviarCorreoMock = async datos => {
    correosEnviados.push(datos);
};

function reemplazarModulo(ruta, exports) {
    const id = require.resolve(ruta);
    require.cache[id] = { id, filename: id, loaded: true, exports };
}

reemplazarModulo('../models/Usuario', usuarioMock);
reemplazarModulo('../config/emailConfig', enviarCorreoMock);

const { notificarNuevaPublicacionPendiente } = require('../utils/adminNotifications');

test('notifica por correo a cada administrador activo con el enlace al panel de revisión', async () => {
    correosEnviados.length = 0;
    await notificarNuevaPublicacionPendiente({
        _id: 'producto-1',
        nombre: 'Juego de mesa',
        categoria: 'Juegos',
        subcategoria: 'Juegos de mesa'
    });

    assert.equal(correosEnviados.length, 2);
    assert.deepEqual(correosEnviados.map(correo => correo.toEmail), [
        'admin1@example.com',
        'admin2@example.com'
    ]);
    assert.equal(
        correosEnviados[0].subject,
        'Nueva publicación pendiente de revisión'
    );
    assert.match(
        correosEnviados[0].message,
        /\/#\/admin\?seccion=publicaciones/
    );
});
