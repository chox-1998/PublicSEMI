const { pool } = require("../config/database");

async function sonAmigos(usuarioId, amigoId) {
    const consulta = `
        SELECT 1
        FROM v_amigos
        WHERE usuario_id = $1
          AND amigo_id = $2
        LIMIT 1
    `;

    const resultado = await pool.query(consulta, [
        usuarioId,
        amigoId,
    ]);

    return resultado.rowCount > 0;
}

async function guardarMensaje(emisorId, receptorId, contenido) {
    const consulta = `
        INSERT INTO mensajes (
            emisor_id,
            receptor_id,
            contenido
        )
        VALUES ($1, $2, $3)
        RETURNING
            id,
            emisor_id,
            receptor_id,
            contenido,
            enviado_en
    `;

    const resultado = await pool.query(consulta, [
        emisorId,
        receptorId,
        contenido,
    ]);

    return resultado.rows[0];
}

async function obtenerConversacion(usuarioId, amigoId, limite = 50) {
    const consulta = `
        SELECT
            id,
            emisor_id,
            receptor_id,
            contenido,
            enviado_en
        FROM mensajes
        WHERE
            (emisor_id = $1 AND receptor_id = $2)
            OR
            (emisor_id = $2 AND receptor_id = $1)
        ORDER BY enviado_en DESC, id DESC
        LIMIT $3
    `;

    const resultado = await pool.query(consulta, [
        usuarioId,
        amigoId,
        limite,
    ]);

    return resultado.rows.reverse();
}

module.exports = {
    sonAmigos,
    guardarMensaje,
    obtenerConversacion,
};