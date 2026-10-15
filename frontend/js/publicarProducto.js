const formulario = document.getElementById('formProducto');
const parametros = new URLSearchParams(window.location.search);
const productoId = parametros.get('id');
const origen = parametros.get('origen');
const campoImagen = document.getElementById('imagen');
const resultado = document.getElementById('resultado');
const botonGuardar = document.getElementById('btnGuardarProducto');
const botonCancelar = document.getElementById('btnCancelarEdicion');
const navPublicar = document.getElementById('navPublicar');
const navMisPublicaciones = document.getElementById('navMisPublicaciones');

const seEditaDesdeMisPublicaciones =
    Boolean(productoId) && origen === 'mis-publicaciones';
const enlaceActivo =
    seEditaDesdeMisPublicaciones ? navMisPublicaciones : navPublicar;

enlaceActivo.classList.add('active');
enlaceActivo.setAttribute('aria-current', 'page');

if (productoId) {
    document.getElementById('tituloFormulario').textContent =
        'Editar Publicación';
    botonGuardar.textContent = 'Guardar Cambios';
    botonGuardar.disabled = true;
    botonCancelar.hidden = false;
    campoImagen.required = false;
    document.getElementById('ayudaImagen').textContent =
        'Si no selecciona una imagen, se conservará la actual.';
}

async function cargarProductoParaEditar() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Debe iniciar sesión');
        window.location.href = 'iniciarSesion.html';
        return;
    }

    try {
        const respuesta = await fetch('/api/productos/mis-publicaciones', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const productos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                productos.mensaje || 'No se pudo cargar la publicación'
            );
        }

        const producto = productos.find(item => item._id === productoId);

        if (!producto) {
            throw new Error('No se encontró la publicación en tu cuenta');
        }

        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('descripcion').value = producto.descripcion;
        document.getElementById('precio').value = producto.precio;
        document.getElementById('categoria').value = producto.categoria;
        document.getElementById('whatsapp').value = producto.whatsapp;
        document.getElementById('comentario').value = producto.comentario || '';
        botonGuardar.disabled = false;
    } catch (error) {
        console.error(error);
        resultado.textContent = error.message;
        resultado.className = 'mt-3 text-danger';
    }
}

if (productoId) {
    cargarProductoParaEditar();
}

botonCancelar.addEventListener('click', () => {
    window.location.href = 'misPublicaciones.html';
});

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    if (!token) {
        alert('Debe iniciar sesión');
        return;
    }

    const formData = new FormData();

    [
        'nombre',
        'descripcion',
        'precio',
        'categoria',
        'whatsapp',
        'comentario'
    ].forEach(campo => {
        formData.append(campo, document.getElementById(campo).value);
    });

    if (campoImagen.files[0]) {
        formData.append('imagen', campoImagen.files[0]);
    }

    botonGuardar.disabled = true;

    try {
        const respuesta = await fetch(
            productoId
                ? `/api/productos/mis-publicaciones/${productoId}`
                : '/api/productos',
            {
                method: productoId ? 'PUT' : 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            }
        );
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                datos.mensaje || 'No se pudo guardar el producto'
            );
        }

        resultado.textContent = productoId
            ? 'Publicación actualizada correctamente'
            : 'Producto publicado correctamente';
        resultado.className = 'mt-3 text-success';

        if (productoId) {
            window.setTimeout(() => {
                window.location.href = 'misPublicaciones.html';
            }, 700);
        } else {
            formulario.reset();
        }
    } catch (error) {
        console.error(error);
        resultado.textContent = error.message;
        resultado.className = 'mt-3 text-danger';
        botonGuardar.disabled = false;
    }
});
