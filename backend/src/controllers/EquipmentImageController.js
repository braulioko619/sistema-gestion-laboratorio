const fs = require('fs');
const path = require('path');
const { Equipment, EquipmentImage, User, AuditLog } = require('../models');
const { uploadDirectory } = require('../middleware/uploadEquipmentImage');
const logger = require('../config/logger');

const IMAGE_INCLUDES = [
  { model: User, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
];

// Sube una o más imágenes referenciales del equipo (hasta 5 por solicitud,
// ver middleware/uploadEquipmentImage.js).
exports.uploadImages = async (req, res) => {
  try {
    const equipo = await Equipment.findByPk(req.params.id);
    if (!equipo) {
      return res.status(404).json({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'El equipo no existe' },
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe adjuntar al menos una imagen' },
      });
    }

    const imagenes = await EquipmentImage.bulkCreate(
      req.files.map((file) => ({
        equipment_id: equipo.id,
        nombre_original: file.originalname,
        nombre_almacenado: file.filename,
        tipo_mime: file.mimetype,
        tamano_bytes: file.size,
        subido_por: req.user.id,
      }))
    );

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'equipment_image',
      entidad_id: equipo.id,
      cambios_nuevos: { equipo: equipo.codigo, imagenes: imagenes.length },
      ip_address: req.ip,
    });

    logger.info(`[EQUIPMENT_IMAGE] ${imagenes.length} imagen(es) subida(s) para ${equipo.codigo} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `${imagenes.length} imagen(es) subida(s) correctamente`,
      data: imagenes,
    });
  } catch (error) {
    logger.error(`[EQUIPMENT_IMAGE] Error subiendo imágenes: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_IMAGE_ERROR', message: 'Error subiendo las imágenes' },
    });
  }
};

exports.listImages = async (req, res) => {
  try {
    const imagenes = await EquipmentImage.findAll({
      where: { equipment_id: req.params.id },
      include: IMAGE_INCLUDES,
      order: [['es_principal', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json({ success: true, data: imagenes });
  } catch (error) {
    logger.error(`[EQUIPMENT_IMAGE] Error listando imágenes: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_IMAGES_ERROR', message: 'Error obteniendo las imágenes' },
    });
  }
};

// Sirve el archivo de imagen (el frontend lo consume autenticado como blob,
// igual patrón que las descargas de adjuntos del resto del sistema).
exports.getImageFile = async (req, res) => {
  try {
    const imagen = await EquipmentImage.findByPk(req.params.imageId);
    if (!imagen) {
      return res.status(404).json({
        success: false,
        error: { code: 'IMAGE_NOT_FOUND', message: 'La imagen no existe' },
      });
    }

    const filePath = path.join(uploadDirectory, imagen.nombre_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    return res.sendFile(filePath);
  } catch (error) {
    logger.error(`[EQUIPMENT_IMAGE] Error sirviendo imagen: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'GET_IMAGE_FILE_ERROR', message: 'Error obteniendo la imagen' },
    });
  }
};

exports.setPrincipal = async (req, res) => {
  try {
    const imagen = await EquipmentImage.findByPk(req.params.imageId);
    if (!imagen) {
      return res.status(404).json({
        success: false,
        error: { code: 'IMAGE_NOT_FOUND', message: 'La imagen no existe' },
      });
    }

    await EquipmentImage.update(
      { es_principal: false },
      { where: { equipment_id: imagen.equipment_id } }
    );
    imagen.es_principal = true;
    await imagen.save();

    res.json({ success: true, message: 'Imagen marcada como principal', data: imagen });
  } catch (error) {
    logger.error(`[EQUIPMENT_IMAGE] Error marcando imagen principal: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'SET_PRINCIPAL_IMAGE_ERROR', message: 'Error marcando la imagen como principal' },
    });
  }
};

// Las imágenes son solo referenciales (no registros de conformidad), por lo
// que sí se permite eliminarlas — a diferencia de los documentos y
// certificados, que se conservan siempre.
exports.deleteImage = async (req, res) => {
  try {
    const imagen = await EquipmentImage.findByPk(req.params.imageId);
    if (!imagen) {
      return res.status(404).json({
        success: false,
        error: { code: 'IMAGE_NOT_FOUND', message: 'La imagen no existe' },
      });
    }

    const filePath = path.join(uploadDirectory, imagen.nombre_almacenado);
    await imagen.destroy();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'eliminar',
      entidad: 'equipment_image',
      entidad_id: imagen.id,
      cambios_anteriores: { nombre_original: imagen.nombre_original, equipment_id: imagen.equipment_id },
      ip_address: req.ip,
    });

    res.json({ success: true, message: 'Imagen eliminada correctamente' });
  } catch (error) {
    logger.error(`[EQUIPMENT_IMAGE] Error eliminando imagen: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_IMAGE_ERROR', message: 'Error eliminando la imagen' },
    });
  }
};
