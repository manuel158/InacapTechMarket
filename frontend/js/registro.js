const formulario = document.getElementById('formRegistro');

formulario.addEventListener('submit', async (e) => {

    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;

    try {

        const respuesta = await fetch(
            '/api/auth/registro',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre,
                    correo,
                    password
                })
            }
        );

        console.log('Status:', respuesta.status);

        const texto = await respuesta.text();

        console.log('Respuesta backend:', texto);

        document.getElementById('resultado').innerHTML = texto;

        document.getElementById('verificacion').style.display = 'block';

    } catch (error) {

        console.log('ERROR:', error);

    }
});

document
.getElementById('btnVerificar')
.addEventListener(
    'click',
    async () => {

        const codigo =
            document.getElementById(
                'codigo'
            ).value;

        const respuesta =
            await fetch(
                '/api/auth/verificar',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        codigo
                    })
                }
            );

        const datos =
            await respuesta.json();

            document.getElementById('resultado').innerHTML = `
                <h3 style="color:green">
                    ✅ Usuario creado correctamente
                </h3>`;

            document.getElementById('formRegistro').style.display = 'none';

            document.getElementById('verificacion').style.display = 'none';

    }
);