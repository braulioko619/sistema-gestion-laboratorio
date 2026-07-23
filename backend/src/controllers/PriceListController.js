const { PriceListItem, AuditLog } = require('../models');
const logger = require('../config/logger');

exports.createPriceListItem = async (req, res) => {
  try {
    const { tipo_instrumento, protocolo, rango_aplicable, precio, moneda, notas } = req.body;

    if (!tipo_instrumento || !protocolo || precio === undefined || precio === null || precio === '') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'El tipo de instrumento, protocolo y precio son obligatorios' },
      });
    }
    if (Number(precio) < 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'El precio no puede ser negativo' } });
    }

    const tarifa = await PriceListItem.create({
      tipo_instrumento,
      protocolo,
      rango_aplicable,
      precio,
      moneda: moneda || 'CLP',
      notas,
      creado_por: req.user.id,
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'price_list_item',
      entidad_id: tarifa.id,
      cambios_nuevos: { tipo_instrumento, protocolo, precio },
      ip_address: req.ip,
    });

    logger.info(`[PRICE_LIST] Tarifa creada para "${tipo_instrumento}" por ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Tarifa registrada correctamente', data: tarifa });
  } catch (error) {
    logger.error(`[PRICE_LIST] Error creando tarifa: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'CREATE_PRICE_LIST_ITEM_ERROR', message: 'Error registrando la tarifa' } });
  }
};

exports.getPriceListItems = async (req, res) => {
  try {
    const { tipo_instrumento, vigente } = req.query;
    const where = {};
    if (tipo_instrumento) where.tipo_instrumento = tipo_instrumento;
    if (vigente !== undefined) where.vigente = vigente === 'true';

    const tarifas = await PriceListItem.findAll({ where, order: [['tipo_instrumento', 'ASC'], ['createdAt', 'DESC']] });
    res.json({ success: true, data: tarifas });
  } catch (error) {
    logger.error(`[PRICE_LIST] Error listando tarifas: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'GET_PRICE_LIST_ERROR', message: 'Error obteniendo el tarifario' } });
  }
};

exports.updatePriceListItem = async (req, res) => {
  try {
    const tarifa = await PriceListItem.findByPk(req.params.id);
    if (!tarifa) {
      return res.status(404).json({ success: false, error: { code: 'PRICE_LIST_ITEM_NOT_FOUND', message: 'La tarifa no existe' } });
    }

    const camposPermitidos = ['tipo_instrumento', 'protocolo', 'rango_aplicable', 'precio', 'moneda', 'vigente', 'notas'];
    const cambiosAnteriores = {};
    const cambiosNuevos = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined && req.body[campo] !== tarifa[campo]) {
        cambiosAnteriores[campo] = tarifa[campo];
        cambiosNuevos[campo] = req.body[campo];
        tarifa[campo] = req.body[campo];
      }
    });

    await tarifa.save();

    if (Object.keys(cambiosNuevos).length > 0) {
      await AuditLog.create({
        usuario_id: req.user.id,
        accion: 'actualizar',
        entidad: 'price_list_item',
        entidad_id: tarifa.id,
        cambios_anteriores: cambiosAnteriores,
        cambios_nuevos: cambiosNuevos,
        ip_address: req.ip,
      });
    }

    logger.info(`[PRICE_LIST] Tarifa ${tarifa.id} actualizada por ${req.user.email}`);
    res.json({ success: true, message: 'Tarifa actualizada correctamente', data: tarifa });
  } catch (error) {
    logger.error(`[PRICE_LIST] Error actualizando tarifa: ${error.message}`);
    res.status(500).json({ success: false, error: { code: 'UPDATE_PRICE_LIST_ITEM_ERROR', message: 'Error actualizando la tarifa' } });
  }
};
