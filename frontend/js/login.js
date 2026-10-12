const formulario = document.getElementById('formLogin');
const resultado = document.getElementById('resultado');

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;

    resultado.textContent = 'Iniciando sesión...';

    try {

        const respuesta = await fetch(
            'http://localhost:3000/api/auth/login',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    correo,
                    password
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {

            resultado.textContent =
                datos.mensaje ||
                'No se pudo iniciar sesión.';

            return;
        }

        localStorage.setItem(
            'token',
            datos.token
        );

        localStorage.setItem(
            'usuario',
            JSON.stringify(datos)
        );

        resultado.textContent =
            `Bienvenido ${datos.nombre}. Rol: ${datos.rol}`;

        setTimeout(() => {

            window.location.href =
                'productos.html';

        }, 1000);

    } catch (error) {

        console.error(
            'Error al iniciar sesión:',
            error
        );

        resultado.textContent =
            'No se pudo conectar con el servidor. Inténtalo nuevamente.';
    }

});