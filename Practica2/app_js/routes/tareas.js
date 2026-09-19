const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const {
            usuario_id,
            titulo,
            descripcion,
            fecha_creacion,
            completada
        } = req.body;

        if (!usuario_id || !titulo) {
            return res.status(400).json({
                mensaje: "usuario_id y titulo son obligatorios"
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
            `INSERT INTO tareas
            (usuario_id, titulo, descripcion, fecha_creacion, completada)
            VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP), COALESCE($5, false))
            RETURNING id, usuario_id, titulo, descripcion, fecha_creacion, completada`,
            [
                usuario_id,
                titulo,
                descripcion || null,
                fecha_creacion || null,
                completada ?? false
            ]
        );

        res.status(201).json({
            mensaje: "Tarea creada correctamente",
            tarea: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al crear tarea"
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
            `SELECT id, usuario_id, titulo, descripcion, fecha_creacion, completada
             FROM tareas
             WHERE usuario_id = $1
             ORDER BY id`,
            [usuario_id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener tareas"
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
            `SELECT id, usuario_id, titulo, descripcion, fecha_creacion, completada
             FROM tareas
             WHERE id = $1 AND usuario_id = $2`,
            [id, usuario_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Tarea no encontrada para este usuario"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al obtener tarea"
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            usuario_id,
            titulo,
            descripcion,
            completada
        } = req.body;

        if (!usuario_id || !titulo) {
            return res.status(400).json({
                mensaje: "usuario_id y titulo son obligatorios"
            });
        }

        const result = await pool.query(
            `UPDATE tareas
             SET titulo = $1,
                 descripcion = $2,
                 completada = $3
             WHERE id = $4 AND usuario_id = $5
             RETURNING id, usuario_id, titulo, descripcion, fecha_creacion, completada`,
            [
                titulo,
                descripcion || null,
                completada ?? false,
                id,
                usuario_id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Tarea no encontrada para este usuario"
            });
        }

        res.json({
            mensaje: "Tarea actualizada correctamente",
            tarea: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al actualizar tarea"
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
            `DELETE FROM tareas
             WHERE id = $1 AND usuario_id = $2
             RETURNING id`,
            [id, usuario_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Tarea no encontrada para este usuario"
            });
        }

        res.json({
            mensaje: "Tarea eliminada correctamente"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: "Error al eliminar tarea"
        });
    }
});

module.exports = router;