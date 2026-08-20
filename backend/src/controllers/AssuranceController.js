const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const {
  AssuranceActivity,
  AssuranceRecord,
  NonConformity,
  Equipment,
  User,
  AuditLog,
  sequelize,
} = require('../models');
const CorrelativeService = require('../services/CorrelativeService');
const { uploadDirectory } = require('../middleware/uploadAssuranceRecord');
const logger = require('../config/logger');

const ACTIVITY_INCLUDES = [
  { model: User, as: 'responsable', attributes: ['id', 'nombre', 'email'] },
  { model: User, as: 'creador', attributes: ['id', 'nombre', 'email'] },
  { model: Equipment, as: 'equipo', attributes: ['id', 'codigo', 'nombre'] },
  { model: NonConformity, as: 'no_conformidad', attributes: ['id', 'codigo', 'estado'] },
  {
    model: AssuranceRecord,
    as: 'registros',
    include: [{ model: User, as: 'usuario', attributes: ['id', 'nombre'] }],
  },
];

const CRITERIOS = new Set(['numero_en', 'emp', 'carta_control', 'z_score', 'otro']);
const RESULTADOS = new Set(['pendiente', 'conforme', 'no_conforme', 'no_concluyente']);

// Límite por defecto de cada criterio, cuando el usuario no declara uno
// propio. Son los valores de uso corriente en metrología:
//   En: |En| <= 1        (ISO/IEC 17043)
//   z:  |z|  <= 2        (satisfactorio; 2-3 cuestionable)
//   carta de control: 3 sigma
// Para 'emp' no hay valor universal: depende del instrumento, así que el
// límite lo declara siempre quien programa la actividad.
const LIMITE_POR_DEFECTO = {
  numero_en: 1,
  z_score: 2,
  carta_control: 3,
};

// Evalúa la conformidad comparando |valor| contra el límite. Devuelve null
// cuando faltan datos: en ese caso manda lo que haya elegido la persona.
function evaluarConformidad(criterio, valorObtenido, valorLimite) {
  if (valorObtenido === null || valorObtenido === undefined || valorObtenido === '') return null;
  const valor = Math.abs(Number(valorObtenido));
  if (Number.isNaN(valor)) return null;

  const limite = valorLimite !== null && valorLimite !== undefined && valorLimite !== ''
    ? Number(valorLimite)
    : LIMITE_POR_DEFECTO[criterio];

  if (limite === undefined || Number.isNaN(Number(limite))) return null;
  return valor <= Number(limite) ? 'conforme' : 'no_conforme';
}

exports.evaluarConformidad = evaluarConformidad;

// Calcula la próxima fecha a partir de la frecuencia. Sirve para proponer la
// siguiente ocurrencia al cerrar una actividad periódica.
function proximaFecha(fecha, frecuencia) {
  const meses = { mensual: 1, trimestral: 3, semestral: 6, anual: 12, bienal: 24 };
  const salto = meses[frecuencia];
  if (!salto) return null;
  const d = new Date(`${fecha}T00:00:00`);
  d.setMonth(d.getMonth() + salto);
  return d.toISOString().split('T')[0];
}

exports.listActivities = async (req, res) => {
  try {
    const { tipo, estado, resultado, desde, hasta } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (resultado) where.resultado = resultado;
    if (desde && hasta) where.fecha_planificada = { [Op.between]: [desde, hasta] };

    const actividades = await AssuranceActivity.findAll({
      where,
      include: ACTIVITY_INCLUDES,
      order: [['fecha_planificada', 'DESC'], ['createdAt', 'DESC']],
    });

    res.json({ success: true, data: actividades });
  } catch (error) {
    logger.error(`[ASSURANCE] Error listando actividades: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_ASSURANCE_ERROR', message: 'Error obteniendo las actividades de aseguramiento' },
    });
  }
};

// Resumen del programa: sirve de tablero de control del apartado.
exports.getSummary = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const actividades = await AssuranceActivity.findAll({
      attributes: ['estado', 'resultado', 'fecha_planificada', 'tipo'],
      raw: true,
    });

    const resumen = {
      total: actividades.length,
      planificadas: 0,
      ejecutadas: 0,
      vencidas: 0,
      conformes: 0,
      no_conformes: 0,
      no_concluyentes: 0,
      por_tipo: {},
    };

    actividades.forEach((a) => {
      if (a.estado === 'planificada' || a.estado === 'en_ejecucion') resumen.planificadas += 1;
      if (a.estado === 'ejecutada') resumen.ejecutadas += 1;
      // Vencida: pasó la fecha planificada y todavía no se ejecuta.
      if (a.fecha_planificada < hoy && !['ejecutada', 'cancelada'].includes(a.estado)) {
        resumen.vencidas += 1;
      }
      if (a.resultado === 'conforme') resumen.conformes += 1;
      if (a.resultado === 'no_conforme') resumen.no_conformes += 1;
      if (a.resultado === 'no_concluyente') resumen.no_concluyentes += 1;
      resumen.por_tipo[a.tipo] = (resumen.por_tipo[a.tipo] || 0) + 1;
    });

    res.json({ success: true, data: resumen });
  } catch (error) {
    logger.error(`[ASSURANCE] Error obteniendo resumen: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_ASSURANCE_SUMMARY_ERROR', message: 'Error obteniendo el resumen' },
    });
  }
};

exports.createActivity = async (req, res) => {
  try {
    const { tipo, alcance, fecha_planificada, criterio } = req.body;

    if (!tipo || !alcance || !fecha_planificada) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'tipo, alcance y fecha_planificada son obligatorios' },
      });
    }
    if (criterio && !CRITERIOS.has(criterio)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `criterio debe ser uno de: ${[...CRITERIOS].join(', ')}` },
      });
    }

    const actividad = await sequelize.transaction(async (t) => {
      const codigo = await CorrelativeService.next('aseguramiento', { transaction: t });
      return AssuranceActivity.create({
        codigo,
        tipo,
        magnitud: req.body.magnitud || null,
        alcance,
        equipment_id: req.body.equipment_id || null,
        responsable_id: req.body.responsable_id || null,
        frecuencia: req.body.frecuencia || 'unica',
        fecha_planificada,
        criterio: criterio || 'otro',
        criterio_detalle: req.body.criterio_detalle || null,
        valor_limite: req.body.valor_limite ?? null,
        observaciones: req.body.observaciones || null,
        creado_por: req.user.id,
      }, { transaction: t });
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'assurance_activity',
      entidad_id: actividad.id,
      cambios_nuevos: { codigo: actividad.codigo, tipo, fecha_planificada },
      ip_address: req.ip,
    });

    logger.info(`[ASSURANCE] Actividad ${actividad.codigo} (${tipo}) creada por ${req.user.email}`);

    const completa = await AssuranceActivity.findByPk(actividad.id, { include: ACTIVITY_INCLUDES });
    res.status(201).json({ success: true, message: 'Actividad programada', data: completa });
  } catch (error) {
    logger.error(`[ASSURANCE] Error creando actividad: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ASSURANCE_ERROR', message: 'Error creando la actividad' },
    });
  }
};

// Registra la ejecución y el resultado. Si llega un valor medido, la
// conformidad se calcula con el criterio declarado; si no, se acepta el
// resultado que indique la persona.
exports.evaluateActivity = async (req, res) => {
  try {
    const actividad = await AssuranceActivity.findByPk(req.params.id);
    if (!actividad) {
      return res.status(404).json({
        success: false,
        error: { code: 'ACTIVITY_NOT_FOUND', message: 'La actividad no existe' },
      });
    }

    const { fecha_ejecucion, valor_obtenido, valor_limite, evaluacion, observaciones } = req.body;

    const limite = valor_limite ?? actividad.valor_limite;
    const calculado = evaluarConformidad(actividad.criterio, valor_obtenido, limite);
    const resultado = calculado || req.body.resultado;

    if (!resultado || !RESULTADOS.has(resultado)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Indique el valor obtenido o un resultado válido (conforme, no_conforme, no_concluyente)',
        },
      });
    }

    const anterior = { estado: actividad.estado, resultado: actividad.resultado };

    actividad.fecha_ejecucion = fecha_ejecucion || new Date().toISOString().split('T')[0];
    actividad.valor_obtenido = valor_obtenido ?? actividad.valor_obtenido;
    actividad.valor_limite = limite ?? null;
    actividad.resultado = resultado;
    actividad.evaluacion = evaluacion ?? actividad.evaluacion;
    if (observaciones !== undefined) actividad.observaciones = observaciones;
    actividad.estado = 'ejecutada';
    await actividad.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'assurance_activity',
      entidad_id: actividad.id,
      cambios_anteriores: anterior,
      cambios_nuevos: {
        estado: 'ejecutada',
        resultado,
        valor_obtenido: actividad.valor_obtenido,
        criterio_aplicado: calculado ? 'automatico' : 'manual',
      },
      ip_address: req.ip,
    });

    logger.info(`[ASSURANCE] ${actividad.codigo} evaluada como ${resultado} por ${req.user.email}`);

    const completa = await AssuranceActivity.findByPk(actividad.id, { include: ACTIVITY_INCLUDES });
    res.json({
      success: true,
      message: `Actividad registrada como ${resultado.replace('_', ' ')}`,
      data: completa,
      // Sugerencia de la próxima ocurrencia si la actividad es periódica.
      proxima_fecha_sugerida: proximaFecha(actividad.fecha_ejecucion, actividad.frecuencia),
    });
  } catch (error) {
    logger.error(`[ASSURANCE] Error evaluando actividad: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'EVALUATE_ASSURANCE_ERROR', message: 'Error registrando el resultado' },
    });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const actividad = await AssuranceActivity.findByPk(req.params.id);
    if (!actividad) {
      return res.status(404).json({
        success: false,
        error: { code: 'ACTIVITY_NOT_FOUND', message: 'La actividad no existe' },
      });
    }

    const anterior = actividad.toJSON();
    const editables = [
      'tipo', 'magnitud', 'alcance', 'equipment_id', 'responsable_id',
      'frecuencia', 'fecha_planificada', 'estado',
      'criterio', 'criterio_detalle', 'valor_limite', 'observaciones',
    ];
    editables.forEach((campo) => {
      if (req.body[campo] !== undefined) actividad[campo] = req.body[campo] || null;
    });
    await actividad.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'assurance_activity',
      entidad_id: actividad.id,
      cambios_anteriores: { estado: anterior.estado, fecha_planificada: anterior.fecha_planificada },
      cambios_nuevos: { estado: actividad.estado, fecha_planificada: actividad.fecha_planificada },
      ip_address: req.ip,
    });

    const completa = await AssuranceActivity.findByPk(actividad.id, { include: ACTIVITY_INCLUDES });
    res.json({ success: true, message: 'Actividad actualizada', data: completa });
  } catch (error) {
    logger.error(`[ASSURANCE] Error actualizando actividad: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ASSURANCE_ERROR', message: 'Error actualizando la actividad' },
    });
  }
};

// §7.7.3: un resultado fuera de criterio obliga a tomar acción. Crea la no
// conformidad en el módulo existente y la deja vinculada a la actividad, para
// no digitar dos veces lo mismo.
exports.createNonConformity = async (req, res) => {
  try {
    const actividad = await AssuranceActivity.findByPk(req.params.id, {
      include: [{ model: User, as: 'responsable', attributes: ['id', 'nombre'] }],
    });
    if (!actividad) {
      return res.status(404).json({
        success: false,
        error: { code: 'ACTIVITY_NOT_FOUND', message: 'La actividad no existe' },
      });
    }
    if (actividad.nonconformity_id) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_LINKED', message: 'La actividad ya tiene una no conformidad asociada' },
      });
    }
    if (actividad.resultado !== 'no_conforme') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Solo se levanta una no conformidad desde una actividad con resultado no conforme',
        },
      });
    }

    const descripcion = req.body.descripcion
      || `[${actividad.codigo}] Aseguramiento de validez fuera de criterio. `
        + `Alcance: ${actividad.alcance}. `
        + `Criterio: ${actividad.criterio_detalle || actividad.criterio}. `
        + `Valor obtenido: ${actividad.valor_obtenido ?? '—'} (límite ${actividad.valor_limite ?? '—'}).`;

    const nc = await sequelize.transaction(async (t) => {
      const codigo = await NonConformity.generarCodigo();
      const creada = await NonConformity.create({
        codigo,
        fuente: 'aseguramiento',
        descripcion,
        clasificacion: req.body.clasificacion || 'mayor',
        correccion_inmediata: req.body.correccion_inmediata || null,
        decision_trabajo: req.body.decision_trabajo || null,
        responsable_id: actividad.responsable_id || req.user.id,
        estado: 'abierta',
        registrado_por: req.user.id,
      }, { transaction: t });

      actividad.nonconformity_id = creada.id;
      await actividad.save({ transaction: t });
      return creada;
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'non_conformity',
      entidad_id: nc.id,
      cambios_nuevos: { codigo: nc.codigo, fuente: 'aseguramiento', actividad: actividad.codigo },
      ip_address: req.ip,
    });

    logger.info(`[ASSURANCE] NC ${nc.codigo} levantada desde ${actividad.codigo} por ${req.user.email}`);

    const completa = await AssuranceActivity.findByPk(actividad.id, { include: ACTIVITY_INCLUDES });
    res.status(201).json({
      success: true,
      message: `No conformidad ${nc.codigo} creada y vinculada`,
      data: completa,
    });
  } catch (error) {
    logger.error(`[ASSURANCE] Error creando no conformidad: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_NC_ERROR', message: 'Error creando la no conformidad' },
    });
  }
};

// ------------------------------ Registros --------------------------------

exports.uploadRecords = async (req, res) => {
  try {
    const actividad = await AssuranceActivity.findByPk(req.params.id);
    if (!actividad) {
      return res.status(404).json({
        success: false,
        error: { code: 'ACTIVITY_NOT_FOUND', message: 'La actividad no existe' },
      });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe adjuntar al menos un archivo' },
      });
    }

    await AssuranceRecord.bulkCreate(
      req.files.map((file) => ({
        assurance_activity_id: actividad.id,
        descripcion: req.body.descripcion || null,
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
      entidad: 'assurance_record',
      entidad_id: actividad.id,
      cambios_nuevos: { actividad: actividad.codigo, registros: req.files.length },
      ip_address: req.ip,
    });

    const completa = await AssuranceActivity.findByPk(actividad.id, { include: ACTIVITY_INCLUDES });
    res.status(201).json({
      success: true,
      message: `${req.files.length} registro(s) adjuntado(s)`,
      data: completa,
    });
  } catch (error) {
    logger.error(`[ASSURANCE] Error subiendo registros: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_RECORD_ERROR', message: 'Error subiendo los registros' },
    });
  }
};

async function enviarArchivo(req, res, { inline }) {
  const registro = await AssuranceRecord.findByPk(req.params.recordId);
  if (!registro) {
    return res.status(404).json({
      success: false,
      error: { code: 'RECORD_NOT_FOUND', message: 'El registro no existe' },
    });
  }

  const filePath = path.join(uploadDirectory, registro.nombre_almacenado);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
    });
  }

  if (inline) {
    res.setHeader('Content-Type', registro.tipo_mime || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(registro.nombre_original)}"`
    );
    return res.sendFile(path.resolve(filePath));
  }

  await AuditLog.create({
    usuario_id: req.user.id,
    accion: 'descargar',
    entidad: 'assurance_record',
    entidad_id: registro.id,
    ip_address: req.ip,
  });

  return res.download(filePath, registro.nombre_original);
}

exports.downloadRecord = async (req, res) => {
  try {
    return await enviarArchivo(req, res, { inline: false });
  } catch (error) {
    logger.error(`[ASSURANCE] Error descargando registro: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_RECORD_ERROR', message: 'Error descargando el registro' },
    });
  }
};

exports.previewRecord = async (req, res) => {
  try {
    return await enviarArchivo(req, res, { inline: true });
  } catch (error) {
    logger.error(`[ASSURANCE] Error visualizando registro: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'PREVIEW_RECORD_ERROR', message: 'Error abriendo el registro' },
    });
  }
};
