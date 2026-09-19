import { useState } from "react";

import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Tareas from "./pages/Tareas";
import Archivos from "./pages/Archivos";

import "./App.css";

function App() {
    const [pagina, setPagina] = useState("login");
    const [usuario, setUsuario] = useState(null);

    const cambiarPagina = (nuevaPagina) => {
        setPagina(nuevaPagina);
    };

    const iniciarSesion = (datosUsuario) => {
        setUsuario(datosUsuario);
        setPagina("dashboard");
    };

    const cerrarSesion = () => {
        setUsuario(null);
        setPagina("login");
    };

    if (pagina === "login") {
        return (
            <Login
                cambiarPagina={cambiarPagina}
                iniciarSesion={iniciarSesion}
            />
        );
    }

    if (pagina === "registro") {
        return (
            <Registro
                cambiarPagina={cambiarPagina}
            />
        );
    }

    return (
        <div className="app">

            <Sidebar
                paginaActual={pagina}
                cambiarPagina={cambiarPagina}
                cerrarSesion={cerrarSesion}
            />

            <main className="main-content">

                {pagina === "dashboard" && (
                    <Dashboard
                        usuario={usuario}
                        cambiarPagina={cambiarPagina}
                    />
                )}

                {pagina === "tareas" && (
                    <Tareas
                        usuario={usuario}
                    />
                )}

                {pagina === "archivos" && (
                    <Archivos
                        usuario={usuario}
                    />
                )}

            </main>

        </div>
    );
}

export default App;