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

        actualizarConteosCategorias();

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

function actualizarConteosCategorias() {
    const conteos = todosLosProductos.reduce(
        (resultado, producto) => {
            resultado[producto.categoria] =
                (resultado[producto.categoria] || 0) + 1;
            return resultado;
        },
        {}
    );

    Array.from(filtro.options).forEach(opcion => {
        const nombre = opcion.dataset.nombre || opcion.textContent.trim();
        opcion.dataset.nombre = nombre;

        const cantidad = opcion.value === 'Todos'
            ? todosLosProductos.length
            : conteos[opcion.value] || 0;

        opcion.textContent = `${nombre} (${cantidad})`;
    });
}

function mostrarProductos(productos) {

    contenedor.innerHTML = '';

    if (productos.length === 0) {
        contenedor.innerHTML = `
            <p class="col-12 text-muted">
                No hay productos para mostrar.
            </p>
        `;
        return;
    }

    productos.forEach(producto => {

        contenedor.innerHTML += `

            <div class="col">
                <div class="card card-producto shadow-sm h-100">

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