const contenedor =
document.getElementById(
    'contenedor'
);

async function cargar() {

    const token =
        localStorage.getItem(
            'token'
        );

    if (!token) {

        alert(
            'Debe iniciar sesión'
        );

        return;
    }

    try {

        const respuesta =
            await fetch(
                '/api/productos/mis-publicaciones',
                {
                    headers: {
                        Authorization:
                        `Bearer ${token}`
                    }
                }
            );

        const productos =
            await respuesta.json();

        contenedor.innerHTML = '';

        productos.forEach(producto => {

            contenedor.innerHTML += `

            <div class="col-12 col-sm-6 col-lg-4">

                <div class="card h-100 shadow-sm">

                    <img
                        src="${producto.imagen}"
                        class="imagen-publicacion"
                        alt="${producto.nombre}">

                    <div class="card-body">

                        <span class="badge bg-primary mb-2">

                            ${producto.categoria}

                        </span>

                        <h5 class="card-title">

                            ${producto.nombre}

                        </h5>

                        <h4 class="text-success fw-bold">

                            $${Number(producto.precio).toLocaleString('es-CL')}

                        </h4>

                    </div>

                    <div class="card-footer bg-white border-0">

                        <div class="d-grid gap-2">

                            <a class="btn btn-success"
                                href="productoDetalle.html?id=${producto._id}&origen=mis-publicaciones">
                                Ver detalle

                            </a>

                            <button
                                class="btn btn-danger"
                                onclick="eliminarProducto('${producto._id}')">

                                Eliminar

                            </button>

                        </div>

                    </div>

                </div>

            </div>

            `;

        });
    } catch (error) {

        console.error(error);

    }

}

cargar();

async function eliminarProducto(id) {

    const confirmar = confirm('¿Eliminar publicación?');

    if (!confirmar) {
        return;
    }

    const token =
        localStorage.getItem(
            'token'
        );

    try {

        const respuesta =
            await fetch(
                `/api/productos/mis-publicaciones/${id}`,
                {
                    method: 'DELETE',

                    headers: {
                        Authorization:
                        `Bearer ${token}`
                    }
                }
            );

        const datos = await respuesta.json();

        alert(datos.mensaje);

        cargar();

    } catch (error) {

        console.error(error);

    }

}