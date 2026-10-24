
const { pool } = require("../config/database");

async function obtenerUsuarioPorId(id) {
    const consulta = `
        SELECT
            id,
            nombre_completo,
            email,
            dpi,
            s3_key
        FROM usuarios
        WHERE id = $1
    `;

    const resultado = await pool.query(consulta, [id]);

    return resultado.rows[0] || null;
}

async function obtenerUsuarioPorCognitoSub(cognitoSub) {
    const sub = String(cognitoSub || "").trim();

    if (!sub) {
        return null;
    }

    const consulta = `
        SELECT
            id,
            nombre_completo,
            email,
            s3_key,
            cognito_sub
        FROM usuarios
        WHERE cognito_sub = $1
        LIMIT 1
    `;

    const resultado = await pool.query(consulta, [sub]);

    return resultado.rows[0] || null;
}

async function obtenerOCrearPerfilCognito({
    cognitoSub,
    nombreCompleto,
    email,
    dpi,
}) {
    const sub = String(cognitoSub || "").trim();

    if (!sub) {
        const error = new Error(
            "Se requiere la identidad de Cognito."
        );
        error.status = 400;
        throw error;
    }

    // Buscar primero el perfil asociado a Cognito.
    const existente = await pool.query(
        `
            SELECT
                id,
                nombre_completo,
                email,
                dpi,
                s3_key
            FROM usuarios
            WHERE cognito_sub = $1
        `,
        [sub]
    );

    // Si ya existe, no exigir el DPI nuevamente.
    if (existente.rowCount > 0) {
        return existente.rows[0];
    }

    // Validar los datos necesarios para crear un perfil nuevo.
    const nombre = String(nombreCompleto || "").trim();
    const correo = String(email || "").trim().toLowerCase();
    const documento = String(dpi || "").trim();

    if (!nombre || !correo || !documento) {
        const error = new Error(
            "Para crear el perfil se requieren el nombre, el correo y el DPI."
        );
        error.status = 400;
        throw error;
    }

    // Evitar vincular automáticamente cuentas existentes.
    const conflicto = await pool.query(
        `
            SELECT id
            FROM usuarios
            WHERE email = $1
               OR dpi = $2
               OR nombre_completo = $3
            LIMIT 1
        `,
        [correo, documento, nombre]
    );

    if (conflicto.rowCount > 0) {
        const error = new Error(
            "Ya existe un perfil con ese correo, DPI o nombre. Se requiere revisar la vinculación."
        );
        error.status = 409;
        throw error;
    }

    // Crear el perfil conservando el ID numérico de PostgreSQL.
    const creado = await pool.query(
        `
            INSERT INTO usuarios (
                nombre_completo,
                email,
                password_hash,
                dpi,
                s3_key,
                cognito_sub
            )
            VALUES ($1, $2, NULL, $3, NULL, $4)
            RETURNING
                id,
                nombre_completo,
                email,
                dpi,
                s3_key
        `,
        [nombre, correo, documento, sub]
    );

    return creado.rows[0];
}

async function buscarUsuarios(termino, usuarioId) {
    const consulta = `
        SELECT
            id,
            nombre_completo,
            s3_key
        FROM usuarios
        WHERE id <> $1
          AND (
              nombre_completo ILIKE $2
              OR email ILIKE $2
          )
        ORDER BY nombre_completo
        LIMIT 20
    `;

    const resultado = await pool.query(consulta, [
        usuarioId,
        `%${termino}%`,
    ]);

    return resultado.rows;
}

module.exports = {
    obtenerUsuarioPorId,
    obtenerUsuarioPorCognitoSub,
    obtenerOCrearPerfilCognito,
    buscarUsuarios,
};
