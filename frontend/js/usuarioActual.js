const elementoUsuario =
    document.getElementById('usuarioActual');
const usuarioGuardado =
    localStorage.getItem('usuario');

if (elementoUsuario && usuarioGuardado) {
    const usuario = JSON.parse(usuarioGuardado);

    if (usuario && typeof usuario.nombre === 'string') {
        elementoUsuario.textContent = "Hola, "+usuario.nombre;
    }
}