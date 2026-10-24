
const { pool } = require("../config/database");
const comentariosService = require("../services/comentarios.service");

async function crearComentario(req, res) {
    const publicacionId = Number(req.params.publicacionId);
    const usuarioId = Number(req.body.usuarioId);
    const contenido =
        typeof req.body.contenido === "string"
            ? req.body.contenido.trim()
            : "";

    if (!Number.isInteger(publicacionId) || publicacionId <= 0) {
        return res.status(400).json({
            error: "El identificador de la publicación debe ser un entero positivo.",
        });
    }

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({
            error: "El identificador del usuario debe ser un entero positivo.",
        });
    }

    if (!contenido) {
        return res.status(400).json({
            error: "El contenido del comentario no puede estar vacío.",
        });
    }

    try {
        const existentes = await pool.query(
            `
                SELECT
                    EXISTS(
                        SELECT 1 FROM usuarios WHERE id = $1
                    ) AS usuario_existe,
                    EXISTS(
                        SELECT 1 FROM publicaciones WHERE id = $2
                    ) AS publicacion_existe
            `,
            [usuarioId, publicacionId]
        );

        if (!existentes.rows[0].usuario_existe) {
            return res.status(404).json({
                error: "Usuario no encontrado.",
            });
        }

        if (!existentes.rows[0].publicacion_existe) {
            return res.status(404).json({
                error: "Publicación no encontrada.",
            });
        }

        const comentario = await comentariosService.crearComentario(
            publicacionId,
            usuarioId,
            contenido
        );

        return res.status(201).json({ comentario });
    } catch (error) {
        console.error("Error al crear comentario:", error.message);

        return res.status(500).json({
            error: "No fue posible crear el comentario.",
        });
    }
}

module.exports = {
    crearComentario,
};
