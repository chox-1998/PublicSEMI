import os
import uuid
import hashlib
import datetime

import boto3
import jwt
import psycopg2
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from db import obtener_conexion

load_dotenv()

REGION = os.getenv("AWS_REGION", "us-east-1")
BUCKET = os.getenv("S3_BUCKET")
JWT_SECRET = os.getenv("JWT_SECRET", "cambiar-esto")
FACE_THRESHOLD = float(os.getenv("FACE_THRESHOLD", "90"))

# Las credenciales las toma boto3 del rol de la EC2 (recomendado) o de variables de entorno
s3 = boto3.client("s3", region_name=REGION)
rekognition = boto3.client("rekognition", region_name=REGION)

app = Flask(__name__)
CORS(app)

def md5(text: str) -> str:
    # La rúbrica pide MD5 para las contraseñas
    return hashlib.md5(text.encode()).hexdigest()


def make_token(user_id, email):
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def error(msg, code=400):
    return jsonify({"error": msg}), code


def count_faces(image_bytes):
    """Devuelve cuántos rostros detecta Rekognition en la imagen."""
    res = rekognition.detect_faces(Image={"Bytes": image_bytes})
    return len([f for f in res["FaceDetails"] if f["Confidence"] > 90])

@app.get("/health")
def health():
    # Úsalo como Health Check del Target Group del ALB
    return jsonify({"status": "ok"})


@app.post("/register")
def register():
    f = request.form
    nombre_completo = f.get("nombre_completo", "").strip()
    email = f.get("email", "").strip().lower()
    dpi = f.get("dpi", "").strip()
    password = f.get("password", "")
    password2 = f.get("confirmar_password", "")
    photo = request.files.get("photo")

    if not all([nombre_completo, email, dpi, password, password2]):
        return error("Todos los campos son obligatorios")
    if password != password2:
        return error("Las contraseñas no coinciden")
    if photo is None:
        return error("La foto es obligatoria")

    img = photo.read()
    try:
        faces = count_faces(img)
    except ClientError as e:
        return error(f"Rekognition: {e.response['Error']['Message']}", 500)
    if faces != 1:
        return error("La foto debe contener exactamente un rostro visible")

    # El nombre de la foto lleva el id del usuario (ID_UUID.jpg), así que primero
    # se inserta con un s3_key temporal, luego se sube a S3 y se actualiza la llave.
    # Todo ocurre en una transacción: si algo falla, no queda nada en la BD.
    s3_key = None
    conn = obtener_conexion()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                """INSERT INTO usuarios (nombre_completo, email, password_hash, dpi, s3_key)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (nombre_completo, email, md5(password), dpi, f"pendiente_{uuid.uuid4().hex}"),
            )
            user_id = cur.fetchone()[0]

            s3_key = f"Fotos_Perfil/{user_id}_{uuid.uuid4().hex}.jpg"
            s3.put_object(Bucket=BUCKET, Key=s3_key, Body=img,
                          ContentType=photo.mimetype or "image/jpeg")

            cur.execute("UPDATE usuarios SET s3_key = %s WHERE id = %s", (s3_key, user_id))
    except psycopg2.errors.UniqueViolation:
        return error("Correo o DPI ya registrado", 409)
    except ClientError as e:
        return error(f"S3: {e.response['Error']['Message']}", 500)
    except Exception as e:
        if s3_key:  # la foto ya se había subido pero la BD falló
            s3.delete_object(Bucket=BUCKET, Key=s3_key)
        return error(f"Base de datos: {e}", 500)
    finally:
        conn.close()

    return jsonify({"message": "Usuario registrado", "id": user_id, "s3_key": s3_key}), 201


@app.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    conn = obtener_conexion()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, nombre_completo, email, password_hash, s3_key FROM usuarios WHERE email = %s",
                (email,),
            )
            row = cur.fetchone()
    finally:
        conn.close()

    if not row or row[3] != md5(password):
        return error("Correo o contraseña incorrectos", 401)

    return jsonify({
        "token": make_token(row[0], row[2]),
        "user": {"id": row[0], "nombre_completo": row[1], "email": row[2], "s3_key": row[4]},
    })


@app.post("/login-face")
def login_face():
    """Login con rostro. Si se envía email compara solo con ese usuario,
    si no, recorre todos los usuarios (suficiente para pruebas)."""
    photo = request.files.get("photo")
    email = request.form.get("email", "").strip().lower()
    if photo is None:
        return error("Se requiere una foto")

    img = photo.read()
    try:
        if count_faces(img) < 1:
            return error("No se detectó ningún rostro en la foto")
    except ClientError as e:
        return error(f"Rekognition: {e.response['Error']['Message']}", 500)

    conn = obtener_conexion()
    try:
        with conn.cursor() as cur:
            if email:
                cur.execute("SELECT id, nombre_completo, email, s3_key FROM usuarios WHERE email = %s", (email,))
            else:
                cur.execute("SELECT id, nombre_completo, email, s3_key FROM usuarios")
            candidates = cur.fetchall()
    finally:
        conn.close()

    best = None
    for uid, nombre, mail, key in candidates:
        try:
            res = rekognition.compare_faces(
                SourceImage={"Bytes": img},
                TargetImage={"S3Object": {"Bucket": BUCKET, "Name": key}},
                SimilarityThreshold=FACE_THRESHOLD,
            )
        except ClientError:
            continue  # la foto guardada no tiene rostro legible, se omite
        for m in res["FaceMatches"]:
            if best is None or m["Similarity"] > best[0]:
                best = (m["Similarity"], uid, nombre, mail, key)

    if best is None:
        return error("Rostro no reconocido", 401)

    sim, uid, nombre, mail, key = best
    return jsonify({
        "token": make_token(uid, mail),
        "similarity": round(sim, 2),
        "user": {"id": uid, "nombre_completo": nombre, "email": mail, "s3_key": key},
    })


@app.get("/me")
def me():
    """Ejemplo de endpoint protegido con JWT."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return error("Token requerido", 401)
    try:
        payload = jwt.decode(auth[7:], JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        return error("Token inválido o expirado", 401)
    return jsonify({"id": payload["sub"], "email": payload["email"]})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))