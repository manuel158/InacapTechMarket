const esAdministrador = (req, res, next) => {

    try {

        if (!req.usuario) {
            return res.status(401).json({
                mensaje: 'No autorizado'
            });
        }

        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({
                mensaje: 'Acceso solo para administradores'
            });
        }

        next();

    } catch (error) {

        return res.status(500).json({
            mensaje: 'Error de autorización'
        });

    }

};

module.exports = esAdministrador;