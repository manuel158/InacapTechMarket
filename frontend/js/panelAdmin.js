const token = localStorage.getItem('token');

async function solicitarAdmin(url, opciones = {}) {
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            ...opciones.headers,
            Authorization: 'Bearer ' + token
        }
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'Error al comunicarse con el servidor');
    }

    return datos;
}

function mostrarError(id, error) {
    console.error(error);
    document.getElementById(id).textContent =
        `No se pudo cargar la información: ${error.message}`;
}

async function cargarUsuarios() {
    try {
        const usuarios = await solicitarAdmin(
            '/api/admin/usuarios'
        );
        const admins = usuarios.filter(usuario => usuario.rol === 'admin');
        const contenedor = document.getElementById('usuarios');

        document.getElementById('totalUsuarios').textContent = usuarios.length;
        document.getElementById('totalAdmins').textContent = admins.length;
        contenedor.innerHTML = '';

        usuarios.forEach(usuario => {
            contenedor.innerHTML += `
                <div class="border-bottom py-2">
                    <strong>${usuario.nombre}</strong>
                    <br>
                    ${usuario.correo}
                    <span class="badge bg-primary ms-2">${usuario.rol}</span>
                </div>
            `;
        });
    } catch (error) {
        mostrarError('usuarios', error);
    }
}

function mostrarReporteCategorias(productos) {
    const categorias = {};

    productos.forEach(producto => {
        categorias[producto.categoria] =
            (categorias[producto.categoria] || 0) + 1;
    });

    document.getElementById('totalCategorias').textContent =
        Object.keys(categorias).length;

    const reporte = document.getElementById('reporteCategorias');
    reporte.innerHTML = '';

    for (const categoria in categorias) {
        reporte.innerHTML += `
            <div class="d-flex justify-content-between border-bottom py-2">
                <strong>${categoria}</strong>
                <span>${categorias[categoria]}</span>
            </div>
        `;
    }
}

async function cargarProductos() {
    try {
        const productos = await solicitarAdmin(
            '/api/admin/productos'
        );
        const contenedor = document.getElementById('productos');

        document.getElementById('totalProductos').textContent = productos.length;
        contenedor.innerHTML = '';
        mostrarReporteCategorias(productos);

        productos.forEach(producto => {
            contenedor.innerHTML += `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div><strong>${producto.nombre}</strong></div>
                    <button
                        class="btn btn-danger btn-sm"
                        onclick="eliminar('${producto._id}')">
                        Eliminar
                    </button>
                </div>
            `;
        });
    } catch (error) {
        mostrarError('productos', error);
    }
}

async function eliminar(id) {
    try {
        const datos = await solicitarAdmin(
            `/api/admin/producto/${id}`,
            { method: 'DELETE' }
        );

        alert(datos.mensaje);
        location.reload();
    } catch (error) {
        console.error(error);
        alert(`No se pudo eliminar el producto: ${error.message}`);
    }
}

if (!token) {
    window.location.href = 'iniciarSesion.html';
} else {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));

        if (payload.rol !== 'admin') {
            alert('Acceso solo para administradores');
            window.location.href = 'productos.html';
        } else {
            document.getElementById('menuAdmin').style.display = 'block';
            cargarUsuarios();
            cargarProductos();
        }
    } catch (error) {
        console.error('Token inválido:', error);
        localStorage.removeItem('token');
        window.location.href = 'iniciarSesion.html';
    }
}
