CREATE TYPE estado_solicitud AS ENUM ('pendiente', 'aceptada', 'rechazada');

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    dpi VARCHAR(20) UNIQUE NOT NULL,
    s3_key VARCHAR(255) UNIQUE NOT NULL 
);

CREATE TABLE amistades (
    id              SERIAL PRIMARY KEY,
    solicitante_id  INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    receptor_id     INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    estado          estado_solicitud NOT NULL DEFAULT 'pendiente',
    creada_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    respondida_en   TIMESTAMPTZ,
    CONSTRAINT chk_no_autoamistad CHECK (solicitante_id <> receptor_id)
);

-- PARA LOS DUPLOCADOS
CREATE UNIQUE INDEX uq_amistad_par
    ON amistades (LEAST(solicitante_id, receptor_id),
                  GREATEST(solicitante_id, receptor_id));

CREATE INDEX idx_amistades_receptor   ON amistades (receptor_id, estado);
CREATE INDEX idx_amistades_solicitante ON amistades (solicitante_id, estado);


CREATE TABLE publicaciones (
    id           SERIAL PRIMARY KEY,
    usuario_id   INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    s3_key       VARCHAR(255) NOT NULL UNIQUE,   -- imagen (obligatoria)
    descripcion  TEXT,                           -- opcional
    creada_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_publicaciones_fecha   ON publicaciones (creada_en DESC);
CREATE INDEX idx_publicaciones_usuario ON publicaciones (usuario_id, creada_en DESC);

CREATE TABLE etiquetas (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE publicacion_etiquetas (
    publicacion_id  INT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    etiqueta_id     INT NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    confianza       NUMERIC(5,2),               -- % devuelto por Rekognition
    PRIMARY KEY (publicacion_id, etiqueta_id)
);

CREATE INDEX idx_pub_etiquetas_etiqueta ON publicacion_etiquetas (etiqueta_id);

CREATE TABLE comentarios (
    id              SERIAL PRIMARY KEY,
    publicacion_id  INT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    usuario_id      INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido       TEXT NOT NULL,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comentarios_publicacion ON comentarios (publicacion_id, creado_en);

CREATE TABLE mensajes (
    id             SERIAL PRIMARY KEY,
    emisor_id      INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    receptor_id    INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contenido      TEXT NOT NULL,
    enviado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_no_automensaje CHECK (emisor_id <> receptor_id)
);

CREATE INDEX idx_mensajes_conversacion
    ON mensajes (LEAST(emisor_id, receptor_id),
                 GREATEST(emisor_id, receptor_id),
                 enviado_en);

CREATE VIEW v_amigos AS
SELECT solicitante_id AS usuario_id, receptor_id    AS amigo_id FROM amistades WHERE estado = 'aceptada'
UNION ALL
SELECT receptor_id    AS usuario_id, solicitante_id AS amigo_id FROM amistades WHERE estado = 'aceptada';

-- 1) Feed: publicaciones propias + de amigos, más recientes primero
--    (para filtrar por etiqueta, descomentar el EXISTS)
-- SELECT p.*, u.nombre_completo
-- FROM publicaciones p
-- JOIN usuarios u ON u.id = p.usuario_id
-- WHERE (p.usuario_id = :uid
--        OR p.usuario_id IN (SELECT amigo_id FROM v_amigos WHERE usuario_id = :uid))
--   -- AND EXISTS (SELECT 1 FROM publicacion_etiquetas pe
--   --             WHERE pe.publicacion_id = p.id AND pe.etiqueta_id = :etiqueta_id)
-- ORDER BY p.creada_en DESC;

-- 2) Lista de filtros (solo etiquetas presentes en el feed del usuario)
-- SELECT DISTINCT e.id, e.nombre
-- FROM etiquetas e
-- JOIN publicacion_etiquetas pe ON pe.etiqueta_id = e.id
-- JOIN publicaciones p ON p.id = pe.publicacion_id
-- WHERE p.usuario_id = :uid
--    OR p.usuario_id IN (SELECT amigo_id FROM v_amigos WHERE usuario_id = :uid)
-- ORDER BY e.nombre;

-- 3) Usuarios que NO son amigos (ni tienen solicitud pendiente)
-- SELECT u.id, u.nombre_completo, u.s3_key
-- FROM usuarios u
-- WHERE u.id <> :uid
--   AND NOT EXISTS (
--       SELECT 1 FROM amistades a
--       WHERE a.estado IN ('aceptada', 'pendiente')
--         AND ((a.solicitante_id = :uid AND a.receptor_id = u.id)
--           OR (a.receptor_id = :uid AND a.solicitante_id = u.id)));