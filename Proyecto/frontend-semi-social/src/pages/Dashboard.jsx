import { useEffect, useState } from "react";

import {
    CheckSquare,
    Clock,
    FileText,
    Plus,
    ArrowRight
} from "lucide-react";

import StatCard from "../components/StatCard";
import { API_PYTHON } from "../api";

function Dashboard({ usuario, cambiarPagina }) {
    const [tareas, setTareas] = useState([]);
    const [archivos, setArchivos] = useState([]);

    useEffect(() => {
        if (!usuario?.id) {
            return;
        }

        const cargarDatos = async () => {
            try {
                const respuestaTareas = await fetch(
                    `${API_PYTHON}/tareas?usuario_id=${usuario.id}`
                );

                const datosTareas = await respuestaTareas.json();

                if (respuestaTareas.ok) {
                    setTareas(datosTareas);
                }

                const respuestaArchivos = await fetch(
                    `${API_PYTHON}/archivos?usuario_id=${usuario.id}`
                );

                const datosArchivos = await respuestaArchivos.json();

                if (respuestaArchivos.ok) {
                    setArchivos(datosArchivos);
                }
            } catch (error) {
                console.error(
                    "Error al cargar datos del Dashboard:",
                    error
                );
            }
        };

        cargarDatos();
    }, [usuario]);

    const tareasPendientes = tareas.filter(
        (tarea) => !tarea.completada
    ).length;

    const tareasRecientes = [...tareas]
        .sort((a, b) => b.id - a.id)
        .slice(0, 3);

    return (
        <div className="dashboard-page">

            <div className="page-header">
                <div>
                    <p className="page-greeting">
                        Bienvenido de nuevo
                    </p>

                    <h1>
                        {usuario?.username || "Usuario"}
                    </h1>

                    <p className="page-description">
                        Aquí tienes un resumen de tu actividad.
                    </p>
                </div>

                <div className="header-avatar">
                    {usuario?.imagen_perfil ? (
                        <img
                            src={usuario.imagen_perfil}
                            alt="Perfil"
                        />
                    ) : (
                        <span>
                            {(usuario?.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            <div className="stats-grid">

                <StatCard
                    tipo="tareas"
                    titulo="Tareas totales"
                    valor={tareas.length}
                />

                <StatCard
                    tipo="pendientes"
                    titulo="Pendientes"
                    valor={tareasPendientes}
                />

                <StatCard
                    tipo="archivos"
                    titulo="Archivos"
                    valor={archivos.length}
                />

            </div>

            <div className="dashboard-grid">

                <section className="dashboard-card">

                    <div className="card-header">
                        <div>
                            <h2>Tareas recientes</h2>

                            <p>
                                Tus últimas tareas registradas.
                            </p>
                        </div>

                        <button
                            className="text-button"
                            onClick={() => cambiarPagina("tareas")}
                        >
                            Ver todas
                            <ArrowRight size={17} />
                        </button>
                    </div>

                    <div className="task-preview">

                        {tareasRecientes.length === 0 ? (
                            <div className="task-preview-item">
                                <div className="task-check">
                                    <Clock size={18} />
                                </div>

                                <div>
                                    <h3>
                                        No tienes tareas todavía
                                    </h3>

                                    <span>
                                        Crea tu primera tarea.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            tareasRecientes.map((tarea) => (
                                <div
                                    className="task-preview-item"
                                    key={tarea.id}
                                >
                                    <div
                                        className={
                                            tarea.completada
                                                ? "task-check completed"
                                                : "task-check"
                                        }
                                    >
                                        {tarea.completada ? (
                                            <CheckSquare size={18} />
                                        ) : (
                                            <Clock size={18} />
                                        )}
                                    </div>

                                    <div>
                                        <h3>
                                            {tarea.titulo}
                                        </h3>

                                        <span>
                                            {tarea.completada
                                                ? "Completada"
                                                : "Pendiente"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}

                    </div>
                </section>

                <section className="dashboard-card quick-actions">

                    <div className="card-header">
                        <div>
                            <h2>Acciones rápidas</h2>

                            <p>
                                Accede rápidamente a tus herramientas.
                            </p>
                        </div>
                    </div>

                    <button
                        className="quick-action"
                        onClick={() => cambiarPagina("tareas")}
                    >
                        <div className="quick-action-icon">
                            <Plus size={20} />
                        </div>

                        <div>
                            <strong>Nueva tarea</strong>

                            <span>
                                Crea una nueva tarea
                            </span>
                        </div>

                        <ArrowRight size={18} />
                    </button>

                    <button
                        className="quick-action"
                        onClick={() => cambiarPagina("archivos")}
                    >
                        <div className="quick-action-icon">
                            <FileText size={20} />
                        </div>

                        <div>
                            <strong>Subir archivo</strong>

                            <span>
                                Guarda un nuevo archivo
                            </span>
                        </div>

                        <ArrowRight size={18} />
                    </button>

                </section>

            </div>

        </div>
    );
}

export default Dashboard;