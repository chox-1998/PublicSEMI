const { verificarToken } = require("./autenticarCognito");
const usuariosService = require("../services/usuarios.service");

async function autenticarSocket(socket, next) {
    try {
        const token = socket.handshake.auth?.token;

        if (typeof token !== "string" || !token.trim()) {
            return next(new Error("Autenticación requerida."));
        }

        const identidad = await verificarToken.verify(token.trim());

        if (!identidad?.sub) {
            return next(new Error("El token no contiene una identidad válida."));
        }

        const usuario = await usuariosService.obtenerUsuarioPorId(
            identidad.sub
        );

        if (!usuario) {
            return next(
                new Error("No existe un perfil asociado a esta cuenta.")
            );
        }

        socket.data.usuario = {
            id: usuario.id,
            nombreCompleto: usuario.nombre_completo,
        };

        return next();
    } catch (error) {
        console.error(
            "Error autenticando conexión Socket.IO:",
            error.message
        );

        return next(new Error("No fue posible autenticar la conexión."));
    }
}

module.exports = {
    autenticarSocket,
};