
require("dotenv").config();

const { pool } = require("./config/database");

async function main() {
    try {
        const conexion = await pool.query(`
            SELECT current_database() AS base_datos
        `);

        console.log("Base de datos conectada:", conexion.rows[0].base_datos);

        const columnas = await pool.query(`
            SELECT
                table_name AS tabla,
                ordinal_position AS posicion,
                column_name AS columna,
                data_type AS tipo,
                is_nullable AS permite_null,
                column_default AS valor_predeterminado
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position
        `);

        console.log("\n--- COLUMNAS DE LAS TABLAS ---");
        console.table(columnas.rows);

        const relaciones = await pool.query(`
            SELECT
                tc.table_name AS tabla,
                kcu.column_name AS columna,
                ccu.table_name AS tabla_referenciada,
                ccu.column_name AS columna_referenciada,
                tc.constraint_name AS restriccion
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.constraint_schema = kcu.constraint_schema
            JOIN information_schema.constraint_column_usage ccu
                ON tc.constraint_name = ccu.constraint_name
                AND tc.constraint_schema = ccu.constraint_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = 'public'
            ORDER BY tc.table_name, kcu.column_name
        `);

        console.log("\n--- RELACIONES ENTRE TABLAS ---");
        console.table(relaciones.rows);

        
        const restricciones = await pool.query(`
            SELECT
                tc.constraint_name AS restriccion,
                tc.constraint_type AS tipo,
                kcu.column_name AS columna,
                cc.check_clause AS condicion
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.constraint_schema = kcu.constraint_schema
            LEFT JOIN information_schema.check_constraints cc
                ON tc.constraint_name = cc.constraint_name
                AND tc.constraint_schema = cc.constraint_schema
            WHERE tc.table_schema = 'public'
              AND tc.table_name = 'comentarios'
            ORDER BY tc.constraint_type, tc.constraint_name
        `);

        console.log("\n--- RESTRICCIONES DE COMENTARIOS ---");
        console.table(restricciones.rows);

        
        const conteos = await pool.query(`
            SELECT 'usuarios' AS tabla, COUNT(*)::int AS total
            FROM usuarios

            UNION ALL

            SELECT 'publicaciones', COUNT(*)::int
            FROM publicaciones

            UNION ALL

            SELECT 'amistades aceptadas', COUNT(*)::int
            FROM amistades
            WHERE estado = 'aceptada'

            UNION ALL

            SELECT 'comentarios', COUNT(*)::int
            FROM comentarios

            UNION ALL

            SELECT 'etiquetas', COUNT(*)::int
            FROM etiquetas
        `);

        console.log("\n--- CONTEO DE REGISTROS ---");
        console.table(conteos.rows);


    } catch (error) {
        console.error("Error al consultar PostgreSQL.");
        console.error("Código:", error.code || "sin código");
        console.error("Mensaje:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
