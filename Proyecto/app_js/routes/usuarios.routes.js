
const express = require("express");
const usuariosController = require("../controllers/usuarios.controller");
const { autenticarCognito } = require("../middleware/autenticarCognito");
const {
    autenticarUsuarioPerfil,
} = require("../middleware/autenticarUsuarioPerfil");

const router = express.Router();

// Buscar usuarios por nombre o correo.
// Debe estar antes de la ruta dinámica /:id.
router.get(
    "/buscar",
    autenticarCognito,
    autenticarUsuarioPerfil,
    usuariosController.buscarUsuarios
);

// Obtener un usuario por su ID numérico.
router.get(
    "/:id",
    autenticarCognito,
    usuariosController.obtenerUsuarioPorId
);

// Obtener o crear el perfil del usuario autenticado en Cognito.
router.post(
    "/perfil",
    autenticarCognito,
    usuariosController.obtenerMiPerfil
);

module.exports = router;
