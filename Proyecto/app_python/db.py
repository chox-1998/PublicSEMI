import os
import psycopg2


def obtener_conexion():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "database-2.cvqk40caiisr.us-east-2.rds.amazonaws.com"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "db-1"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "}+sicvn)Q_x4~.9")
    )