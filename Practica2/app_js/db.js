const { Pool } = require("pg");

const pool = new Pool({
    host: "database-2.cvqk40caiisr.us-east-2.rds.amazonaws.com",
    port: 5432,
    database: "db-1",
    user: "postgres",
    password: "}+sicvn)Q_x4~.9"
});

module.exports = pool;