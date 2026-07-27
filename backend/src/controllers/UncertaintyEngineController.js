const { AuditLog } = require('../models');
const UncertaintyEngineService = require('../services/UncertaintyEngineService');
const logger = require('../config/logger');

// Tarea 4.1: dispara el cálculo de incertidumbre GUM sobre las capturas ya
// confirmadas de un ítem (tarea 3.2), y escribe el resultado en
// work_order_items.puntos/incertidumbre_U/factor_k.
exports.calculateUncertainty = async (req, res) => {
  try {
    const { itemId } = req.params;
    const resultado = await UncertaintyEngineService.calcularIncertidumbreItem(itemId);

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'work_order_item',
      entidad_id: itemId,
      cambios_nuevos: { incertidumbre_U: resultado.incertidumbre_U, factor_k: resultado.factor_k, puntos_calculados: resultado.puntos.length },
      detalles: 'Incertidumbre calculada por el motor GUM (tarea 4.1, Pie de Metros)',
      ip_address: req.ip,
    });

    logger.info(`[UNCERTAINTY_ENGINE] Incertidumbre calculada para el ítem ${itemId} por ${req.user.email}: U=${resultado.incertidumbre_U}, ${resultado.puntos.length} punto(s)`);

    res.json({ success: true, message: 'Incertidumbre calculada correctamente', data: resultado });
  } catch (error) {
    if (error.code === 'WORK_ORDER_ITEM_NOT_FOUND') {
      return res.status(404).json({ success: false, error: { code: error.code, message: error.message } });
    }
    if (['NO_CONFIRMED_FORM_ENTRY', 'PATRON_NO_ENCONTRADO', 'CMC_NO_ENCONTRADO', 'VALIDATION_ERROR'].includes(error.code)) {
      return res.status(400).json({ success: false, error: { code: error.code, message: error.message } });
    }
    logger.error(`[UNCERTAINTY_ENGINE] Error calculando incertidumbre: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CALCULATE_UNCERTAINTY_ERROR', message: 'Error calculando la incertidumbre' },
    });
  }
};
