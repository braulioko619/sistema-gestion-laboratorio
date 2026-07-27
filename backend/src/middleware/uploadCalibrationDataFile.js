const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '../../uploads/calibration-data-files');
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set(['.xlsx', '.xls', '.xlsm']);

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    const error = new Error('Formato de archivo no permitido. El raw data debe ser un Excel (.xlsx, .xls o .xlsm).');
    error.status = 400;
    return callback(error);
  }
  callback(null, true);
};

const uploadCalibrationDataFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
});

module.exports = { uploadCalibrationDataFile, uploadDirectory };
