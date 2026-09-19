const express = require("express");
const cors = require("cors");
const pool = require("./db");
const usuariosRoutes = require("./routes/usuarios");
const tareasRoutes = require("./routes/tareas");
const archivosRoutes = require("./routes/archivos");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/usuarios", usuariosRoutes);
app.use("/tareas", tareasRoutes);
app.use("/archivos", archivosRoutes);

app.get("/", (req, res) => {
    res.json({
        mensaje: "API TaskFlow Node.js funcionando"
    });
});

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            mensaje: "Conexión a PostgreSQL exitosa",
            fecha: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error de conexión a PostgreSQL"
        });
    }
});

app.listen(5001, () => {
    console.log("Servidor Node.js ejecutándose en http://localhost:5001");
});