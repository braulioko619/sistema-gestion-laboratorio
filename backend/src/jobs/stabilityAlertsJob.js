const cron = require('node-cron');
const logger = require('../config/logger');
const { generarAlertasDiarias } = require('../services/StabilityAlertService');

// Tarea 3.5: job diario a las 06:00 (hora del servidor). Vive fuera de
// app.js a propósito: los tests E2E (etapa1/etapa2) requieren app.js
// directamente sin levantar un servidor, y no deben disparar un cron.
function startStabilityAlertsJob() {
  cron.schedule('0 6 * * *', async () => {
    try {
      const resumen = await generarAlertasDiarias();
      logger.info(`[STABILITY_ALERTS_JOB] Ejecución diaria completa: ${JSON.stringify(resumen)}`);
    } catch (error) {
      logger.error(`[STABILITY_ALERTS_JOB] Error en la ejecución diaria: ${error.message}`);
    }
  });
  logger.info('[STABILITY_ALERTS_JOB] Job diario programado (06:00).');
}

module.exports = { startStabilityAlertsJob };
