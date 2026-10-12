import { useEffect, useRef, useState } from "react";

import {
    FileText,
    Image,
    File,
    Upload,
    Download,
    Trash2,
    X,
    Cloud
} from "lucide-react";

/*
 * ============================================================
 * PROVEEDORES DE ALMACENAMIENTO
 * ============================================================
 * S3 (AWS) y Blob Storage (Azure) guardan el mismo repositorio
 * de archivos. En vez de intentar uno y caer automáticamente al
 * otro, el usuario elige explícitamente con cuál trabajar.
 */

const PROVEEDORES = {
    aws: {
        etiqueta: "S3 (AWS)",
        url: import.meta.env.VITE_API_AWS_URL ||
            "https://TU_ID.execute-api.TU_REGION.amazonaws.com/prod"
    },
    azure: {
        etiqueta: "Blob (Azure)",
        url: import.meta.env.VITE_API_AZURE_URL ||
            "https://TU_APIM.azure-api.net/documentos"
    }
};

function Archivos({ usuario }) {
    const [proveedor, setProveedor] = useState("aws");

    const [archivos, setArchivos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const inputArchivoRef = useRef(null);

    const [procesando, setProcesando] = useState(false);

    const urlBase = PROVEEDORES[proveedor].url;

    /*
     * ============================================================
     * CARGAR ARCHIVOS (listado simple: nombre + tipo)
     * ============================================================
     */

    const cargarArchivos = async () => {
        if (!usuario?.id) {
            return;
        }

        try {
            setCargando(true);
            setError("");

            const respuesta = await fetch(
                `${urlBase}/documentos/listar?usuario_id=${usuario.id}`
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(
                    datos.mensaje ||
                    `No se pudieron cargar los archivos (${PROVEEDORES[proveedor].etiqueta})`
                );
                return;
            }

            const archivosValidos = Array.isArray(datos)
                ? datos.filter((archivo) => archivo?.nombre)
                : [];

            setArchivos(archivosValidos);

        } catch (error) {
            console.error(error);

            setError(
                `No se pudo conectar con ${PROVEEDORES[proveedor].etiqueta}`
            );
        } finally {
            setCargando(false);
        }
    };

    /*
     * ============================================================
     * CARGAR AL ENTRAR O AL CAMBIAR DE PROVEEDOR
     * ============================================================
     */

    useEffect(() => {
        cargarArchivos();
    }, [usuario, proveedor]);

    /*
     * ============================================================
     * SELECCIONAR ARCHIVO DEL DISCO
     * ============================================================
     */

    const manejarSeleccionArchivo = (e) => {
        const archivo = e.target.files?.[0] || null;
        setArchivoSeleccionado(archivo);
    };

    /*
     * ============================================================
     * ABRIR / CERRAR FORMULARIO
     * ============================================================
     */

    const abrirFormulario = () => {
        setArchivoSeleccionado(null);

        if (inputArchivoRef.current) {
            inputArchivoRef.current.value = "";
        }

        setError("");
        setMostrarFormulario(true);
    };

    const cerrarFormulario = () => {
        if (procesando) {
            return;
        }

        setMostrarFormulario(false);
        setArchivoSeleccionado(null);

        if (inputArchivoRef.current) {
            inputArchivoRef.current.value = "";
        }
    };

    /*
     * ============================================================
     * SUBIR ARCHIVO (multipart/form-data -> /documentos/upload)
     * ============================================================
     */

    const subirArchivo = async (e) => {
        e.preventDefault();

        if (!archivoSeleccionado) {
            setError(
                "Selecciona un archivo para continuar"
            );
            return;
        }

        try {
            setProcesando(true);
            setError("");

            const formData = new FormData();
            formData.append("usuario_id", usuario.id);
            formData.append("archivo", archivoSeleccionado);

            const respuesta = await fetch(
                `${urlBase}/documentos/upload`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(
                    datos.mensaje ||
                    `No se pudo subir el archivo a ${PROVEEDORES[proveedor].etiqueta}`
                );
                return;
            }

            await cargarArchivos();

            cerrarFormulario();

        } catch (error) {
            console.error(error);

            setError(
                `No se pudo conectar con ${PROVEEDORES[proveedor].etiqueta}`
            );
        } finally {
            setProcesando(false);
        }
    };

    /*
     * ============================================================
     * VER / DESCARGAR ARCHIVO
     * ============================================================
     */

    const verArchivo = async (archivo) => {
        try {
            setError("");

            const respuesta = await fetch(
                `${urlBase}/documentos/descargar?usuario_id=${usuario.id}` +
                `&nombre=${encodeURIComponent(archivo.nombre)}`
            );

            const datos = await respuesta.json();

            if (!respuesta.ok || !datos.url) {
                setError(
                    datos.mensaje ||
                    `No se pudo obtener el archivo desde ${PROVEEDORES[proveedor].etiqueta}`
                );
                return;
            }

            window.open(
                datos.url,
                "_blank",
                "noopener,noreferrer"
            );

        } catch (error) {
            console.error(error);

            setError(
                `No se pudo conectar con ${PROVEEDORES[proveedor].etiqueta}`
            );
        }
    };

    /*
     * ============================================================
     * ELIMINAR ARCHIVO (por nombre, sin id)
     * ============================================================
     */

    const eliminarArchivo = async (archivo) => {
        if (!archivo) {
            return;
        }

        const confirmar = window.confirm(
            `¿Deseas eliminar "${archivo.nombre}" de ${PROVEEDORES[proveedor].etiqueta}?`
        );

        if (!confirmar) {
            return;
        }

        try {
            setProcesando(true);
            setError("");

            const respuesta = await fetch(
                `${urlBase}/documentos/eliminar?usuario_id=${usuario.id}` +
                `&nombre=${encodeURIComponent(archivo.nombre)}`,
                {
                    method: "DELETE"
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(
                    datos.mensaje ||
                    `No se pudo eliminar el archivo en ${PROVEEDORES[proveedor].etiqueta}`
                );
                return;
            }

            await cargarArchivos();

        } catch (error) {
            console.error(error);

            setError(
                `No se pudo conectar con ${PROVEEDORES[proveedor].etiqueta}`
            );
        } finally {
            setProcesando(false);
        }
    };

    /*
     * ============================================================
     * CAMBIAR DE PROVEEDOR
     * ============================================================
     */

    const cambiarProveedor = (nuevoProveedor) => {
        if (procesando || nuevoProveedor === proveedor) {
            return;
        }

        setError("");
        setProveedor(nuevoProveedor);
    };

    /*
     * ============================================================
     * ICONO SEGÚN TIPO
     * ============================================================
     */

    const obtenerIcono = (tipo) => {
        if (tipo?.startsWith("image/")) {
            return <Image size={23} />;
        }

        if (
            tipo?.startsWith("text/") ||
            tipo === "Texto"
        ) {
            return <FileText size={23} />;
        }

        return <File size={23} />;
    };

    /*
     * ============================================================
     * INTERFAZ
     * ============================================================
     */

    return (
        <div className="content-page">

            <div className="page-header">

                <div>
                    <p className="page-greeting">
                        Almacenamiento
                    </p>

                    <h1>Archivos</h1>

                    <p className="page-description">
                        Administra tus documentos y archivos almacenados.
                    </p>
                </div>

                <button
                    className="primary-action"
                    onClick={abrirFormulario}
                    disabled={procesando}
                >
                    <Upload size={19} />
                    Subir archivo
                </button>

            </div>

            <div className="provider-switch">

                <div className="provider-switch-label">
                    <Cloud size={18} />
                    <span>Operando sobre:</span>
                </div>

                <div className="provider-switch-buttons">

                    <button
                        type="button"
                        className={
                            proveedor === "aws"
                                ? "provider-button provider-button-active"
                                : "provider-button"
                        }
                        onClick={() => cambiarProveedor("aws")}
                        disabled={procesando}
                    >
                        {PROVEEDORES.aws.etiqueta}
                    </button>

                    <button
                        type="button"
                        className={
                            proveedor === "azure"
                                ? "provider-button provider-button-active"
                                : "provider-button"
                        }
                        onClick={() => cambiarProveedor("azure")}
                        disabled={procesando}
                    >
                        {PROVEEDORES.azure.etiqueta}
                    </button>

                </div>

            </div>

            {mostrarFormulario && (
                <div className="task-form-card">

                    <div className="task-form-header">

                        <div>
                            <h2>
                                Subir archivo
                            </h2>

                            <p>
                                Se subirá a {PROVEEDORES[proveedor].etiqueta}.
                            </p>
                        </div>

                        <button
                            className="modal-close"
                            type="button"
                            onClick={cerrarFormulario}
                            disabled={procesando}
                        >
                            <X size={20} />
                        </button>

                    </div>

                    <form
                        className="task-form"
                        onSubmit={subirArchivo}
                    >

                        <div className="input-group">

                            <label htmlFor="archivo">
                                Archivo
                            </label>

                            <input
                                id="archivo"
                                name="archivo"
                                type="file"
                                ref={inputArchivoRef}
                                onChange={manejarSeleccionArchivo}
                                required
                            />

                            {archivoSeleccionado && (
                                <span className="file-selected-hint">
                                    {archivoSeleccionado.name}{" "}
                                    ({archivoSeleccionado.type || "tipo desconocido"})
                                </span>
                            )}

                        </div>

                        <div className="task-form-actions">

                            <button
                                type="button"
                                className="secondary-action"
                                onClick={cerrarFormulario}
                                disabled={procesando}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="primary-action"
                                disabled={procesando}
                            >
                                <Upload size={18} />

                                {procesando
                                    ? "Subiendo..."
                                    : "Subir archivo"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="storage-card">

                <div className="storage-info">

                    <div className="storage-icon">
                        <File size={22} />
                    </div>

                    <div>
                        <strong>
                            Espacio utilizado en {PROVEEDORES[proveedor].etiqueta}
                        </strong>

                        <span>
                            {archivos.length}{" "}
                            {archivos.length === 1
                                ? "archivo almacenado"
                                : "archivos almacenados"}
                        </span>
                    </div>

                </div>

                <div className="storage-bar">

                    <div
                        className="storage-progress"
                        style={{
                            width: `${Math.min(
                                archivos.length * 10,
                                100
                            )}%`
                        }}
                    ></div>

                </div>

                <span className="storage-text">
                    {archivos.length} archivos
                </span>

            </div>

            {cargando && (
                <div className="dashboard-card">
                    <p className="page-description">
                        Cargando archivos desde {PROVEEDORES[proveedor].etiqueta}...
                    </p>
                </div>
            )}

            {!cargando && !error && archivos.length === 0 && (
                <div className="dashboard-card">

                    <div className="card-header">

                        <div>
                            <h2>
                                No tienes archivos todavía
                            </h2>

                            <p>
                                Sube tu primer archivo a {PROVEEDORES[proveedor].etiqueta}
                                {" "}para comenzar a utilizar CloudDrive.
                            </p>
                        </div>

                    </div>

                </div>
            )}

            {!cargando && archivos.length > 0 && (
                <div className="files-card">

                    <div className="files-header">

                        <div>
                            <h2>
                                Mis archivos
                            </h2>

                            <p>
                                Archivos almacenados en {PROVEEDORES[proveedor].etiqueta}.
                            </p>
                        </div>

                    </div>

                    <div className="file-list">

                        {archivos
                            .filter((archivo) => archivo?.nombre)
                            .map((archivo) => (
                                <div
                                    className="file-row"
                                    key={archivo.nombre}
                                >

                                    <div className="file-type-icon">
                                        {obtenerIcono(
                                            archivo.tipo
                                        )}
                                    </div>

                                    <div className="file-information">

                                        <strong>
                                            {archivo.nombre}
                                        </strong>

                                        <span>
                                            {archivo.tipo}
                                        </span>

                                    </div>

                                    <div className="file-actions">

                                        <button
                                            title="Ver archivo"
                                            onClick={() =>
                                                verArchivo(
                                                    archivo
                                                )
                                            }
                                            disabled={procesando}
                                        >
                                            <Download size={18} />
                                        </button>

                                        <button
                                            title="Eliminar archivo"
                                            onClick={() =>
                                                eliminarArchivo(
                                                    archivo
                                                )
                                            }
                                            disabled={procesando}
                                        >
                                            <Trash2 size={18} />
                                        </button>

                                    </div>

                                </div>
                            ))}

                    </div>

                </div>
            )}

        </div>
    );
}

export default Archivos;