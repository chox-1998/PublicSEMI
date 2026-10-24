
const usuariosService = require("../services/usuarios.service");

async function obtenerUsuarioPorId(req, res) {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            error: "El identificador debe ser un entero positivo."
        });
    }

    try {
        const usuario = await usuariosService.obtenerUsuarioPorId(id);

        if (!usuario) {
            return res.status(404).json({
                error: "Usuario no encontrado."
            });
        }

        return res.status(200).json({ usuario });
    } catch (error) {
        console.error(
            "Error al consultar usuario:",
            error.message
        );

        return res.status(500).json({
            error: "No fue posible consultar el usuario."
        });
    }
}

async function obtenerMiPerfil(req, res) {
    const identidad = req.usuarioCognito;

    if (!identidad?.sub) {
        return res.status(401).json({
            error: "No se encontró una identidad válida de Cognito."
        });
    }

    try {
        const usuario = await usuariosService.obtenerOCrearPerfilCognito({
            cognitoSub: identidad.sub,
            nombreCompleto: identidad.name,
            email: identidad.email,
            dpi: req.body?.dpi
        });

        return res.status(200).json({ usuario });
    } catch (error) {
        if (error.status === 400 || error.status === 409) {
            return res.status(error.status).json({
                error: error.message
            });
        }

        console.error(
            "Error al obtener el perfil de Cognito:",
            error.message
        );

        return res.status(500).json({
            error: "No fue posible obtener o crear el perfil."
        });
    }
}

async function buscarUsuarios(req, res) {
    const termino = String(req.query.q || "").trim();
    const usuarioId = req.usuarioAutenticado?.id;

    if (!usuarioId) {
        return res.status(401).json({
            error: "No se pudo identificar el perfil autenticado."
        });
    }

    if (termino.length < 2) {
        return res.status(400).json({
            error: "La búsqueda debe contener al menos 2 caracteres."
        });
    }

    if (termino.length > 100) {
        return res.status(400).json({
            error: "La búsqueda no puede superar 100 caracteres."
        });
    }

    try {
        const usuarios = await usuariosService.buscarUsuarios(
            termino,
            usuarioId
        );

        return res.status(200).json({
            total: usuarios.length,
            usuarios
        });
    } catch (error) {
        console.error(
            "Error al buscar usuarios:",
            error.message
        );

        return res.status(500).json({
            error: "No fue posible buscar usuarios."
        });
    }
}

module.exports = {
    obtenerUsuarioPorId,
    obtenerMiPerfil,
    buscarUsuarios
};
