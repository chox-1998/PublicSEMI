from flask import Flask, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from db import obtener_conexion

app = Flask(__name__)
CORS(app)


@app.route("/")
def inicio():
    return {
        "mensaje": "TaskFlow + CloudDrive - API Python",
        "estado": "funcionando"
    }


@app.route("/db-test")
def db_test():
    try:
        conexion = obtener_conexion()
        conexion.close()

        return {
            "mensaje": "Conexión a PostgreSQL exitosa",
            "estado": "conectado"
        }

    except Exception as e:
        return {
            "mensaje": "Error de conexión a PostgreSQL",
            "error": str(e)
        }, 500


# ============================================================
# USUARIOS
# ============================================================

@app.route("/usuarios", methods=["POST"])
def crear_usuario():
    datos = request.get_json()

    if not datos:
        return {
            "mensaje": "Los datos del usuario son obligatorios"
        }, 400

    username = datos.get("username")
    email = datos.get("email")
    password = datos.get("password")
    confirmar_password = datos.get("confirmar_password")
    imagen_perfil = datos.get("imagen_perfil")

    if not username or not email or not password or not confirmar_password:
        return {
            "mensaje": "username, email, password y confirmar_password son obligatorios"
        }, 400

    if password != confirmar_password:
        return {
            "mensaje": "Las contraseñas no coinciden"
        }, 400

    password_hash = generate_password_hash(password)

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            INSERT INTO usuarios (username, email, password, imagen_perfil)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (username, email, password_hash, imagen_perfil)
        )

        usuario_id = cursor.fetchone()[0]

        conexion.commit()

        cursor.close()
        conexion.close()

        return {
            "mensaje": "Usuario registrado correctamente",
            "id": usuario_id
        }, 201

    except Exception as e:
        return {
            "mensaje": "Error al registrar usuario",
            "error": str(e)
        }, 500


@app.route("/login", methods=["POST"])
def login():
    datos = request.get_json()

    if not datos:
        return {
            "mensaje": "Los datos de login son obligatorios"
        }, 400

    username = datos.get("username")
    password = datos.get("password")

    if not username or not password:
        return {
            "mensaje": "username y password son obligatorios"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT id, username, email, password, imagen_perfil
            FROM usuarios
            WHERE username = %s
            """,
            (username,)
        )

        usuario = cursor.fetchone()

        cursor.close()
        conexion.close()

        if usuario is None:
            return {
                "mensaje": "Usuario o contraseña incorrectos"
            }, 401

        password_correcta = check_password_hash(
            usuario[3],
            password
        )

        if not password_correcta:
            return {
                "mensaje": "Usuario o contraseña incorrectos"
            }, 401

        return {
            "mensaje": "Login exitoso",
            "usuario": {
                "id": usuario[0],
                "username": usuario[1],
                "email": usuario[2],
                "imagen_perfil": usuario[4]
            }
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al realizar login",
            "error": str(e)
        }, 500


@app.route("/usuarios", methods=["GET"])
def obtener_usuarios():
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT id, username, email, imagen_perfil
            FROM usuarios
            ORDER BY id
            """
        )

        usuarios = cursor.fetchall()

        cursor.close()
        conexion.close()

        resultado = []

        for usuario in usuarios:
            resultado.append({
                "id": usuario[0],
                "username": usuario[1],
                "email": usuario[2],
                "imagen_perfil": usuario[3]
            })

        return resultado, 200

    except Exception as e:
        return {
            "mensaje": "Error al obtener usuarios",
            "error": str(e)
        }, 500


@app.route("/usuarios/<int:id>", methods=["GET"])
def obtener_usuario(id):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT id, username, email, imagen_perfil
            FROM usuarios
            WHERE id = %s
            """,
            (id,)
        )

        usuario = cursor.fetchone()

        cursor.close()
        conexion.close()

        if usuario is None:
            return {
                "mensaje": "Usuario no encontrado"
            }, 404

        return {
            "id": usuario[0],
            "username": usuario[1],
            "email": usuario[2],
            "imagen_perfil": usuario[3]
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al obtener usuario",
            "error": str(e)
        }, 500


@app.route("/usuarios/<int:id>", methods=["PUT"])
def actualizar_usuario(id):
    datos = request.get_json()

    username = datos.get("username")
    email = datos.get("email")
    password = datos.get("password")

    if not username or not email or not password:
        return {
            "mensaje": "username, email y password son obligatorios"
        }, 400

    password_hash = generate_password_hash(password)

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            UPDATE usuarios
            SET username = %s,
                email = %s,
                password = %s
            WHERE id = %s
            RETURNING id
            """,
            (username, email, password_hash, id)
        )

        usuario = cursor.fetchone()

        if usuario is None:
            conexion.rollback()
            cursor.close()
            conexion.close()

            return {
                "mensaje": "Usuario no encontrado"
            }, 404

        conexion.commit()

        cursor.close()
        conexion.close()

        return {
            "mensaje": "Usuario actualizado correctamente",
            "id": usuario[0]
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al actualizar usuario",
            "error": str(e)
        }, 500


@app.route("/usuarios/<int:id>", methods=["DELETE"])
def eliminar_usuario(id):
    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            DELETE FROM usuarios
            WHERE id = %s
            RETURNING id
            """,
            (id,)
        )

        usuario = cursor.fetchone()

        if usuario is None:
            conexion.rollback()
            cursor.close()
            conexion.close()

            return {
                "mensaje": "Usuario no encontrado"
            }, 404

        conexion.commit()

        cursor.close()
        conexion.close()

        return {
            "mensaje": "Usuario eliminado correctamente",
            "id": usuario[0]
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al eliminar usuario",
            "error": str(e)
        }, 500


# ============================================================
# TAREAS
# ============================================================

@app.route("/tareas", methods=["POST"])
def crear_tarea():
    datos = request.get_json()

    if not datos:
        return {
            "mensaje": "Los datos de la tarea son obligatorios"
        }, 400

    usuario_id = datos.get("usuario_id")
    titulo = datos.get("titulo")
    descripcion = datos.get("descripcion")

    if not usuario_id or not titulo:
        return {
            "mensaje": "usuario_id y titulo son obligatorios"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT id
            FROM usuarios
            WHERE id = %s
            """,
            (usuario_id,)
        )

        usuario = cursor.fetchone()

        if usuario is None:
            cursor.close()
            conexion.close()

            return {
                "mensaje": "El usuario no existe"
            }, 404

        cursor.execute(
            """
            INSERT INTO tareas (usuario_id, titulo, descripcion)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (usuario_id, titulo, descripcion)
        )

        tarea_id = cursor.fetchone()[0]

        conexion.commit()

        cursor.close()
        conexion.close()

        return {
            "mensaje": "Tarea creada correctamente",
            "id": tarea_id
        }, 201

    except Exception as e:
        return {
            "mensaje": "Error al crear tarea",
            "error": str(e)
        }, 500


@app.route("/tareas", methods=["GET"])
def obtener_tareas():
    usuario_id = request.args.get("usuario_id")

    if not usuario_id:
        return {
            "mensaje": "usuario_id es obligatorio"
        }, 400

    try:
        usuario_id = int(usuario_id)
    except ValueError:
        return {
            "mensaje": "usuario_id debe ser un número entero"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT id, usuario_id, titulo, descripcion,
                   fecha_creacion, completada
            FROM tareas
            WHERE usuario_id = %s
            ORDER BY id
            """,
            (usuario_id,)
        )

        tareas = cursor.fetchall()

        cursor.close()
        conexion.close()

        resultado = []

        for tarea in tareas:
            resultado.append({
                "id": tarea[0],
                "usuario_id": tarea[1],
                "titulo": tarea[2],
                "descripcion": tarea[3],
                "fecha_creacion": tarea[4].isoformat(),
                "completada": tarea[5]
            })

        return resultado, 200

    except Exception as e:
        return {
            "mensaje": "Error al obtener tareas",
            "error": str(e)
        }, 500


@app.route("/tareas/<int:id>", methods=["GET"])
def obtener_tarea(id):
    usuario_id = request.args.get("usuario_id")

    if not usuario_id:
        return {
            "mensaje": "usuario_id es obligatorio"
        }, 400

    try:
        usuario_id = int(usuario_id)
    except ValueError:
        return {
            "mensaje": "usuario_id debe ser un número entero"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT id, usuario_id, titulo, descripcion,
                   fecha_creacion, completada
            FROM tareas
            WHERE id = %s
              AND usuario_id = %s
            """,
            (id, usuario_id)
        )

        tarea = cursor.fetchone()

        cursor.close()
        conexion.close()

        if tarea is None:
            return {
                "mensaje": "Tarea no encontrada para este usuario"
            }, 404

        return {
            "id": tarea[0],
            "usuario_id": tarea[1],
            "titulo": tarea[2],
            "descripcion": tarea[3],
            "fecha_creacion": tarea[4].isoformat(),
            "completada": tarea[5]
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al obtener tarea",
            "error": str(e)
        }, 500


@app.route("/tareas/<int:id>", methods=["PUT"])
def actualizar_tarea(id):
    datos = request.get_json()

    if not datos:
        return {
            "mensaje": "Los datos de la tarea son obligatorios"
        }, 400

    usuario_id = datos.get("usuario_id")
    titulo = datos.get("titulo")
    descripcion = datos.get("descripcion")
    completada = datos.get("completada")

    if not usuario_id or not titulo:
        return {
            "mensaje": "usuario_id y titulo son obligatorios"
        }, 400

    if completada is None:
        completada = False

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            UPDATE tareas
            SET titulo = %s,
                descripcion = %s,
                completada = %s
            WHERE id = %s
              AND usuario_id = %s
            RETURNING id
            """,
            (
                titulo,
                descripcion,
                completada,
                id,
                usuario_id
            )
        )

        tarea = cursor.fetchone()

        if tarea is None:
            conexion.rollback()
            cursor.close()
            conexion.close()

            return {
                "mensaje": "Tarea no encontrada para este usuario"
            }, 404

        conexion.commit()

        cursor.close()
        conexion.close()

        return {
            "mensaje": "Tarea actualizada correctamente",
            "id": tarea[0]
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al actualizar tarea",
            "error": str(e)
        }, 500


@app.route("/tareas/<int:id>", methods=["DELETE"])
def eliminar_tarea(id):
    usuario_id = request.args.get("usuario_id")

    if not usuario_id:
        return {
            "mensaje": "usuario_id es obligatorio"
        }, 400

    try:
        usuario_id = int(usuario_id)
    except ValueError:
        return {
            "mensaje": "usuario_id debe ser un número entero"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            DELETE FROM tareas
            WHERE id = %s
              AND usuario_id = %s
            RETURNING id
            """,
            (id, usuario_id)
        )

        tarea = cursor.fetchone()

        if tarea is None:
            conexion.rollback()
            cursor.close()
            conexion.close()

            return {
                "mensaje": "Tarea no encontrada para este usuario"
            }, 404

        conexion.commit()

        cursor.close()
        conexion.close()

        return {
            "mensaje": "Tarea eliminada correctamente",
            "id": tarea[0]
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al eliminar tarea",
            "error": str(e)
        }, 500


# ============================================================
# ARCHIVOS
# ============================================================

@app.route("/archivos", methods=["POST"])
def crear_archivo():
    datos = request.get_json()

    if not datos:
        return {
            "mensaje": "Los datos del archivo son obligatorios"
        }, 400

    usuario_id = datos.get("usuario_id")
    nombre = datos.get("nombre")
    tipo = datos.get("tipo")
    url = datos.get("url")

    if not usuario_id or not nombre or not tipo or not url:
        return {
            "mensaje": "usuario_id, nombre, tipo y url son obligatorios"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT id
            FROM usuarios
            WHERE id = %s
            """,
            (usuario_id,)
        )

        usuario = cursor.fetchone()

        if usuario is None:
            cursor.close()
            conexion.close()

            return {
                "mensaje": "El usuario no existe"
            }, 404

        cursor.execute(
            """
            INSERT INTO archivos (usuario_id, nombre, tipo, url)
            VALUES (%s, %s, %s, %s)
            RETURNING id
            """,
            (usuario_id, nombre, tipo, url)
        )

        archivo_id = cursor.fetchone()[0]

        conexion.commit()

        cursor.close()
        conexion.close()

        return {
            "mensaje": "Archivo registrado correctamente",
            "id": archivo_id
        }, 201

    except Exception as e:
        return {
            "mensaje": "Error al registrar archivo",
            "error": str(e)
        }, 500


@app.route("/archivos", methods=["GET"])
def obtener_archivos():
    usuario_id = request.args.get("usuario_id")

    if not usuario_id:
        return {
            "mensaje": "usuario_id es obligatorio"
        }, 400

    try:
        usuario_id = int(usuario_id)
    except ValueError:
        return {
            "mensaje": "usuario_id debe ser un número entero"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT id, usuario_id, nombre, tipo, url
            FROM archivos
            WHERE usuario_id = %s
            ORDER BY id
            """,
            (usuario_id,)
        )

        archivos = cursor.fetchall()

        cursor.close()
        conexion.close()

        resultado = []

        for archivo in archivos:
            resultado.append({
                "id": archivo[0],
                "usuario_id": archivo[1],
                "nombre": archivo[2],
                "tipo": archivo[3],
                "url": archivo[4]
            })

        return resultado, 200

    except Exception as e:
        return {
            "mensaje": "Error al obtener archivos",
            "error": str(e)
        }, 500


@app.route("/archivos/<int:id>", methods=["GET"])
def obtener_archivo(id):
    usuario_id = request.args.get("usuario_id")

    if not usuario_id:
        return {
            "mensaje": "usuario_id es obligatorio"
        }, 400

    try:
        usuario_id = int(usuario_id)
    except ValueError:
        return {
            "mensaje": "usuario_id debe ser un número entero"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            SELECT id, usuario_id, nombre, tipo, url
            FROM archivos
            WHERE id = %s
              AND usuario_id = %s
            """,
            (id, usuario_id)
        )

        archivo = cursor.fetchone()

        cursor.close()
        conexion.close()

        if archivo is None:
            return {
                "mensaje": "Archivo no encontrado para este usuario"
            }, 404

        return {
            "id": archivo[0],
            "usuario_id": archivo[1],
            "nombre": archivo[2],
            "tipo": archivo[3],
            "url": archivo[4]
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al obtener archivo",
            "error": str(e)
        }, 500


@app.route("/archivos/<int:id>", methods=["PUT"])
def actualizar_archivo(id):
    datos = request.get_json()

    if not datos:
        return {
            "mensaje": "Los datos del archivo son obligatorios"
        }, 400

    usuario_id = datos.get("usuario_id")
    nombre = datos.get("nombre")
    tipo = datos.get("tipo")
    url = datos.get("url")

    if not usuario_id or not nombre or not tipo or not url:
        return {
            "mensaje": "usuario_id, nombre, tipo y url son obligatorios"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            UPDATE archivos
            SET nombre = %s,
                tipo = %s,
                url = %s
            WHERE id = %s
              AND usuario_id = %s
            RETURNING id
            """,
            (
                nombre,
                tipo,
                url,
                id,
                usuario_id
            )
        )

        archivo = cursor.fetchone()

        if archivo is None:
            conexion.rollback()
            cursor.close()
            conexion.close()

            return {
                "mensaje": "Archivo no encontrado para este usuario"
            }, 404

        conexion.commit()

        cursor.close()
        conexion.close()

        return {
            "mensaje": "Archivo actualizado correctamente",
            "id": archivo[0]
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al actualizar archivo",
            "error": str(e)
        }, 500


@app.route("/archivos/<int:id>", methods=["DELETE"])
def eliminar_archivo(id):
    usuario_id = request.args.get("usuario_id")

    if not usuario_id:
        return {
            "mensaje": "usuario_id es obligatorio"
        }, 400

    try:
        usuario_id = int(usuario_id)
    except ValueError:
        return {
            "mensaje": "usuario_id debe ser un número entero"
        }, 400

    try:
        conexion = obtener_conexion()
        cursor = conexion.cursor()

        cursor.execute(
            """
            DELETE FROM archivos
            WHERE id = %s
              AND usuario_id = %s
            RETURNING id
            """,
            (id, usuario_id)
        )

        archivo = cursor.fetchone()

        if archivo is None:
            conexion.rollback()
            cursor.close()
            conexion.close()

            return {
                "mensaje": "Archivo no encontrado para este usuario"
            }, 404

        conexion.commit()

        cursor.close()
        conexion.close()

        return {
            "mensaje": "Archivo eliminado correctamente",
            "id": archivo[0]
        }, 200

    except Exception as e:
        return {
            "mensaje": "Error al eliminar archivo",
            "error": str(e)
        }, 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)