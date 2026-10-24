
const express = require("express");
const publicacionesController = require("../controllers/publicaciones.controller");
const subirImagen = require("../middleware/subirImagen");
const { autenticarCognito } = require("../middleware/autenticarCognito");

const router = express.Router();

router.get(
    "/feed/:usuarioId",
    autenticarCognito,
    publicacionesController.obtenerFeed
);

router.post(
    "/",
    autenticarCognito,
    subirImagen.single("imagen"),
    publicacionesController.crearPublicacion
);

router.get(
    "/:publicacionId",
    autenticarCognito,
    publicacionesController.obtenerPublicacionPorId
);

module.exports = router;
