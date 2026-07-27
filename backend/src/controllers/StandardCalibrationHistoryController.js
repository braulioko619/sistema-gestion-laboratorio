const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const XLSX = require('xlsx');
const { StandardCalibrationHistory, Equipment, User, AuditLog, sequelize } = require('../models');
const { uploadDirectory } = require('../middleware/uploadStandardCalibrationCertificate');
const DriftAnalysisService = require('../services/DriftAnalysisService');
const ControlChartService = require('../services/ControlChartService');
const logger = require('../config/logger');

const HISTORY_INCLUDES = [
  { model: User, as: 'registrador', attributes: ['id', 'nombre', 'email'] },
];

function sha256DeArchivo(rutaAbsoluta) {
  return crypto.createHash('sha256').update(fs.readFileSync(rutaAbsoluta)).digest('hex');
}

// Valida un punto individual (compartido por el registro manual y el
// importador CSV). Devuelve null si es válido, o un mensaje de error.
function validarPunto(punto, idx) {
  if (!punto || typeof punto !== 'object') return `Punto ${idx + 1}: debe ser un objeto`;
  if (!punto.punto_medicion) return `Punto ${idx + 1}: punto_medicion es obligatorio`;
  if (punto.valor_certificado === undefined || punto.valor_certificado === null || Number.isNaN(Number(punto.valor_certificado))) {
    return `Punto ${idx + 1}: valor_certificado debe ser numérico`;
  }
  if (!punto.unidad) return `Punto ${idx + 1}: unidad es obligatoria`;
  if (punto.incertidumbre_U === undefined || punto.incertidumbre_U === null || Number.isNaN(Number(punto.incertidumbre_U)) || Number(punto.incertidumbre_U) < 0) {
    return `Punto ${idx + 1}: incertidumbre_U debe ser un número mayor o igual a 0`;
  }
  if (punto.factor_k === undefined || punto.factor_k === null || Number.isNaN(Number(punto.factor_k)) || Number(punto.factor_k) <= 0) {
    return `Punto ${idx + 1}: factor_k debe ser un número mayor a 0`;
  }
  return null;
}

// Registra una calibración (interna o externa) de un patrón: uno o más
// puntos que comparten fecha/tipo/laboratorio/certificado (tarea 3.3). El
// certificado en PDF es opcional (con SHA-256, D1).
exports.registrarCalibracion = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { fecha_calibracion, tipo, laboratorio, certificado_numero, proxima_calibracion } = req.body;

    if (!fecha_calibracion) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'fecha_calibracion es obligatoria' },
      });
    }
    if (!['interna', 'externa'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'tipo debe ser "interna" o "externa"' },
      });
    }

    let puntos = req.body.puntos;
    if (typeof puntos === 'string') {
      try {
        puntos = JSON.parse(puntos);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'puntos debe ser un JSON válido (arreglo de puntos)' },
        });
      }
    }
    if (!Array.isArray(puntos) || puntos.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe indicar al menos un punto calibrado (puntos)' },
      });
    }
    for (let i = 0; i < puntos.length; i += 1) {
      const motivo = validarPunto(puntos[i], i);
      if (motivo) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: motivo } });
      }
    }

    const equipo = await Equipment.findByPk(equipmentId);
    if (!equipo) {
      return res.status(404).json({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'El patrón no existe' },
      });
    }

    let certificadoArchivo = null;
    let certificadoSha256 = null;
    if (req.file) {
      certificadoArchivo = req.file.filename;
      certificadoSha256 = sha256DeArchivo(path.join(uploadDirectory, req.file.filename));
    }

    // "Al registrar, equipment.proxima_calibracion se actualiza" (criterio
    // de aceptación): se aplica el proxima_calibracion recibido SOLO si esta
    // fecha_calibracion es la más reciente conocida para el patrón — así una
    // carga retroactiva de historial antiguo (vía este mismo endpoint o el
    // importador CSV) no pisa por accidente una fecha de próxima calibración
    // más nueva que ya estaba vigente.
    const maxFechaExistente = await StandardCalibrationHistory.max('fecha_calibracion', { where: { equipment_id: equipo.id } });
    const esLaMasReciente = !maxFechaExistente || fecha_calibracion >= maxFechaExistente;

    const filas = await sequelize.transaction(async (t) => {
      const creadas = await StandardCalibrationHistory.bulkCreate(
        puntos.map((p) => ({
          equipment_id: equipo.id,
          fecha_calibracion,
          tipo,
          laboratorio: laboratorio || null,
          certificado_numero: certificado_numero || null,
          certificado_archivo: certificadoArchivo,
          certificado_sha256: certificadoSha256,
          punto_medicion: p.punto_medicion,
          valor_nominal: p.valor_nominal ?? null,
          valor_certificado: p.valor_certificado,
          unidad: p.unidad,
          incertidumbre_U: p.incertidumbre_U,
          factor_k: p.factor_k,
          registrado_por: req.user.id,
        })),
        { transaction: t }
      );

      if (esLaMasReciente && proxima_calibracion) {
        equipo.proxima_calibracion = proxima_calibracion;
        await equipo.save({ transaction: t });
      }

      return creadas;
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'standard_calibration_history',
      entidad_id: filas[0].id,
      cambios_nuevos: { equipo: equipo.codigo, fecha_calibracion, tipo, puntos: puntos.length, proxima_calibracion_actualizada: esLaMasReciente && !!proxima_calibracion },
      ip_address: req.ip,
    });

    logger.info(`[STANDARD_CALIBRATION_HISTORY] Registrada calibración ${tipo} de ${equipo.codigo} (${puntos.length} punto(s)) por ${req.user.email}`);

    res.status(201).json({ success: true, message: 'Calibración registrada correctamente', data: filas });
  } catch (error) {
    logger.error(`[STANDARD_CALIBRATION_HISTORY] Error registrando calibración: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'REGISTER_HISTORY_ERROR', message: 'Error registrando la calibración' },
    });
  }
};

// Historial consultable por equipo y, opcionalmente, filtrado por punto
// (criterio de aceptación de la tarea 3.3).
exports.getHistorialByEquipment = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { punto_medicion } = req.query;

    const where = { equipment_id: equipmentId };
    if (punto_medicion) where.punto_medicion = punto_medicion;

    const historial = await StandardCalibrationHistory.findAll({
      where,
      include: HISTORY_INCLUDES,
      order: [['fecha_calibracion', 'DESC'], ['punto_medicion', 'ASC']],
    });

    res.json({ success: true, data: historial });
  } catch (error) {
    logger.error(`[STANDARD_CALIBRATION_HISTORY] Error listando historial: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_HISTORY_ERROR', message: 'Error obteniendo el historial' },
    });
  }
};

exports.downloadCertificado = async (req, res) => {
  try {
    const registro = await StandardCalibrationHistory.findByPk(req.params.id);
    if (!registro || !registro.certificado_archivo) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'Este registro no tiene un certificado adjunto' },
      });
    }

    const filePath = path.join(uploadDirectory, registro.certificado_archivo);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'standard_calibration_history',
      entidad_id: registro.id,
      ip_address: req.ip,
    });

    return res.download(filePath, `certificado-${registro.certificado_numero || registro.id}.pdf`);
  } catch (error) {
    logger.error(`[STANDARD_CALIBRATION_HISTORY] Error descargando certificado: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_CERTIFICATE_ERROR', message: 'Error descargando el certificado' },
    });
  }
};

// Importador CSV simple (tarea 3.3): carga retroactiva de historial ya
// existente. Todo o nada — si una sola fila es inválida, no se inserta
// ninguna (datos de trazabilidad metrológica, no admite quedar a medias).
// No toca equipment.proxima_calibracion (una carga masiva retroactiva no
// necesariamente refleja el estado más reciente real; si se necesita fijar
// la próxima calibración, se hace aparte con el registro manual).
exports.importarCsv = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe adjuntar el archivo CSV' },
      });
    }

    const equipo = await Equipment.findByPk(equipmentId);
    if (!equipo) {
      return res.status(404).json({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'El patrón no existe' },
      });
    }

    let filas;
    try {
      const libro = XLSX.read(req.file.buffer, { type: 'buffer', raw: true });
      const hoja = libro.Sheets[libro.SheetNames[0]];
      filas = XLSX.utils.sheet_to_json(hoja, { raw: true, defval: null });
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: { code: 'CSV_PARSE_ERROR', message: `No se pudo leer el CSV: ${error.message}` },
      });
    }

    if (filas.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'El CSV no tiene filas de datos' },
      });
    }

    const registros = [];
    for (let i = 0; i < filas.length; i += 1) {
      const fila = filas[i];
      const numeroFila = i + 2; // +1 por índice base 0, +1 por la fila de encabezados

      if (!fila.fecha_calibracion) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `Fila ${numeroFila}: fecha_calibracion es obligatoria` } });
      }
      if (!['interna', 'externa'].includes(fila.tipo)) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `Fila ${numeroFila}: tipo debe ser "interna" o "externa"` } });
      }
      const motivoPunto = validarPunto(fila, i);
      if (motivoPunto) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: `Fila ${numeroFila}: ${motivoPunto.replace(/^Punto \d+: /, '')}` } });
      }

      registros.push({
        equipment_id: equipo.id,
        fecha_calibracion: String(fila.fecha_calibracion),
        tipo: fila.tipo,
        laboratorio: fila.laboratorio || null,
        certificado_numero: fila.certificado_numero || null,
        certificado_archivo: null,
        certificado_sha256: null,
        punto_medicion: String(fila.punto_medicion),
        valor_nominal: fila.valor_nominal ?? null,
        valor_certificado: fila.valor_certificado,
        unidad: fila.unidad,
        incertidumbre_U: fila.incertidumbre_U,
        factor_k: fila.factor_k,
        registrado_por: req.user.id,
      });
    }

    const creados = await sequelize.transaction((t) => StandardCalibrationHistory.bulkCreate(registros, { transaction: t }));

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'standard_calibration_history',
      entidad_id: equipo.id,
      cambios_nuevos: { equipo: equipo.codigo, filas_importadas: creados.length },
      detalles: `Importación CSV de historial: ${creados.length} fila(s) para ${equipo.codigo}`,
      ip_address: req.ip,
    });

    logger.info(`[STANDARD_CALIBRATION_HISTORY] Importadas ${creados.length} filas de historial para ${equipo.codigo} por ${req.user.email}`);

    res.status(201).json({ success: true, message: `${creados.length} registro(s) importado(s) correctamente`, data: { importados: creados.length } });
  } catch (error) {
    logger.error(`[STANDARD_CALIBRATION_HISTORY] Error importando CSV: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'IMPORT_CSV_ERROR', message: 'Error importando el CSV' },
    });
  }
};

// Análisis de deriva (tarea 3.4): sin punto_medicion, analiza todos los
// puntos distintos calibrados del equipo; con punto_medicion, solo ese.
exports.getDriftAnalysis = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { punto_medicion } = req.query;

    const analisis = await DriftAnalysisService.analizarDerivaEquipo(equipmentId, punto_medicion);
    res.json({ success: true, data: analisis });
  } catch (error) {
    if (error.code === 'EQUIPMENT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'El patrón no existe' },
      });
    }
    logger.error(`[STANDARD_CALIBRATION_HISTORY] Error analizando deriva: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'DRIFT_ANALYSIS_ERROR', message: 'Error calculando el análisis de deriva' },
    });
  }
};

// Carta de control (tarea 4.4, D7 "segunda vista"): mismo criterio de
// punto_medicion opcional que getDriftAnalysis.
exports.getControlChart = async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { punto_medicion } = req.query;

    const analisis = await ControlChartService.analizarCartaControlEquipo(equipmentId, punto_medicion);
    res.json({ success: true, data: analisis });
  } catch (error) {
    if (error.code === 'EQUIPMENT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: { code: 'EQUIPMENT_NOT_FOUND', message: 'El patrón no existe' },
      });
    }
    logger.error(`[STANDARD_CALIBRATION_HISTORY] Error calculando carta de control: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CONTROL_CHART_ERROR', message: 'Error calculando la carta de control' },
    });
  }
};
