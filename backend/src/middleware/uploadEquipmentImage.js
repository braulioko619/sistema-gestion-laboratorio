const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '../../uploads/equipment-images');
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);

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
    const error = new Error('Formato de imagen no permitido. Se acepta JPG, PNG o WEBP.');
    error.status = 400;
    return callback(error);
  }
  callback(null, true);
};

const uploadEquipmentImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
});

module.exports = { uploadEquipmentImage, uploadDirectory };
