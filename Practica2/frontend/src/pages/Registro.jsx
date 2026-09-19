import { useState } from "react";
import { Link } from "lucide-react";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { API_PYTHON } from "../api";

function Registro({ cambiarPagina }) {
    const [formulario, setFormulario] = useState({
        username: "",
        email: "",
        password: "",
        confirmar_password: "",
        imagen_perfil: ""
    });

    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    const manejarCambio = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

    const registrarUsuario = async (e) => {
        e.preventDefault();

        setMensaje("");
        setError("");

        try {
            const respuesta = await fetch(`${API_PYTHON}/usuarios`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formulario)
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(datos.mensaje || "Error al registrar usuario");
                return;
            }

            setMensaje(datos.mensaje);

            setFormulario({
                username: "",
                email: "",
                password: "",
                confirmar_password: "",
                imagen_perfil: ""
            });

        } catch (error) {
            setError("No se pudo conectar con el servidor");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-brand">
                    <div className="auth-logo">
                        <Link size={28} />
                    </div>

                    <h1>TaskFlow</h1>
                    <p>Organiza. Trabaja. Almacena.</p>
                </div>

                <div className="auth-header">
                    <h2>Crear una cuenta</h2>
                    <p>
                        Comienza a organizar tus tareas y archivos.
                    </p>
                </div>

                <form
                    className="auth-form"
                    onSubmit={registrarUsuario}
                >
                    <InputField
                        label="Nombre de usuario"
                        name="username"
                        value={formulario.username}
                        onChange={manejarCambio}
                        placeholder="ejemplo"
                        required
                    />

                    <InputField
                        label="Correo electrónico"
                        name="email"
                        type="email"
                        value={formulario.email}
                        onChange={manejarCambio}
                        placeholder="ejemplo@correo.com"
                        required
                    />

                    <InputField
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={formulario.password}
                        onChange={manejarCambio}
                        placeholder="••••••••"
                        required
                    />

                    <InputField
                        label="Confirmar contraseña"
                        name="confirmar_password"
                        type="password"
                        value={formulario.confirmar_password}
                        onChange={manejarCambio}
                        placeholder="••••••••"
                        required
                    />

                    <InputField
                        label="Imagen de perfil"
                        name="imagen_perfil"
                        type="url"
                        value={formulario.imagen_perfil}
                        onChange={manejarCambio}
                        placeholder="https://ejemplo.com/foto.jpg"
                    />

                    <Button type="submit">
                        Crear cuenta
                    </Button>
                </form>

                {mensaje && (
                    <div className="success-message">
                        {mensaje}
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="auth-footer">
                    ¿Ya tienes una cuenta?
                    <button
                        type="button"
                        onClick={() => cambiarPagina("login")}
                    >
                        Iniciar sesión
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Registro;