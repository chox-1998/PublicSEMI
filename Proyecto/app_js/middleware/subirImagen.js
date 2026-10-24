
const multer = require("multer");

const subirImagen = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (req, file, callback) => {
        if (!file.mimetype || !file.mimetype.startsWith("image/")) {
            return callback(
                new Error("El archivo debe ser una imagen.")
            );
        }

        callback(null, true);
    },
});

module.exports = subirImagen;
