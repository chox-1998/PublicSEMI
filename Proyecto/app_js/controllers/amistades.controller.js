
const { pool } = require("../config/database");
const amistadesService = require("../services/amistades.service");

async function enviarSolicitud(req, res) {
    const solicitanteId = req.usuarioAutenticado.id;
    const receptorId = Number(req.body?.receptorId);

    if (!Number.isInteger(receptorId) || receptorId <= 0) {
        return res.status(400).json({
            error: "El identificador del receptor debe ser un entero positivo.",
        });
    }

    if (solicitanteId === receptorId) {
        return res.status(400).json({
            error: "No puedes enviarte una solicitud a ti mismo.",
        });
    }

    try {
        const receptor = await pool.query(
            "SELECT id FROM usuarios WHERE id = $1",
            [receptorId]
        );

        if (receptor.rowCount === 0) {
            return res.status(404).json({
                error: "Usuario receptor no encontrado.",
            });
        }

        const relacion = await pool.query(
            `
                SELECT id, estado
                FROM amistades
                WHERE
                    LEAST(solicitante_id, receptor_id) =
                        LEAST($1::int, $2::int)
                    AND
                    GREATEST(solicitante_id, receptor_id) =
                        GREATEST($1::int, $2::int)
            `,
            [solicitanteId, receptorId]
        );

        if (relacion.rowCount > 0) {
            return res.status(409).json({
                error: "Ya existe una relación o solicitud entre estos usuarios.",
                estado: relacion.rows[0].estado,
            });
        }

        const solicitud = await amistadesService.enviarSolicitud(
            solicitanteId,
            receptorId
        );

        return res.status(201).json({
            mensaje: "Solicitud de amistad enviada.",
            solicitud,
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                error: "Ya existe una relación o solicitud entre estos usuarios.",
            });
        }

        console.error("Error al enviar solicitud:", error.message);

        return res.status(500).json({
            error: "No fue posible enviar la solicitud.",
        });
    }
}

async function obtenerAmigos(req, res) {
    const usuarioId = req.usuarioAutenticado.id;

    try {
        const amigos = await amistadesService.obtenerAmigos(usuarioId);

        return res.status(200).json({
            total: amigos.length,
            amigos,
        });
    } catch (error) {
        console.error("Error al consultar amigos:", error.message);

        return res.status(500).json({
            error: "No fue posible consultar los amigos.",
        });
    }
}

async function obtenerSolicitudesRecibidas(req, res) {
    const usuarioId = req.usuarioAutenticado.id;

    try {
        const solicitudes =
            await amistadesService.obtenerSolicitudesRecibidas(usuarioId);

        return res.status(200).json({
            total: solicitudes.length,
            solicitudes,
        });
    } catch (error) {
        console.error("Error al consultar solicitudes:", error.message);

        return res.status(500).json({
            error: "No fue posible consultar las solicitudes.",
        });
    }
}

async function responderSolicitud(req, res) {
    const solicitudId = Number(req.params.solicitudId);
    const receptorId = req.usuarioAutenticado.id;
    const estado = req.body?.estado;

    if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
        return res.status(400).json({
            error: "El identificador de la solicitud debe ser un entero positivo.",
        });
    }

    if (!["aceptada", "rechazada"].includes(estado)) {
        return res.status(400).json({
            error: "El estado debe ser aceptada o rechazada.",
        });
    }

    try {
        const solicitud = await amistadesService.responderSolicitud(
            solicitudId,
            receptorId,
            estado
        );

        if (!solicitud) {
            return res.status(404).json({
                error: "No existe una solicitud pendiente para este usuario.",
            });
        }

        return res.status(200).json({
            mensaje: `Solicitud ${estado}.`,
            solicitud,
        });
    } catch (error) {
        console.error("Error al responder solicitud:", error.message);

        return res.status(500).json({
            error: "No fue posible responder la solicitud.",
        });
    }
}

module.exports = {
    enviarSolicitud,
    obtenerAmigos,
    obtenerSolicitudesRecibidas,
    responderSolicitud,
};
