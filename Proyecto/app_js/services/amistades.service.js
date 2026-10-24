
const { pool } = require("../config/database");

async function enviarSolicitud(solicitanteId, receptorId) {
    const consulta = `
        INSERT INTO amistades (
            solicitante_id,
            receptor_id
        )
        VALUES ($1, $2)
        RETURNING
            id,
            solicitante_id,
            receptor_id,
            estado,
            creada_en,
            respondida_en
    `;

    const resultado = await pool.query(consulta, [
        solicitanteId,
        receptorId,
    ]);

    return resultado.rows[0];
}

async function obtenerAmigos(usuarioId) {
    const consulta = `
        SELECT
            u.id,
            u.nombre_completo,
            u.email,
            u.s3_key
        FROM v_amigos va
        INNER JOIN usuarios u
            ON u.id = va.amigo_id
        WHERE va.usuario_id = $1
        ORDER BY u.nombre_completo
    `;

    const resultado = await pool.query(consulta, [usuarioId]);

    return resultado.rows;
}

async function obtenerSolicitudesRecibidas(usuarioId) {
    const consulta = `
        SELECT
            a.id AS solicitud_id,
            a.solicitante_id,
            u.nombre_completo,
            u.s3_key,
            a.estado,
            a.creada_en
        FROM amistades a
        INNER JOIN usuarios u
            ON u.id = a.solicitante_id
        WHERE
            a.receptor_id = $1
            AND a.estado = 'pendiente'
        ORDER BY a.creada_en DESC, a.id DESC
    `;

    const resultado = await pool.query(consulta, [usuarioId]);

    return resultado.rows;
}

async function responderSolicitud(solicitudId, receptorId, estado) {
    const consulta = `
        UPDATE amistades
        SET
            estado = $1::estado_solicitud,
            respondida_en = NOW()
        WHERE
            id = $2
            AND receptor_id = $3
            AND estado = 'pendiente'
        RETURNING
            id,
            solicitante_id,
            receptor_id,
            estado,
            creada_en,
            respondida_en
    `;

    const resultado = await pool.query(consulta, [
        estado,
        solicitudId,
        receptorId,
    ]);

    return resultado.rows[0] || null;
}

module.exports = {
    enviarSolicitud,
    obtenerAmigos,
    obtenerSolicitudesRecibidas,
    responderSolicitud,
};
