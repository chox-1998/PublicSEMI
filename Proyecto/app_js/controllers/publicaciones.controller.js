const publicacionesService = require("../services/publicaciones.service");

async function obtenerFeed(req, res) {
    const usuarioId = Number(req.params.usuarioId);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({
            error: "El identificador del usuario debe ser un entero positivo.",
        });
    }

    try {
        const publicaciones = await publicacionesService.obtenerFeed(usuarioId);

        if (publicaciones === null) {
            return res.status(404).json({
                error: "Usuario no encontrado.",
            });
        }

        return res.status(200).json({
            total: publicaciones.length,
            publicaciones,
        });
    } catch (error) {
        console.error("Error al consultar el feed:", error.message);

        return res.status(500).json({
            error: "No fue posible consultar las publicaciones.",
        });
    }
}

async function obtenerPublicacionPorId(req, res) {
    const publicacionId = Number(req.params.publicacionId);

    if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
        return res.status(400).json({
            error: "El identificador de la publicación debe ser un entero positivo.",
        });
    }

    try {
        const publicacion =
            await publicacionesService.obtenerPublicacionPorId(publicacionId);

        if (!publicacion) {
            return res.status(404).json({
                error: "Publicación no encontrada.",
            });
        }

        return res.status(200).json({ publicacion });
    } catch (error) {
        console.error("Error al consultar publicación:", error.message);

        return res.status(500).json({
            error: "No fue posible consultar la publicación.",
        });
    }
}

async function crearPublicacion(req, res) {
    const usuarioId = Number(req.body.usuarioId);
    const descripcion =
        typeof req.body.descripcion === "string"
            ? req.body.descripcion.trim()
            : "";

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({
            error: "El identificador del usuario debe ser un entero positivo.",
        });
    }

    if (!req.file) {
        return res.status(400).json({
            error: "Debes adjuntar una imagen para la publicación.",
        });
    }

    try {
        const publicacion = await publicacionesService.crearPublicacion(
            usuarioId,
            req.file,
            descripcion
        );

        if (publicacion === null) {
            return res.status(404).json({
                error: "Usuario no encontrado.",
            });
        }

        return res.status(201).json({
            mensaje: "Publicación creada correctamente.",
            publicacion,
        });
    } catch (error) {
        console.error("Error al crear publicación:", error.message);

        if (
            error.message ===
            "La imagen debe ser un archivo JPEG o PNG válido."
        ) {
            return res.status(400).json({
                error: error.message,
            });
        }

        if (
            error.message === "La imagen no es válida." ||
            error.message ===
                "La variable S3_BUCKET no está configurada."
        ) {
            return res.status(400).json({
                error: error.message,
            });
        }

        return res.status(500).json({
            error: "No fue posible crear la publicación.",
        });
    }
}

module.exports = {
    obtenerFeed,
    obtenerPublicacionPorId,
    crearPublicacion,
};