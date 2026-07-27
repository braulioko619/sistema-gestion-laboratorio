const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '../../uploads/standard-calibration-certificates');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    callback(null, `${crypto.randomUUID()}.pdf`);
  },
});

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (extension !== '.pdf') {
    const error = new Error('Formato de archivo no permitido. El certificado del patrón debe ser un PDF.');
    error.status = 400;
    return callback(error);
  }
  callback(null, true);
};

const uploadStandardCalibrationCertificate = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

module.exports = { uploadStandardCalibrationCertificate, uploadDirectory };
