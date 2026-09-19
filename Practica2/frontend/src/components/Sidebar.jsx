import {
    LayoutDashboard,
    CheckSquare,
    Files,
    LogOut,
    Cloud
} from "lucide-react";

function Sidebar({
    paginaActual,
    cambiarPagina,
    cerrarSesion
}) {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">
                    <Cloud size={24} />
                </div>

                <div>
                    <h2>TaskFlow</h2>
                    <span>CloudDrive</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <button
                    className={
                        paginaActual === "dashboard"
                            ? "nav-item active"
                            : "nav-item"
                    }
                    onClick={() => cambiarPagina("dashboard")}
                >
                    <LayoutDashboard size={20} />
                    Dashboard
                </button>

                <button
                    className={
                        paginaActual === "tareas"
                            ? "nav-item active"
                            : "nav-item"
                    }
                    onClick={() => cambiarPagina("tareas")}
                >
                    <CheckSquare size={20} />
                    Tareas
                </button>

                <button
                    className={
                        paginaActual === "archivos"
                            ? "nav-item active"
                            : "nav-item"
                    }
                    onClick={() => cambiarPagina("archivos")}
                >
                    <Files size={20} />
                    Archivos
                </button>
            </nav>

            <button
                className="logout-button"
                onClick={cerrarSesion}
            >
                <LogOut size={20} />
                Cerrar sesión
            </button>
        </aside>
    );
}

export default Sidebar;