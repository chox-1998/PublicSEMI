
const { pool } = require("../config/database");

async function crearComentario(publicacionId, usuarioId, contenido) {
    const consulta = `
        INSERT INTO comentarios (
            publicacion_id,
            usuario_id,
            contenido
        )
        VALUES ($1, $2, $3)
        RETURNING
            id,
            publicacion_id,
            usuario_id,
            contenido,
            creado_en
    `;

    const resultado = await pool.query(consulta, [
        publicacionId,
        usuarioId,
        contenido,
    ]);

    return resultado.rows[0];
}

module.exports = {
    crearComentario,
};
