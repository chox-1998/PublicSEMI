
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const configuracion = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
};

if (process.env.DB_SSL === "true") {
    const rutaCertificado = path.join(
        __dirname,
        "..",
        "certs",
        "global-bundle.pem"
    );

    configuracion.ssl = {
        ca: fs.readFileSync(rutaCertificado, "utf8"),
        rejectUnauthorized: true,
    };
}

const pool = new Pool(configuracion);

pool.on("error", (error) => {
    console.error(
        "Error inesperado en el pool de PostgreSQL:",
        error.message
    );
});

async function probarConexion() {
    const resultado = await pool.query(
        "SELECT NOW() AS fecha_servidor"
    );

    return resultado.rows[0];
}

module.exports = {
    pool,
    probarConexion,
};
