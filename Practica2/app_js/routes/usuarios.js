const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            confirmar_password,
            imagen_perfil
        } = req.body;

        if (!username || !email || !password || !confirmar_password) {
            return res.status(400).json({
                mensaje: "Todos los campos obligatorios deben completarse"
            });
        }

        if (password !== confirmar_password) {
            return res.status(400).json({
                mensaje: "Las contraseñas no coinciden"
            });
        }

        const usuarioExistente = await pool.query(
            "SELECT id FROM usuarios WHERE username = $1 OR email = $2",
            [username, email]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({
                mensaje: "El usuario o correo ya existe"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO usuarios
            (username, email, password, imagen_perfil)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
            [username, email, passwordHash, imagen_perfil || null]
        );

        res.status(201).json({
            id: result.rows[0].id,
            mensaje: "Usuario registrado correctamente"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al registrar usuario"
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, username, email, imagen_perfil
             FROM usuarios
             ORDER BY id`
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener usuarios"
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, username, email, imagen_perfil
             FROM usuarios
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener usuario"
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            username,
            email,
            password,
            confirmar_password,
            imagen_perfil
        } = req.body;

        if (!username || !email) {
            return res.status(400).json({
                mensaje: "Username y email son obligatorios"
            });
        }

        if (password && password !== confirmar_password) {
            return res.status(400).json({
                mensaje: "Las contraseñas no coinciden"
            });
        }

        const usuarioExistente = await pool.query(
            `SELECT id
             FROM usuarios
             WHERE (username = $1 OR email = $2)
             AND id != $3`,
            [username, email, id]
        );

        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({
                mensaje: "El usuario o correo ya existe"
            });
        }

        let result;

        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);

            result = await pool.query(
                `UPDATE usuarios
                 SET username = $1,
                     email = $2,
                     password = $3,
                     imagen_perfil = $4
                 WHERE id = $5
                 RETURNING id, username, email, imagen_perfil`,
                [
                    username,
                    email,
                    passwordHash,
                    imagen_perfil || null,
                    id
                ]
            );
        } else {
            result = await pool.query(
                `UPDATE usuarios
                 SET username = $1,
                     email = $2,
                     imagen_perfil = $3
                 WHERE id = $4
                 RETURNING id, username, email, imagen_perfil`,
                [
                    username,
                    email,
                    imagen_perfil || null,
                    id
                ]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json({
            mensaje: "Usuario actualizado correctamente",
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al actualizar usuario"
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM usuarios WHERE id = $1 RETURNING id",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        res.json({
            mensaje: "Usuario eliminado correctamente"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al eliminar usuario"
        });
    }
});

module.exports = router;