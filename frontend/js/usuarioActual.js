const usuario =
JSON.parse(
    localStorage.getItem(
        'usuario'
    )
);

if (usuario) {

    document.getElementById(
        'usuarioActual'
    ).innerText =
    `Bienvenido ${usuario.nombre}`;

}