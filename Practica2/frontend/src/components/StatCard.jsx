import {
    CheckSquare,
    Clock,
    FileText
} from "lucide-react";

const iconos = {
    tareas: CheckSquare,
    pendientes: Clock,
    archivos: FileText
};

function StatCard({
    tipo,
    titulo,
    valor
}) {
    const Icono = iconos[tipo];

    return (
        <div className="stat-card">
            <div className="stat-icon">
                <Icono size={24} />
            </div>

            <div>
                <p className="stat-title">
                    {titulo}
                </p>

                <h3 className="stat-value">
                    {valor}
                </h3>
            </div>
        </div>
    );
}

export default StatCard;