const jwt = require("jsonwebtoken");

const JWT_SECRET = "cvqk40caiisr}+sicvn)Q_x4~.9cvqk40caiisr"; // el MISMO que usa Python

if (!JWT_SECRET) {
    throw new Error("Falta la variable de entorno JWT_SECRET");
}

const verificarToken = {
    async verify(token) {
        return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    },
};

async function autenticarCognito(req, res, next) {
    const autorizacion = req.headers.authorization;

    if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Se requiere un token." });
    }

    const token = autorizacion.slice("Bearer ".length).trim();

    if (!token) {
        return res.status(401).json({ error: "El token está vacío." });
    }

    try {
        req.usuarioCognito = await verificarToken.verify(token);
        return next();
    } catch (error) {
        console.error("Error al verificar token:", error.message);
        return res.status(401).json({
            error: "El token no es válido o ha expirado.",
        });
    }
}

module.exports = { autenticarCognito, verificarToken };