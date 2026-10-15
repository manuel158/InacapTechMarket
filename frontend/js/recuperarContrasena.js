const parametrosRecuperacion = new URLSearchParams(window.location.search);
const tokenRecuperacion = parametrosRecuperacion.get('token');
const formularioRecuperacion = document.getElementById('formRecuperacion');
const resultadoRecuperacion =
    document.getElementById('resultadoRecuperacion');
const campoCorreo = document.getElementById('campoCorreo');
const campoPassword = document.getElementById('campoPassword');
const campoConfirmarPassword =
    document.getElementById('campoConfirmarPassword');
const tituloRecuperacion = document.getElementById('tituloRecuperacion');
const descripcionRecuperacion =
    document.getElementById('descripcionRecuperacion');
const btnEnviar = document.getElementById('btnEnviar');

if (tokenRecuperacion) {
    campoCorreo.hidden = true;
    document.getElementById('correo').required = false;
    campoPassword.hidden = false;
    campoConfirmarPassword.hidden = false;
    document.getElementById('password').required = true;
    document.getElementById('confirmarPassword').required = true;
    tituloRecuperacion.textContent = 'Crear nueva contraseña';
    descripcionRecuperacion.textContent =
        'Elige una contraseña nueva para tu cuenta.';
    btnEnviar.textContent = 'Cambiar contraseña';
    window.history.replaceState(
        {},
        document.title,
        window.location.pathname
    );
} else {
    document.getElementById('password').required = false;
    document.getElementById('confirmarPassword').required = false;
}

formularioRecuperacion.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    resultadoRecuperacion.textContent = '';

    const cuerpo = tokenRecuperacion
        ? {
            token: tokenRecuperacion,
            password: document.getElementById('password').value
        }
        : {
            correo: document.getElementById('correo').value.trim()
        };

    if (
        tokenRecuperacion &&
        cuerpo.password !== document.getElementById('confirmarPassword').value
    ) {
        resultadoRecuperacion.textContent = 'Las contraseñas no coinciden.';
        resultadoRecuperacion.className = 'text-center mt-3 text-danger';
        return;
    }

    btnEnviar.disabled = true;

    try {
        const respuesta = await fetch(
            tokenRecuperacion
                ? '/api/auth/restablecer-password'
                : '/api/auth/recuperar-password',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cuerpo)
            }
        );
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.mensaje || 'No se pudo completar la solicitud.');
        }

        resultadoRecuperacion.textContent = datos.mensaje;
        resultadoRecuperacion.className = 'text-center mt-3 text-success';

        if (tokenRecuperacion) {
            formularioRecuperacion.reset();
            btnEnviar.textContent = 'Contraseña actualizada';
        }
    } catch (error) {
        console.error('Error en la recuperación de contraseña:', error);
        resultadoRecuperacion.textContent = error.message;
        resultadoRecuperacion.className = 'text-center mt-3 text-danger';
    } finally {
        if (!tokenRecuperacion || resultadoRecuperacion.classList.contains('text-danger')) {
            btnEnviar.disabled = false;
        }
    }
});
