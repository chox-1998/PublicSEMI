const { Pool } = require("pg");

const pool = new Pool({
    host: "database-1.cvqk40caiisr.us-east-2.rds.amazonaws.com",
    port: 3306,
    database: "db-1",
    user: "admin",
    password: "}+sicvn)Q_x4~.9"
});

module.exports = pool;