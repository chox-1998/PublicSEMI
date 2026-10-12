import { useState } from "react";
import { UserPlus } from "lucide-react";
import InputField from "../components/InputField";
import Button from "../components/Button";
import FotoInput from "../components/FotoInput";
import { API_PYTHON } from "../api";

const FORMULARIO_INICIAL = {
    nombre_completo: "",
    email: "",
    dpi: "",
    password: "",
    confirmar_password: ""
};

function Registro({ cambiarPagina }) {
    const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
    const [foto, setFoto] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

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

        if (formulario.password !== formulario.confirmar_password) {
            setError("Las contraseñas no coinciden");
            return;
        }

        if (!foto) {
            setError("La foto de perfil es obligatoria");
            return;
        }

        setCargando(true);

        try {
            const datosForm = new FormData();
            Object.entries(formulario).forEach(([campo, valor]) => {
                datosForm.append(campo, valor);
            });
            datosForm.append("photo", foto);

            const respuesta = await fetch(`${API_PYTHON}/register`, {
                method: "POST",
                body: datosForm
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(datos.error || "Error al registrar usuario");
                return;
            }

            setMensaje(datos.message || "Usuario registrado");
            setFormulario(FORMULARIO_INICIAL);
            setFoto(null);

        } catch (error) {
            setError("No se pudo conectar con el servidor");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                <div className="auth-brand">
                    <div className="auth-logo">
                        <UserPlus size={28} />
                    </div>

                    <h1>Semi-Social</h1>
                </div>

                <div className="auth-header">
                    <h2>Crear una cuenta</h2>
                    <p>
                        * Campos son obligatorios
                    </p>
                </div>

                <form
                    className="auth-form"
                    onSubmit={registrarUsuario}
                >
                    <InputField
                        label="* Nombre completo"
                        name="nombre_completo"
                        value={formulario.nombre_completo}
                        onChange={manejarCambio}
                        placeholder="Nombre Apellido"
                        required
                    />

                    <InputField
                        label="* Correo electrónico"
                        name="email"
                        type="email"
                        value={formulario.email}
                        onChange={manejarCambio}
                        placeholder="ejemplo@correo.com"
                        required
                    />

                    <InputField
                        label="* DPI"
                        name="dpi"
                        value={formulario.dpi}
                        onChange={manejarCambio}
                        placeholder="0000000000000"
                        required
                    />

                    <InputField
                        label="* Contraseña"
                        name="password"
                        type="password"
                        value={formulario.password}
                        onChange={manejarCambio}
                        placeholder="••••••••"
                        required
                    />

                    <InputField
                        label="Repetir contraseña"
                        name="confirmar_password"
                        type="password"
                        value={formulario.confirmar_password}
                        onChange={manejarCambio}
                        placeholder="••••••••"
                        required
                    />

                    <FotoInput
                        archivo={foto}
                        onChange={setFoto}
                        label="* Foto de perfil"
                    />

                    <Button type="submit" disabled={cargando}>
                        {cargando ? "Registrando..." : "Crear cuenta"}
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