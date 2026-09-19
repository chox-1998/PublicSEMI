import { useState } from "react";
import { Cloud } from "lucide-react";
import InputField from "../components/InputField";
import Button from "../components/Button";
import { API_PYTHON } from "../api";

function Login({ cambiarPagina, iniciarSesion }) {
    const [formulario, setFormulario] = useState({
        username: "",
        password: ""
    });

    const [error, setError] = useState("");

    const manejarCambio = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

    const iniciar = async (e) => {
        e.preventDefault();

        setError("");

        try {
            const respuesta = await fetch(`${API_PYTHON}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formulario)
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(datos.mensaje || "Credenciales incorrectas");
                return;
            }

            iniciarSesion(datos.usuario);

        } catch (error) {
            setError("No se pudo conectar con el servidor");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card login-card">

                <div className="auth-brand">
                    <div className="auth-logo">
                        <Cloud size={28} />
                    </div>

                    <h1>TaskFlow</h1>
                    <p>Tu espacio para organizarlo todo.</p>
                </div>

                <div className="auth-header">
                    <h2>Bienvenido de nuevo</h2>
                    <p>
                        Inicia sesión para continuar.
                    </p>
                </div>

                <form
                    className="auth-form"
                    onSubmit={iniciar}
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
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={formulario.password}
                        onChange={manejarCambio}
                        placeholder="••••••••"
                        required
                    />

                    <Button type="submit">
                        Iniciar sesión
                    </Button>
                </form>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="auth-footer">
                    ¿No tienes una cuenta?
                    <button
                        type="button"
                        onClick={() => cambiarPagina("registro")}
                    >
                        Crear cuenta
                    </button>
                </div>

            </div>
        </div>
    );
}

export default Login;