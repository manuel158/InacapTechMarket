const contenedor =
document.getElementById(
    'detalleProducto'
);

function obtenerId() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    return parametros.get('id');
}

function obtenerOrigen() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    return parametros.get('origen');

}


async function cargarProducto() {

    const id =
        obtenerId();

    try {

        const respuesta =
            await fetch(
                `/api/productos/${id}`
            );

        const producto =
            await respuesta.json();

        contenedor.innerHTML = `

            <div class="card shadow-lg border-0">

                <div class="row g-0">

                    <div class="col-md-6 card-detalle-imagen">

                        <img
                            src="${producto.imagen}"
                            class="img-fluid h-100 w-100"
                            style="object-fit: cover;"
                            alt="${producto.nombre}">

                    </div>

                    <div class="col-md-6">

                        <div class="card-body p-4">

                            <span class="badge bg-primary mb-3">
                                ${producto.categoria}
                            </span>

                            <h2 class="card-title">

                                ${producto.nombre}

                            </h2>

                            <h3 class="text-success fw-bold mb-4">

                                $${Number(producto.precio).toLocaleString('es-CL')}

                            </h3>

                            <h5>
                                Descripción
                            </h5>

                            <p class="text-muted">

                                ${producto.descripcion}

                            </p>

                            <h5>
                                Comentario del vendedor
                            </h5>

                            <p>

                                ${producto.comentario || 'Sin comentarios'}

                            </p>

                            <hr>

                            <p>

                                <strong>WhatsApp:</strong>
                                ${producto.whatsapp}

                            </p>

                            <div class="d-grid gap-2 mt-4">

                                ${
                                    obtenerOrigen() === 'mis-publicaciones'
                                        ? `<a class="btn btn-warning"
                                            href="publicarProducto.html?id=${producto._id}">
                                            <i class="bi bi-pencil"></i>
                                            Editar publicación
                                        </a>`
                                        : ''
                                }

                                <a class="btn btn-success"
                                    href="https://wa.me/${producto.whatsapp}"
                                    target="_blank"
                                    rel="noopener noreferrer">

                                        <i class="bi bi-whatsapp"></i>
                                        Contactar por WhatsApp

                                </a>

                                <a class="btn btn-dark"
                                    href="${
                                        obtenerOrigen() === 'mis-publicaciones' ? 'misPublicaciones.html' : 'productos.html'
                                    }">
                                    Volver

                                </a>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            `;
    } catch (error) {

        console.error(error);

        contenedor.innerHTML =
        `
        <h2>
            Error al cargar producto
        </h2>
        `;
    }

}

cargarProducto();
