import { useState } from "react";
import { Cloud } from "lucide-react";
import InputField from "../components/InputField";
import Button from "../components/Button";
import FotoInput from "../components/FotoInput";
import { API_PYTHON } from "../api";

function Login({ cambiarPagina, iniciarSesion }) {
    const [modo, setModo] = useState("password"); // "password" | "rostro"
    const [formulario, setFormulario] = useState({
        email: "",
        password: ""
    });
    const [foto, setFoto] = useState(null);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const manejarCambio = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

    const cambiarModo = () => {
        setError("");
        setModo(modo === "password" ? "rostro" : "password");
    };

    const iniciar = async (e) => {
        e.preventDefault();

        setError("");
        setCargando(true);

        try {
            let respuesta;

            if (modo === "password") {
                respuesta = await fetch(`${API_PYTHON}/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formulario)
                });
            } else {
                if (!foto) {
                    setError("Selecciona o toma una foto");
                    return;
                }

                const datosForm = new FormData();
                datosForm.append("photo", foto);

                respuesta = await fetch(`${API_PYTHON}/login-face`, {
                    method: "POST",
                    body: datosForm
                });
            }

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(datos.error || "Credenciales incorrectas");
                return;
            }

            iniciarSesion(datos.user, datos.token);

        } catch (error) {
            setError("No se pudo conectar con el servidor");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card login-card">

                <div className="auth-brand">
                    <div className="auth-logo">
                        <Cloud size={28} />
                    </div>

                    <h1>Semi-Social</h1>
                </div>

                <div className="auth-header">
                    <h2>Bienvenido de nuevo</h2>
                    <p>
                        {modo === "password"
                            ? "Inicia sesión con tu usuario y contraseña"
                            : "Inicia sesión con tu rostro"}
                    </p>
                </div>

                <form
                    className="auth-form"
                    onSubmit={iniciar}
                >
                    {modo === "password" ? (
                        <InputField
                        label= "Nombre de usuario"
                        name="email"
                        value={formulario.email}
                        onChange={manejarCambio}
                        placeholder="ejemplo"
                        required={modo === "password"}
                    />
                    ) : (
                        // Nothing to render for email input in face recognition mode
                        null
                    )}
                    

                    {modo === "password" ? (
                        <InputField
                            label="Contraseña"
                            name="password"
                            type="password"
                            value={formulario.password}
                            onChange={manejarCambio}
                            placeholder="••••••••"
                            required
                        />
                    ) : (
                        <FotoInput
                            archivo={foto}
                            onChange={setFoto}
                            label="Tu foto"
                        />
                    )}

                    <Button type="submit" disabled={cargando}>
                        {cargando ? "Verificando..." : "Iniciar sesión"}
                    </Button>
                </form>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <div className="auth-footer">
                    <button type="button" onClick={cambiarModo}>
                        {modo === "password"
                            ? "Usar reconocimiento facial"
                            : "Usar contraseña"}
                    </button>
                </div>

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