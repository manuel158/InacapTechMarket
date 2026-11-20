const assert = require('node:assert/strict');
const { test } = require('node:test');
const Producto = require('../models/Producto');

test('acepta las subcategorías de mascotas perdidas y encontradas', async () => {
    for (const subcategoria of ['Mascota perdida', 'Mascota encontrada']) {
        const producto = new Producto({
            nombre: 'Publicación de prueba',
            descripcion: 'Descripción de prueba',
            precio: 0,
            categoria: 'Todo mascotas',
            subcategoria,
            imagen: 'https://example.com/imagen.jpg'
        });

        await assert.doesNotReject(() => producto.validate());
    }
});
