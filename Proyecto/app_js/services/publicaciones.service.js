
const { pool } = require("../config/database");

const { randomUUID } = require("node:crypto");

const {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3 } = require("../config/s3");

async function obtenerFeed(usuarioId) {
    const usuario = await pool.query(
        "SELECT id FROM usuarios WHERE id = $1",
        [usuarioId]
    );

    if (usuario.rowCount === 0) {
        return null;
    }

    const consulta = `
        SELECT
            p.id,
            p.usuario_id,
            u.nombre_completo,
            p.s3_key,
            p.descripcion,
            p.creada_en,
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', e.id,
                        'nombre', e.nombre,
                        'confianza', pe.confianza
                    )
                ) FILTER (WHERE e.id IS NOT NULL),
                '[]'::json
            ) AS etiquetas
        FROM publicaciones p
        INNER JOIN usuarios u
            ON u.id = p.usuario_id
        LEFT JOIN publicacion_etiquetas pe
            ON pe.publicacion_id = p.id
        LEFT JOIN etiquetas e
            ON e.id = pe.etiqueta_id
        WHERE
            p.usuario_id = $1
            OR p.usuario_id IN (
                SELECT amigo_id
                FROM v_amigos
                WHERE usuario_id = $1
            )
        GROUP BY
            p.id,
            p.usuario_id,
            u.nombre_completo,
            p.s3_key,
            p.descripcion,
            p.creada_en
        ORDER BY p.creada_en DESC, p.id DESC
    `;

    const resultado = await pool.query(consulta, [usuarioId]);
    const bucket = process.env.S3_BUCKET;

    if (!bucket) {
        throw new Error("La variable S3_BUCKET no está configurada.");
    }

    const publicaciones = await Promise.all(
        resultado.rows.map(async (publicacion) => {
            const imagenUrl = await getSignedUrl(
                s3,
                new GetObjectCommand({
                    Bucket: bucket,
                    Key: publicacion.s3_key,
                }),
                { expiresIn: 900 }
            );

            return {
                ...publicacion,
                imagen_url: imagenUrl,
            };
        })
    );

    return publicaciones;
}

async function obtenerPublicacionPorId(publicacionId) {
    const consulta = `
        SELECT
            p.id,
            p.usuario_id,
            u.nombre_completo,
            p.s3_key,
            p.descripcion,
            p.creada_en,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', e.id,
                            'nombre', e.nombre,
                            'confianza', pe.confianza
                        )
                        ORDER BY e.nombre
                    )
                    FROM publicacion_etiquetas pe
                    INNER JOIN etiquetas e
                        ON e.id = pe.etiqueta_id
                    WHERE pe.publicacion_id = p.id
                ),
                '[]'::json
            ) AS etiquetas,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', c.id,
                            'usuario_id', c.usuario_id,
                            'nombre_completo', uc.nombre_completo,
                            'contenido', c.contenido,
                            'creado_en', c.creado_en
                        )
                        ORDER BY c.creado_en ASC, c.id ASC
                    )
                    FROM comentarios c
                    INNER JOIN usuarios uc
                        ON uc.id = c.usuario_id
                    WHERE c.publicacion_id = p.id
                ),
                '[]'::json
            ) AS comentarios
        FROM publicaciones p
        INNER JOIN usuarios u
            ON u.id = p.usuario_id
        WHERE p.id = $1
    `;

    const resultado = await pool.query(consulta, [publicacionId]);
    const publicacion = resultado.rows[0] || null;

    if (!publicacion) {
        return null;
    }

    const bucket = process.env.S3_BUCKET;

    if (!bucket) {
        throw new Error("La variable S3_BUCKET no está configurada.");
    }

    const imagenUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
            Bucket: bucket,
            Key: publicacion.s3_key,
        }),
        { expiresIn: 900 }
    );

    return {
        ...publicacion,
        imagen_url: imagenUrl,
    };
}

async function crearPublicacion(usuarioId, imagen, descripcion) {
    const bucket = process.env.S3_BUCKET;

    if (!bucket) {
        throw new Error("La variable S3_BUCKET no está configurada.");
    }

    if (
        !imagen ||
        !Buffer.isBuffer(imagen.buffer) ||
        imagen.buffer.length === 0
    ) {
        throw new Error("La imagen no es válida.");
    }

    const usuario = await pool.query(
        "SELECT id FROM usuarios WHERE id = $1",
        [usuarioId]
    );

    if (usuario.rowCount === 0) {
        return null;
    }

    const tiposPermitidos = {
        "image/jpeg": {
            extension: "jpg",
            firmaValida:
                imagen.buffer.length >= 3 &&
                imagen.buffer[0] === 0xff &&
                imagen.buffer[1] === 0xd8 &&
                imagen.buffer[2] === 0xff,
        },
        "image/png": {
            extension: "png",
            firmaValida:
                imagen.buffer.length >= 8 &&
                imagen.buffer.subarray(0, 8).equals(
                    Buffer.from([
                        0x89, 0x50, 0x4e, 0x47,
                        0x0d, 0x0a, 0x1a, 0x0a,
                    ])
                ),
        },
    };

    const tipo = tiposPermitidos[imagen.mimetype];

    if (!tipo || !tipo.firmaValida) {
        throw new Error(
            "La imagen debe ser un archivo JPEG o PNG válido."
        );
    }

    const s3Key =
        `Fotos_Publicadas/${randomUUID()}.${tipo.extension}`;

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: s3Key,
            Body: imagen.buffer,
            ContentType: imagen.mimetype,
        })
    );

    try {
        const consulta = `
            INSERT INTO publicaciones (
                usuario_id,
                s3_key,
                descripcion
            )
            VALUES ($1, $2, $3)
            RETURNING
                id,
                usuario_id,
                s3_key,
                descripcion,
                creada_en
        `;

        const resultado = await pool.query(consulta, [
            usuarioId,
            s3Key,
            descripcion || null,
        ]);

        const publicacion = resultado.rows[0];

        const imagenUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({
                Bucket: bucket,
                Key: s3Key,
            }),
            { expiresIn: 900 }
        );

        return {
            ...publicacion,
            imagen_url: imagenUrl,
        };
    } catch (error) {
        try {
            await s3.send(
                new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: s3Key,
                })
            );
        } catch (errorS3) {
            console.error(
                "No fue posible limpiar la imagen tras el error:",
                errorS3.message
            );
        }

        throw error;
    }
}

module.exports = {
    obtenerFeed,
    obtenerPublicacionPorId,
    crearPublicacion,
};
