
const mensajesService = require("../services/mensajes.service");

function registrarEventosChat(io, socket) {
    socket.on("chat:historial", async (datos = {}, responder) => {
        try {
            const amigoId = Number(datos.amigoId);
            const usuarioId = socket.data.usuario.id;

            if (!Number.isInteger(amigoId) || amigoId <= 0) {
                throw new Error("El identificador del amigo no es válido.");
            }

            if (amigoId === usuarioId) {
                throw new Error("No puedes abrir una conversación contigo mismo.");
            }

            const sonAmigos = await mensajesService.sonAmigos(
                usuarioId,
                amigoId
            );

            if (!sonAmigos) {
                throw new Error("Solo puedes consultar mensajes de tus amigos.");
            }

            const mensajes = await mensajesService.obtenerConversacion(
                usuarioId,
                amigoId,
                50
            );

            if (typeof responder === "function") {
                responder({ ok: true, mensajes });
            }
        } catch (error) {
            if (typeof responder === "function") {
                responder({
                    ok: false,
                    error: error.message || "No fue posible cargar el historial.",
                });
            } else {
                socket.emit("chat:error", {
                    error: error.message || "No fue posible cargar el historial.",
                });
            }
        }
    });

    socket.on("chat:enviar", async (datos = {}, responder) => {
        try {
            const receptorId = Number(datos.amigoId);
            const contenido = typeof datos.contenido === "string"
                ? datos.contenido.trim()
                : "";

            const emisorId = socket.data.usuario.id;

            if (!Number.isInteger(receptorId) || receptorId <= 0) {
                throw new Error("El identificador del amigo no es válido.");
            }

            if (receptorId === emisorId) {
                throw new Error("No puedes enviarte mensajes a ti mismo.");
            }

            if (!contenido || contenido.length > 2000) {
                throw new Error("El mensaje debe tener entre 1 y 2000 caracteres.");
            }

            const sonAmigos = await mensajesService.sonAmigos(
                emisorId,
                receptorId
            );

            if (!sonAmigos) {
                throw new Error("Solo puedes enviar mensajes a tus amigos.");
            }

            const mensaje = await mensajesService.guardarMensaje(
                emisorId,
                receptorId,
                contenido
            );

            // Notificar solo a los sockets autenticados de ambos usuarios.
            io.to(`usuario:${emisorId}`)
                .to(`usuario:${receptorId}`)
                .emit("chat:nuevo", mensaje);

            if (typeof responder === "function") {
                responder({ ok: true, mensaje });
            }
        } catch (error) {
            if (typeof responder === "function") {
                responder({
                    ok: false,
                    error: error.message || "No fue posible enviar el mensaje.",
                });
            } else {
                socket.emit("chat:error", {
                    error: error.message || "No fue posible enviar el mensaje.",
                });
            }
        }
    });
}

module.exports = { registrarEventosChat };
