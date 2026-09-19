const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const {
            usuario_id,
            nombre,
            tipo,
            url
        } = req.body;

        if (!usuario_id || !nombre || !tipo || !url) {
            return res.status(400).json({
                mensaje: "usuario_id, nombre, tipo y url son obligatorios"
            });
        }

        const usuario = await pool.query(
            "SELECT id FROM usuarios WHERE id = $1",
            [usuario_id]
        );

        if (usuario.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Usuario no encontrado"
            });
        }

        const result = await pool.query(
            `INSERT INTO archivos
            (usuario_id, nombre, tipo, url)
            VALUES ($1, $2, $3, $4)
            RETURNING id, usuario_id, nombre, tipo, url`,
            [
                usuario_id,
                nombre,
                tipo,
                url
            ]
        );

        res.status(201).json({
            id: result.rows[0].id,
            mensaje: "Archivo registrado correctamente"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al registrar archivo"
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const { usuario_id } = req.query;

        if (!usuario_id) {
            return res.status(400).json({
                mensaje: "usuario_id es obligatorio"
            });
        }

        const result = await pool.query(
            `SELECT id, usuario_id, nombre, tipo, url
             FROM archivos
             WHERE usuario_id = $1
             ORDER BY id`,
            [usuario_id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener archivos"
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id } = req.query;

        if (!usuario_id) {
            return res.status(400).json({
                mensaje: "usuario_id es obligatorio"
            });
        }

        const result = await pool.query(
            `SELECT id, usuario_id, nombre, tipo, url
             FROM archivos
             WHERE id = $1 AND usuario_id = $2`,
            [id, usuario_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Archivo no encontrado para este usuario"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener archivo"
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            usuario_id,
            nombre,
            tipo,
            url
        } = req.body;

        if (!usuario_id || !nombre || !tipo || !url) {
            return res.status(400).json({
                mensaje: "usuario_id, nombre, tipo y url son obligatorios"
            });
        }

        const result = await pool.query(
            `UPDATE archivos
             SET nombre = $1,
                 tipo = $2,
                 url = $3
             WHERE id = $4 AND usuario_id = $5
             RETURNING id, usuario_id, nombre, tipo, url`,
            [
                nombre,
                tipo,
                url,
                id,
                usuario_id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Archivo no encontrado para este usuario"
            });
        }

        res.json({
            mensaje: "Archivo actualizado correctamente",
            archivo: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al actualizar archivo"
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id } = req.query;

        if (!usuario_id) {
            return res.status(400).json({
                mensaje: "usuario_id es obligatorio"
            });
        }

        const result = await pool.query(
            `DELETE FROM archivos
             WHERE id = $1 AND usuario_id = $2
             RETURNING id`,
            [id, usuario_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Archivo no encontrado para este usuario"
            });
        }

        res.json({
            mensaje: "Archivo eliminado correctamente"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al eliminar archivo"
        });
    }
});

module.exports = router;