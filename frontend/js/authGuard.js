const token = localStorage.getItem('token');

if (!token) {

    alert('Debe iniciar sesión');

    window.location.href =
    'iniciarSesion.html';

}