import { useEffect, useState } from "react";

import {
    CheckCircle2,
    Circle,
    Plus,
    Pencil,
    Trash2,
    CalendarDays,
    X
} from "lucide-react";

import { API_PYTHON } from "../api";

function Tareas({ usuario }) {
    const [tareas, setTareas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    const [formulario, setFormulario] = useState({
        titulo: "",
        descripcion: ""
    });

    const [procesando, setProcesando] = useState(false);

    /*
     * ============================================================
     * CARGAR TAREAS
     * ============================================================
     */

    const cargarTareas = async () => {
        if (!usuario?.id) {
            return;
        }

        try {
            setCargando(true);
            setError("");

            const respuesta = await fetch(
                `${API_PYTHON}/tareas?usuario_id=${usuario.id}`
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(
                    datos.mensaje ||
                    "No se pudieron cargar las tareas"
                );
                return;
            }

            /*
             * Nos aseguramos de que el estado siempre
             * contenga únicamente tareas válidas.
             */
            const tareasValidas = Array.isArray(datos)
                ? datos.filter((tarea) => tarea)
                : [];

            setTareas(tareasValidas);

        } catch (error) {
            console.error(error);

            setError(
                "No se pudo conectar con el servidor"
            );
        } finally {
            setCargando(false);
        }
    };

    /*
     * ============================================================
     * CARGAR AL ENTRAR
     * ============================================================
     */

    useEffect(() => {
        cargarTareas();
    }, [usuario]);

    /*
     * ============================================================
     * CAMBIOS DEL FORMULARIO
     * ============================================================
     */

    const manejarCambio = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

    /*
     * ============================================================
     * ABRIR FORMULARIO
     * ============================================================
     */

    const abrirFormulario = () => {
        setFormulario({
            titulo: "",
            descripcion: ""
        });

        setEditandoId(null);
        setError("");
        setMostrarFormulario(true);
    };

    /*
     * ============================================================
     * CERRAR FORMULARIO
     * ============================================================
     */

    const cerrarFormulario = () => {
        if (procesando) {
            return;
        }

        setMostrarFormulario(false);
        setEditandoId(null);

        setFormulario({
            titulo: "",
            descripcion: ""
        });
    };

    /*
     * ============================================================
     * CREAR TAREA
     * ============================================================
     */

    const crearTarea = async (e) => {
        e.preventDefault();

        if (!formulario.titulo.trim()) {
            setError(
                "El título de la tarea es obligatorio"
            );
            return;
        }

        try {
            setProcesando(true);
            setError("");

            const respuesta = await fetch(
                `${API_PYTHON}/tareas`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        usuario_id: usuario.id,
                        titulo: formulario.titulo,
                        descripcion: formulario.descripcion
                    })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(
                    datos.mensaje ||
                    "No se pudo crear la tarea"
                );
                return;
            }

            /*
             * En lugar de agregar manualmente la respuesta
             * al estado, volvemos a consultar PostgreSQL.
             */
            await cargarTareas();

            cerrarFormulario();

        } catch (error) {
            console.error(error);

            setError(
                "No se pudo conectar con el servidor"
            );
        } finally {
            setProcesando(false);
        }
    };

    /*
     * ============================================================
     * ABRIR EDICIÓN
     * ============================================================
     */

    const abrirEdicion = (tarea) => {
        if (!tarea) {
            return;
        }

        setFormulario({
            titulo: tarea.titulo,
            descripcion: tarea.descripcion || ""
        });

        setEditandoId(tarea.id);
        setError("");
        setMostrarFormulario(true);
    };

    /*
     * ============================================================
     * ACTUALIZAR TAREA
     * ============================================================
     */

    const actualizarTarea = async (e) => {
        e.preventDefault();

        if (!formulario.titulo.trim()) {
            setError(
                "El título de la tarea es obligatorio"
            );
            return;
        }

        try {
            setProcesando(true);
            setError("");

            const tareaActual = tareas.find(
                (tarea) =>
                    tarea &&
                    tarea.id === editandoId
            );

            if (!tareaActual) {
                setError(
                    "No se encontró la tarea que deseas editar"
                );
                return;
            }

            const respuesta = await fetch(
                `${API_PYTHON}/tareas/${editandoId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        usuario_id: usuario.id,
                        titulo: formulario.titulo,
                        descripcion: formulario.descripcion,
                        completada: tareaActual.completada
                    })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(
                    datos.mensaje ||
                    "No se pudo actualizar la tarea"
                );
                return;
            }

            await cargarTareas();

            cerrarFormulario();

        } catch (error) {
            console.error(error);

            setError(
                "No se pudo conectar con el servidor"
            );
        } finally {
            setProcesando(false);
        }
    };

    /*
     * ============================================================
     * CAMBIAR ESTADO
     * ============================================================
     */

    const cambiarEstado = async (tarea) => {
        if (!tarea) {
            return;
        }

        try {
            setProcesando(true);
            setError("");

            const respuesta = await fetch(
                `${API_PYTHON}/tareas/${tarea.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        usuario_id: usuario.id,
                        titulo: tarea.titulo,
                        descripcion: tarea.descripcion,
                        completada: !tarea.completada
                    })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(
                    datos.mensaje ||
                    "No se pudo actualizar el estado de la tarea"
                );
                return;
            }

            await cargarTareas();

        } catch (error) {
            console.error(error);

            setError(
                "No se pudo conectar con el servidor"
            );
        } finally {
            setProcesando(false);
        }
    };

    /*
     * ============================================================
     * ELIMINAR TAREA
     * ============================================================
     */

    const eliminarTarea = async (tarea) => {
        if (!tarea) {
            return;
        }

        const confirmar = window.confirm(
            `¿Deseas eliminar la tarea "${tarea.titulo}"?`
        );

        if (!confirmar) {
            return;
        }

        try {
            setProcesando(true);
            setError("");

            const respuesta = await fetch(
                `${API_PYTHON}/tareas/${tarea.id}?usuario_id=${usuario.id}`,
                {
                    method: "DELETE"
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                setError(
                    datos.mensaje ||
                    "No se pudo eliminar la tarea"
                );
                return;
            }

            await cargarTareas();

        } catch (error) {
            console.error(error);

            setError(
                "No se pudo conectar con el servidor"
            );
        } finally {
            setProcesando(false);
        }
    };

    /*
     * ============================================================
     * FORMATEAR FECHA
     * ============================================================
     */

    const formatearFecha = (fecha) => {
        if (!fecha) {
            return "Sin fecha";
        }

        return new Date(fecha).toLocaleDateString(
            "es-GT",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
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
                        Organización
                    </p>

                    <h1>Tareas</h1>

                    <p className="page-description">
                        Administra tus tareas y mantén tus actividades
                        organizadas.
                    </p>
                </div>

                <button
                    className="primary-action"
                    onClick={abrirFormulario}
                    disabled={procesando}
                >
                    <Plus size={19} />
                    Nueva tarea
                </button>

            </div>

            {mostrarFormulario && (
                <div className="task-form-card">

                    <div className="task-form-header">

                        <div>
                            <h2>
                                {editandoId
                                    ? "Editar tarea"
                                    : "Nueva tarea"}
                            </h2>

                            <p>
                                {editandoId
                                    ? "Modifica la información de la tarea."
                                    : "Registra una nueva actividad."}
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
                        onSubmit={
                            editandoId
                                ? actualizarTarea
                                : crearTarea
                        }
                    >

                        <div className="input-group">

                            <label htmlFor="titulo">
                                Título
                            </label>

                            <input
                                id="titulo"
                                name="titulo"
                                type="text"
                                value={formulario.titulo}
                                onChange={manejarCambio}
                                placeholder="Ejemplo: Preparar presentación"
                                required
                            />

                        </div>

                        <div className="input-group">

                            <label htmlFor="descripcion">
                                Descripción
                            </label>

                            <textarea
                                id="descripcion"
                                name="descripcion"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                placeholder="Describe la actividad..."
                                rows="4"
                            />

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
                                {editandoId ? (
                                    <Pencil size={18} />
                                ) : (
                                    <Plus size={18} />
                                )}

                                {procesando
                                    ? "Guardando..."
                                    : editandoId
                                        ? "Guardar cambios"
                                        : "Crear tarea"}
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

            {cargando && (
                <div className="dashboard-card">
                    <p className="page-description">
                        Cargando tareas...
                    </p>
                </div>
            )}

            {!cargando && !error && tareas.length === 0 && (
                <div className="dashboard-card">

                    <div className="card-header">

                        <div>
                            <h2>No tienes tareas todavía</h2>

                            <p>
                                Crea tu primera tarea para comenzar
                                a organizar tus actividades.
                            </p>
                        </div>

                    </div>

                </div>
            )}

            {!cargando && tareas.length > 0 && (
                <div className="task-list">

                    {tareas
                        .filter((tarea) => tarea)
                        .map((tarea) => (
                            <div
                                className={
                                    tarea.completada
                                        ? "task-card completed-task"
                                        : "task-card"
                                }
                                key={tarea.id}
                            >

                                <button
                                    className="task-status task-status-button"
                                    onClick={() =>
                                        cambiarEstado(tarea)
                                    }
                                    title={
                                        tarea.completada
                                            ? "Marcar como pendiente"
                                            : "Marcar como completada"
                                    }
                                    disabled={procesando}
                                >
                                    {tarea.completada ? (
                                        <CheckCircle2 size={25} />
                                    ) : (
                                        <Circle size={25} />
                                    )}
                                </button>

                                <div className="task-information">

                                    <div className="task-title-row">

                                        <h2>
                                            {tarea.titulo}
                                        </h2>

                                        {tarea.completada && (
                                            <span className="status-badge">
                                                Completada
                                            </span>
                                        )}

                                    </div>

                                    <p>
                                        {tarea.descripcion ||
                                            "Sin descripción"}
                                    </p>

                                    <div className="task-date">

                                        <CalendarDays size={16} />

                                        {formatearFecha(
                                            tarea.fecha_creacion
                                        )}

                                    </div>

                                </div>

                                <div className="task-actions">

                                    <button
                                        title="Editar"
                                        onClick={() =>
                                            abrirEdicion(tarea)
                                        }
                                        disabled={procesando}
                                    >
                                        <Pencil size={18} />
                                    </button>

                                    <button
                                        title="Eliminar"
                                        onClick={() =>
                                            eliminarTarea(tarea)
                                        }
                                        disabled={procesando}
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                </div>

                            </div>
                        ))}

                </div>
            )}

        </div>
    );
}

export default Tareas;