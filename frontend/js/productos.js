const contenedor =
document.getElementById(
    'contenedorProductos'
);

const filtro =
document.getElementById(
    'filtroCategoria'
);

let todosLosProductos = [];

async function cargarProductos() {

    try {

        const respuesta =
            await fetch(
                '/api/productos'
            );

        if (!respuesta.ok) {
            throw new Error(
                `Error al cargar productos: ${respuesta.status}`
            );
        }

        todosLosProductos =
            await respuesta.json();

        if (!Array.isArray(todosLosProductos)) {
            throw new Error(
                'La respuesta del servidor no contiene una lista de productos'
            );
        }

        mostrarProductos(
            todosLosProductos
        );

    } catch (error) {

        console.error(error);
        contenedor.innerHTML = `
            <p class="text-danger">
                No se pudieron cargar los productos.
            </p>
        `;

    }
}

function mostrarProductos(productos) {

    contenedor.innerHTML = '';

    if (productos.length === 0) {
        contenedor.innerHTML = `
            <p class="text-muted">
                No hay productos para mostrar.
            </p>
        `;
        return;
    }

    productos.forEach(producto => {

        contenedor.innerHTML += `

            <div class="card card-producto shadow-sm m-3" style="width: 22rem;">

                <img
                    src="${producto.imagen}"
                    class="imagen-publicacion card-img-top"
                    alt="${producto.nombre}">

                <div class="card-body">

                    <h5>
                        ${producto.nombre}
                    </h5>

                    <p>

                        <strong>Categoría:</strong>
                        ${producto.categoria}

                    </p>

                    <a class="botonVerDetalleProductos"
                        href="productoDetalle.html?id=${producto._id}"
                        >

                        Ver detalle

                    </a>

                </div>

            </div>

        `;

    });

}

filtro.addEventListener(
    'change',
    () => {

        const categoria =
            filtro.value;

        if (
            categoria === 'Todos'
        ) {

            mostrarProductos(
                todosLosProductos
            );

            return;
        }

        const filtrados =
            todosLosProductos.filter(
                producto =>
                producto.categoria
                === categoria
            );

        mostrarProductos(
            filtrados
        );

    }
);

cargarProductos();