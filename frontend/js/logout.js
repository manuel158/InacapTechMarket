function cerrarSesion() {

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    window.location.href =
    '../index.html';

}