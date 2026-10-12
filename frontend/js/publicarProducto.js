const formulario = document.getElementById('formProducto');

formulario.addEventListener(
    'submit',
    async (e) => {

        e.preventDefault();

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

        const formData =
            new FormData();

        formData.append(
            'nombre',
            document.getElementById(
                'nombre'
            ).value
        );

        formData.append(
            'descripcion',
            document.getElementById(
                'descripcion'
            ).value
        );

        formData.append(
            'precio',
            document.getElementById(
                'precio'
            ).value
        );

        formData.append(
            'categoria',
            document.getElementById(
                'categoria'
            ).value
        );

        formData.append(
            'whatsapp',
            document.getElementById(
                'whatsapp'
            ).value
        );

        formData.append(
            'comentario',
            document.getElementById(
                'comentario'
            ).value
        );

        formData.append(
            'imagen',
            document.getElementById(
                'imagen'
            ).files[0]
        );

        try {

            const respuesta =
                await fetch(
                    '/api/productos',
                    {
                        method: 'POST',

                        headers: {
                            Authorization:
                            `Bearer ${token}`
                        },

                        body: formData
                    }
                );

            const datos =
                await respuesta.json();

            document
                .getElementById(
                    'resultado'
                )
                .innerHTML =
                `
                <h3>
                    Producto publicado
                </h3>
                `;
                formulario.reset();


            console.log(datos);


        } catch (error) {

            console.error(error);

            document
                .getElementById(
                    'resultado'
                )
                .innerHTML =
                `
                <h3>
                    Error al publicar
                </h3>
                `;
        }

    }
);