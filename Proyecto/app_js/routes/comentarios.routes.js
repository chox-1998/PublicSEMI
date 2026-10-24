
const express = require("express");
const comentariosController = require("../controllers/comentarios.controller");
const { autenticarCognito } = require("../middleware/autenticarCognito");

const router = express.Router();

router.post(
    "/:publicacionId/comentarios",
    autenticarCognito,
    comentariosController.crearComentario
);

module.exports = router;
