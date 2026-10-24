
const express = require("express");
const amistadesController = require("../controllers/amistades.controller");
const { autenticarCognito } = require("../middleware/autenticarCognito");
const {
    autenticarUsuarioPerfil,
} = require("../middleware/autenticarUsuarioPerfil");

const router = express.Router();

// Enviar una solicitud como el usuario autenticado.
router.post(
    "/solicitudes",
    autenticarCognito,
    autenticarUsuarioPerfil,
    amistadesController.enviarSolicitud
);

// Consultar las solicitudes recibidas por el usuario autenticado.
router.get(
    "/solicitudes/recibidas/:usuarioId",
    autenticarCognito,
    autenticarUsuarioPerfil,
    amistadesController.obtenerSolicitudesRecibidas
);

// Responder una solicitud como el usuario autenticado.
router.patch(
    "/solicitudes/:solicitudId",
    autenticarCognito,
    autenticarUsuarioPerfil,
    amistadesController.responderSolicitud
);

// Consultar las amistades del usuario autenticado.
router.get(
    "/:usuarioId",
    autenticarCognito,
    autenticarUsuarioPerfil,
    amistadesController.obtenerAmigos
);

module.exports = router;
