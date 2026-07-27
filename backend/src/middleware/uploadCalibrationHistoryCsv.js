const multer = require('multer');
const path = require('path');

// El importador (tarea 3.3) parsea el CSV directo desde memoria (con la
// librería `xlsx`, ya dependencia del proyecto) y no necesita persistir el
// archivo — a diferencia de los demás middlewares de subida de este
// proyecto, que sí escriben a disco porque el archivo original importa como
// evidencia (raw data, certificados). Aquí lo que importa es el resultado
// ya cargado en la BD, no el CSV en sí.
const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension !== '.csv') {
    const error = new Error('Formato de archivo no permitido. El importador solo acepta CSV.');
    error.status = 400;
    return callback(error);
  }
  callback(null, true);
};

const uploadCalibrationHistoryCsv = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

module.exports = { uploadCalibrationHistoryCsv };
