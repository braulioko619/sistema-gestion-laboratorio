const { ChecklistTemplateItem, AuditLog } = require('../models');
const logger = require('../config/logger');

const TIPOS_VALIDOS = ['titulo', 'item'];
const NORMAS_VALIDAS = ['ISO17025', 'ISO17020'];

exports.getChecklistTemplate = async (req, res) => {
  try {
    const { vigente, norma } = req.query;
    const where = {};
    if (vigente !== undefined) where.vigente = vigente === 'true';
    if (norma) where.norma = norma;

    const items = await ChecklistTemplateItem.findAll({ where, order: [['orden', 'ASC']] });
    res.json({ success: true, data: items });
  } catch (error) {
    logger.error(`[CHECKLIST_TEMPLATE] Error listando la plantilla: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_CHECKLIST_TEMPLATE_ERROR', message: 'Error obteniendo la plantilla del checklist' } });
  }
};

exports.createChecklistItem = async (req, res) => {
  try {
    const { orden, tipo, clausula, texto, norma, fuente } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El texto del punto es obligatorio' } });
    }
    if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `El tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` } });
    }
    if (norma && !NORMAS_VALIDAS.includes(norma)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `La norma debe ser una de: ${NORMAS_VALIDAS.join(', ')}` } });
    }

    const normaFinal = norma || 'ISO17025';
    let ordenFinal = Number(orden);
    if (Number.isNaN(ordenFinal)) {
      const ultimo = await ChecklistTemplateItem.max('orden', { where: { norma: normaFinal } });
      ordenFinal = (Number(ultimo) || 0) + 1;
    }

    const item = await ChecklistTemplateItem.create({
      orden: ordenFinal,
      tipo: tipo || 'item',
      clausula: clausula || null,
      texto,
      norma: normaFinal,
      fuente: fuente || null,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'checklist_template_item',
      entidad_id: item.id,
      cambios_nuevos: { orden: ordenFinal, tipo: item.tipo, clausula: item.clausula, norma: normaFinal },
      ip_address: req.ip,
    });

    logger.info(`[CHECKLIST_TEMPLATE] Punto agregado a la plantilla por ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Punto de la plantilla agregado correctamente', data: item });
  } catch (error) {
    logger.error(`[CHECKLIST_TEMPLATE] Error creando punto: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'CREATE_CHECKLIST_ITEM_ERROR', message: 'Error agregando el punto a la plantilla' } });
  }
};

exports.updateChecklistItem = async (req, res) => {
  try {
    const item = await ChecklistTemplateItem.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: { code: 'CHECKLIST_ITEM_NOT_FOUND', message: 'El punto de la plantilla no existe' } });
    }

    if (req.body.tipo !== undefined && !TIPOS_VALIDOS.includes(req.body.tipo)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `El tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` } });
    }
    if (req.body.norma !== undefined && !NORMAS_VALIDAS.includes(req.body.norma)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `La norma debe ser una de: ${NORMAS_VALIDAS.join(', ')}` } });
    }

    const camposPermitidos = ['orden', 'tipo', 'clausula', 'texto', 'vigente', 'norma', 'fuente'];
    const cambiosAnteriores = {};
    const cambiosNuevos = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== item[campo]) {
        cambiosAnteriores[campo] = item[campo];
        cambiosNuevos[campo] = req.body[campo];
        item[campo] = req.body[campo];
      }
    });

    await item.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'checklist_template_item',
        entidad_id: item.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[CHECKLIST_TEMPLATE] Punto ${item.id} actualizado por ${req.user.email}`);
    res.json({ success: true, message: 'Punto de la plantilla actualizado correctamente', data: item });
  } catch (error) {
    logger.error(`[CHECKLIST_TEMPLATE] Error actualizando punto: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'UPDATE_CHECKLIST_ITEM_ERROR', message: 'Error actualizando el punto de la plantilla' } });
  }
};
