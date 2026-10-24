
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const http = require("node:http");
const { Server } = require("socket.io");

const { probarConexion } = require("./config/database");

const usuariosRoutes = require("./routes/usuarios.routes");
const publicacionesRoutes = require("./routes/publicaciones.routes");
const comentariosRoutes = require("./routes/comentarios.routes");
const amistadesRoutes = require("./routes/amistades.routes");

const { autenticarSocket } = require("./middleware/autenticarSocket");
const { registrarEventosChat } = require("./socket/chat.socket");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
    },
});

// Autenticar las conexiones de Socket.IO mediante Cognito.
io.use(autenticarSocket);

// Registrar los eventos del chat para cada usuario autenticado.
io.on("connection", (socket) => {
    const usuarioId = socket.data.usuario.id;

    // Sala privada para recibir mensajes destinados a este usuario.
    socket.join(`usuario:${usuarioId}`);

    console.log(`Usuario ${usuarioId} conectado al chat`);

    registrarEventosChat(io, socket);

    socket.on("disconnect", (reason) => {
        console.log(
            `Usuario ${usuarioId} desconectado del chat: ${reason}`
        );
    });
});

app.use(cors());
app.use(express.json());

// Rutas de la API.
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/publicaciones", publicacionesRoutes);
app.use("/api/publicaciones", comentariosRoutes);
app.use("/api/amistades", amistadesRoutes);

// Comprobar que el servidor funciona.
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "app_js",
    });
});

// Comprobar la conexión con PostgreSQL en RDS.
app.get("/health/db", async (req, res) => {
    try {
        const resultado = await probarConexion();

        return res.status(200).json({
            status: "ok",
            database: "connected",
            serverTime: resultado.fecha_servidor,
        });
    } catch (error) {
        console.error(
            "Error al comprobar PostgreSQL:",
            error.message
        );

        return res.status(503).json({
            status: "error",
            database: "unavailable",
        });
    }
});

// Manejo centralizado de errores de carga de archivos.
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                error: "La imagen no puede superar los 5 MB.",
            });
        }

        if (error.code === "LIMIT_FILE_COUNT") {
            return res.status(400).json({
                error: "Solo puedes adjuntar una imagen.",
            });
        }

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({
                error: "El campo de imagen no es válido.",
            });
        }

        return res.status(400).json({
            error: "No fue posible procesar el archivo enviado.",
        });
    }

    if (error.message === "El archivo debe ser una imagen.") {
        return res.status(400).json({
            error: error.message,
        });
    }

    console.error(
        "Error inesperado en el servidor:",
        error.message
    );

    return res.status(500).json({
        error: "Ocurrió un error interno en el servidor.",
    });
});

server.listen(PORT, () => {
    console.log(
        `Backend JavaScript escuchando en el puerto ${PORT}`
    );
});
