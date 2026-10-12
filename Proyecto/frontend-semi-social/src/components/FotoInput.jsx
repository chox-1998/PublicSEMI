import { useEffect, useRef, useState } from "react";
import "./FotoInput.css";

/**
 * Selector de foto: archivo del equipo o captura con webcam.
 * Props:
 *  - archivo: File | null
 *  - onChange(file)
 *  - label: texto sobre el selector
 */
function FotoInput({ archivo, onChange, label = "Foto de perfil" }) {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [camaraActiva, setCamaraActiva] = useState(false);
    const [vistaPrevia, setVistaPrevia] = useState(null);
    const [errorCamara, setErrorCamara] = useState("");

    useEffect(() => {
        if (!archivo) {
            setVistaPrevia(null);
            return;
        }
        const url = URL.createObjectURL(archivo);
        setVistaPrevia(url);
        return () => URL.revokeObjectURL(url);
    }, [archivo]);

    useEffect(() => {
        if (camaraActiva && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [camaraActiva]);

    useEffect(() => detenerCamara, []);

    function detenerCamara() {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCamaraActiva(false);
    }

    async function abrirCamara() {
        setErrorCamara("");
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" }
            });
            setCamaraActiva(true);
        } catch {
            setErrorCamara(
                "No se pudo acceder a la cámara. Revisa los permisos (requiere HTTPS o localhost)."
            );
        }
    }

    function tomarFoto() {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob(
            (blob) => {
                onChange(new File([blob], "webcam.jpg", { type: "image/jpeg" }));
                detenerCamara();
            },
            "image/jpeg",
            0.92
        );
    }

    return (
        <div className="foto-input">
            <span className="foto-input-label">{label}</span>

            {camaraActiva ? (
                <>
                    <video ref={videoRef} autoPlay playsInline muted />
                    <div className="foto-input-acciones">
                        <button type="button" onClick={tomarFoto}>
                            Tomar foto
                        </button>
                        <button type="button" className="secundario" onClick={detenerCamara}>
                            Cancelar
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {vistaPrevia ? (
                        <img src={vistaPrevia} alt="Foto seleccionada" />
                    ) : (
                        <div className="foto-input-vacia">Sin foto</div>
                    )}
                    <div className="foto-input-acciones">
                        <label className="foto-input-boton secundario">
                            Elegir archivo
                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => onChange(e.target.files[0] || null)}
                            />
                        </label>
                        <button type="button" className="secundario" onClick={abrirCamara}>
                            Usar cámara
                        </button>
                    </div>
                </>
            )}

            {errorCamara && <div className="error-message">{errorCamara}</div>}
        </div>
    );
}

export default FotoInput;