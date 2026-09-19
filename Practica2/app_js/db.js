const { Pool } = require("pg");

const pool = new Pool({
    host: "localhost",
    port: 5005,
    database: "taskflow_db",
    user: "postgres",
    password: "postgres"
});

module.exports = pool;