const usuariosService = require("../services/usuarios.service");

async function autenticarUsuarioPerfil(req, res, next) {
    const identidad = req.usuarioCognito;

    if (!identidad?.sub) {
        return res.status(401).json({
            error: "El token no contiene una identidad válida.",
        });
    }

    try {
        const usuario = await usuariosService.obtenerUsuarioPorId(
            identidad.sub
        );

        if (!usuario) {
            return res.status(403).json({
                error: "No existe un perfil asociado a esta cuenta.",
            });
        }

        req.usuarioAutenticado = usuario;

        return next();
    } catch (error) {
        console.error(
            "Error al identificar el perfil autenticado:",
            error.message
        );

        return res.status(500).json({
            error: "No fue posible identificar el perfil del usuario.",
        });
    }
}

module.exports = {
    autenticarUsuarioPerfil,
};