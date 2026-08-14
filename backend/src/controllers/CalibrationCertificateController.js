const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  CalibrationCertificate,
  CertificateSignature,
  WorkOrderItem,
  WorkOrder,
  Client,
  ClientInstrument,
  ClientContact,
  Equipment,
  AccreditationScope,
  User,
  AuditLog,
  sequelize,
} = require('../models');
const { uploadDirectory } = require('../middleware/uploadCalibrationCertificate');
const { sendCertificateEmail } = require('../services/emailService');
const { buildCertificatePdf } = require('../utils/certificatePdf');
const CertificateIssuanceService = require('../services/CertificateIssuanceService');
const logger = require('../config/logger');

function sha256DeArchivo(rutaAbsoluta) {
  return crypto.createHash('sha256').update(fs.readFileSync(rutaAbsoluta)).digest('hex');
}

// Punto del flujo del certificado que dispara el paso automático de la OT a
// "lista_para_facturar" (tarea 1.4). El plan lo deja como configurable
// (emitido vs. firmado); por ahora es esta única constante — cambiarla no
// requiere tocar nada más.
const ESTADO_CERTIFICADO_QUE_DISPARA_FACTURACION = 'emitido';
const ESTADOS_OT_NO_REGRESABLES = ['lista_para_facturar', 'entregada', 'cancelada'];

// Si el certificado recién actualizado deja a TODOS los ítems de su OT con
// certificado emitido (o más allá: enviado), la OT pasa sola a
// "lista_para_facturar". No se toca si la OT ya avanzó más allá de ese punto.
async function intentarMarcarListaParaFacturar(certificado, usuarioId, ip) {
  const item = await WorkOrderItem.findByPk(certificado.orden_trabajo_item_id);
  if (!item) return;

  const ordenTrabajo = await WorkOrder.findByPk(item.orden_trabajo_id, {
    include: [{ model: WorkOrderItem, as: 'items', include: [{ model: CalibrationCertificate, as: 'certificado' }] }],
  });
  if (!ordenTrabajo || ESTADOS_OT_NO_REGRESABLES.includes(ordenTrabajo.estado)) return;

  const todosListos = ordenTrabajo.items.every((it) => {
    const est = it.certificado?.estado;
    return est === ESTADO_CERTIFICADO_QUE_DISPARA_FACTURACION || est === 'enviado';
  });
  if (!todosListos) return;

  const estadoAnterior = ordenTrabajo.estado;
  ordenTrabajo.estado = 'lista_para_facturar';
  await ordenTrabajo.save();

  await AuditLog.create({
    usuario_id: usuarioId,
    accion: 'actualizar',
    entidad: 'work_order',
    entidad_id: ordenTrabajo.id,
    cambios_anteriores: { estado: estadoAnterior },
    cambios_nuevos: { estado: 'lista_para_facturar' },
    detalles: 'Transición automática: todos los certificados de la OT fueron emitidos',
    ip_address: ip,
  });

  logger.info(`[WORK_ORDERS] Orden ${ordenTrabajo.codigo} pasó automáticamente a lista_para_facturar`);
}

const CERTIFICATE_INCLUDES = [
  {
    model: WorkOrderItem,
    as: 'item',
    include: [
      { model: ClientInstrument, as: 'instrumento' },
      {
        model: WorkOrder,
        as: 'ordenTrabajo',
        include: [{ model: Client, as: 'cliente' }],
      },
    ],
  },
];

// Repositorio de certificados: a diferencia del resto del módulo, donde se
// llega al certificado navegando OT -> ítem, acá se listan TODOS los
// certificados con su cliente y su OT asociada, filtrables por texto libre
// (código de certificado, código de OT, cliente o instrumento). Incluye los
// 'superseded' para no perder la trazabilidad de las enmiendas (7.8.8): se
// filtran por estado si se quiere ver sólo los vigentes.
exports.getCertificates = async (req, res) => {
  try {
    const { search, cliente_id, estado, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (estado) where.estado = estado;
    if (cliente_id) where['$item.ordenTrabajo.cliente_id$'] = cliente_id;
    if (search) {
      const patron = `%${search}%`;
      where[Op.or] = [
        { codigo: { [Op.iLike]: patron } },
        { '$item.ordenTrabajo.codigo$': { [Op.iLike]: patron } },
        { '$item.ordenTrabajo.cliente.nombre$': { [Op.iLike]: patron } },
        { '$item.ordenTrabajo.cliente.identificacion_fiscal$': { [Op.iLike]: patron } },
        { '$item.instrumento.codigo_interno$': { [Op.iLike]: patron } },
        { '$item.instrumento.numero_serie$': { [Op.iLike]: patron } },
      ];
    }

    // subQuery: false es necesario para que los filtros sobre columnas de los
    // includes ($item.ordenTrabajo...$) queden en el mismo SELECT que el LIMIT.
    const { rows, count } = await CalibrationCertificate.findAndCountAll({
      where,
      include: [
        ...CERTIFICATE_INCLUDES,
        { model: CalibrationCertificate, as: 'certificadoOriginal', attributes: ['id', 'codigo'] },
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']],
      subQuery: false,
      distinct: true,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error obteniendo el repositorio de certificados: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_CERTIFICATES_ERROR', message: 'Error obteniendo los certificados' },
    });
  }
};

// Subir el PDF firmado del certificado para un ítem de orden de trabajo (borrador)
exports.uploadCertificate = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Debe adjuntar el certificado en PDF' },
      });
    }

    const item = await WorkOrderItem.findByPk(itemId, {
      include: [{ model: CalibrationCertificate, as: 'certificado' }],
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_ITEM_NOT_FOUND', message: 'El ítem de la orden de trabajo no existe' },
      });
    }
    if (item.certificado) {
      return res.status(409).json({
        success: false,
        error: { code: 'CERTIFICATE_EXISTS', message: 'Este ítem ya tiene un certificado registrado' },
      });
    }

    const certificado = await sequelize.transaction(async (t) => {
      const codigo = await CalibrationCertificate.generarCodigo({ transaction: t });

      return CalibrationCertificate.create({
        codigo,
        orden_trabajo_item_id: item.id,
        estado: 'borrador',
        acreditado: item.acreditado,
        nombre_original: req.file.originalname,
        nombre_almacenado: req.file.filename,
        tipo_mime: req.file.mimetype,
        tamano_bytes: req.file.size,
        creado_por: req.user.id,
      }, { transaction: t });
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      cambios_nuevos: { codigo: certificado.codigo, item_id: item.id },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_CERTIFICATES] Certificado ${certificado.codigo} subido por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Certificado ${certificado.codigo} registrado en borrador`,
      data: certificado,
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error subiendo certificado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_CERTIFICATE_ERROR', message: 'Error subiendo el certificado' },
    });
    return;
  }
};

// Genera el PDF del certificado internamente con pdfkit (tarea 2.6), en vez
// de exigir que alguien suba un PDF ya hecho (uploadCertificate sigue
// disponible aparte, por si se necesita un certificado emitido externamente).
exports.generateCertificate = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { decision_rule, fecha_calibracion } = req.body;

    const item = await WorkOrderItem.findByPk(itemId, {
      include: [
        { model: ClientInstrument, as: 'instrumento' },
        {
          model: WorkOrder,
          as: 'ordenTrabajo',
          include: [{ model: Client, as: 'cliente' }],
        },
        { model: CalibrationCertificate, as: 'certificado' },
        { model: Equipment, as: 'patrones', through: { attributes: [] } },
      ],
    });
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'WORK_ORDER_ITEM_NOT_FOUND', message: 'El ítem de la orden de trabajo no existe' },
      });
    }
    if (item.certificado) {
      return res.status(409).json({
        success: false,
        error: { code: 'CERTIFICATE_EXISTS', message: 'Este ítem ya tiene un certificado registrado' },
      });
    }
    if (item.incertidumbre_U === null || item.factor_k === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_UNCERTAINTY',
          message: 'No se puede generar el certificado sin incertidumbre (U) y factor de cobertura (k) capturados en el ítem',
        },
      });
    }

    let codigoAcreditacion = null;
    if (item.acreditado) {
      const scope = await AccreditationScope.findOne({ where: { activo: true } });
      codigoAcreditacion = scope?.codigo_acreditacion || null;
    }

    const certificado = await sequelize.transaction(async (t) => {
      const codigo = await CalibrationCertificate.generarCodigo({ transaction: t });
      return CalibrationCertificate.create({
        codigo,
        orden_trabajo_item_id: item.id,
        estado: 'borrador',
        acreditado: item.acreditado,
        decision_rule: decision_rule || null,
        fecha_calibracion: fecha_calibracion || null,
        creado_por: req.user.id,
      }, { transaction: t });
    });

    const nombreAlmacenado = `${crypto.randomUUID()}.pdf`;
    const filePath = path.join(uploadDirectory, nombreAlmacenado);
    await buildCertificatePdf({ ...certificado.toJSON(), item: item.toJSON() }, filePath, { codigoAcreditacion });

    const sha256 = sha256DeArchivo(filePath);
    certificado.nombre_original = `${certificado.codigo}.pdf`;
    certificado.nombre_almacenado = nombreAlmacenado;
    certificado.tipo_mime = 'application/pdf';
    certificado.tamano_bytes = fs.statSync(filePath).size;
    certificado.sha256_pdf = sha256;
    await certificado.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      cambios_nuevos: { codigo: certificado.codigo, item_id: item.id, sha256_pdf: sha256, generado_internamente: true },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_CERTIFICATES] Certificado ${certificado.codigo} generado internamente por ${req.user.email} (sha256=${sha256})`);

    res.status(201).json({
      success: true,
      message: `Certificado ${certificado.codigo} generado en borrador`,
      data: certificado,
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error generando certificado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GENERATE_CERTIFICATE_ERROR', message: 'Error generando el certificado' },
    });
  }
};

// Roles que pueden firmar un certificado NO acreditado, cuando quien firma
// no es el técnico responsable de la propia OT (D5 / tarea 2.8).
const ROLES_FIRMA_SUPERVISOR = ['administrador', 'jefe_laboratorio', 'supervisor'];

// Firma electrónica simple (D5): transición borrador -> firmado, con quién
// firmó auditado, el PDF re-estampado con el nombre/rol/fecha, y un nuevo
// hash sobre ese PDF ya firmado. Es el ÚNICO camino para llegar a "firmado"
// (updateCertificateEstado ya no acepta ese estado directo, ver abajo).
exports.signCertificate = async (req, res) => {
  try {
    const certificado = await CalibrationCertificate.findByPk(req.params.id, {
      include: [
        {
          model: WorkOrderItem,
          as: 'item',
          include: [
            { model: ClientInstrument, as: 'instrumento' },
            { model: WorkOrder, as: 'ordenTrabajo', include: [{ model: Client, as: 'cliente' }] },
            { model: Equipment, as: 'patrones', through: { attributes: [] } },
          ],
        },
        { model: CalibrationCertificate, as: 'certificadoOriginal' },
      ],
    });
    if (!certificado) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'El certificado no existe' },
      });
    }
    if (certificado.estado !== 'borrador') {
      return res.status(409).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Solo se puede firmar un certificado en estado borrador' },
      });
    }

    let rolFirma;
    if (certificado.acreditado) {
      if (req.user.role !== 'signatario_inn') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'SIGNATORY_ROLE_REQUIRED',
            message: 'Solo un usuario con rol signatario_inn puede firmar un certificado acreditado',
          },
        });
      }
      rolFirma = 'signatario_inn';
    } else {
      const esResponsable = certificado.item.ordenTrabajo?.responsable_id === req.user.id;
      const esSupervisorOMas = ROLES_FIRMA_SUPERVISOR.includes(req.user.role);
      if (!esResponsable && !esSupervisorOMas) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'SIGNER_NOT_ALLOWED',
            message: 'Solo el técnico responsable de la OT o un supervisor/jefatura/administración pueden firmar este certificado',
          },
        });
      }
      rolFirma = esResponsable ? 'tecnico' : 'supervisor';
    }

    const firmante = await User.findByPk(req.user.id);
    const fechaFirma = new Date();
    const fechaFirmaTexto = fechaFirma.toLocaleDateString('es-CL');

    let codigoAcreditacion = null;
    if (certificado.acreditado) {
      const scope = await AccreditationScope.findOne({ where: { activo: true } });
      codigoAcreditacion = scope?.codigo_acreditacion || null;
    }

    const firmas = rolFirma === 'signatario_inn'
      ? { signatarioInn: { nombre: firmante.nombre, fecha: fechaFirmaTexto } }
      : { tecnicoOSupervisor: { nombre: firmante.nombre, rol: rolFirma, fecha: fechaFirmaTexto } };

    // Si este certificado es una enmienda (tarea 2.9), el aviso "ENMIENDA AL
    // CERTIFICADO N°..." debe sobrevivir al re-estampado del PDF al firmar
    // (buildCertificatePdf redibuja todo desde cero en cada llamada).
    const enmiendaInfo = certificado.supersede_a_id
      ? { codigoOriginal: certificado.certificadoOriginal?.codigo, motivo: certificado.motivo_enmienda }
      : null;

    const filePath = path.join(uploadDirectory, certificado.nombre_almacenado);
    await buildCertificatePdf({ ...certificado.toJSON(), item: certificado.item.toJSON() }, filePath, { codigoAcreditacion, firmas, enmienda: enmiendaInfo });
    const sha256Firmado = sha256DeArchivo(filePath);

    const firma = await sequelize.transaction(async (t) => {
      const nuevaFirma = await CertificateSignature.create({
        certificate_id: certificado.id,
        user_id: req.user.id,
        rol_firma: rolFirma,
        tipo_firma: 'simple',
        fecha: fechaFirma,
        sha256_pdf_firmado: sha256Firmado,
      }, { transaction: t });

      certificado.estado = 'firmado';
      certificado.sha256_pdf = sha256Firmado;
      certificado.tamano_bytes = fs.statSync(filePath).size;
      await certificado.save({ transaction: t });

      return nuevaFirma;
    });

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'aprobar',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      cambios_nuevos: { estado: 'firmado', rol_firma: rolFirma, sha256_pdf_firmado: sha256Firmado },
      detalles: `Certificado ${certificado.codigo} firmado por ${req.user.email} (rol_firma: ${rolFirma})`,
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_CERTIFICATES] Certificado ${certificado.codigo} firmado por ${req.user.email} (rol_firma=${rolFirma})`);

    res.status(201).json({
      success: true,
      message: 'Certificado firmado correctamente',
      data: { certificado, firma },
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error firmando certificado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'SIGN_CERTIFICATE_ERROR', message: 'Error firmando el certificado' },
    });
  }
};

// Transición de estado: (borrador ya cubierto por generar/subir) -> emitido.
// El paso a "firmado" ya NO se acepta acá: debe pasar por signCertificate,
// que es el único lugar que produce una fila en certificate_signatures.
exports.updateCertificateEstado = async (req, res) => {
  try {
    const { estado, fecha_emision, fecha_calibracion } = req.body;
    const ESTADOS_PERMITIDOS = ['borrador', 'emitido'];

    if (!estado || !ESTADOS_PERMITIDOS.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `El estado debe ser uno de: ${ESTADOS_PERMITIDOS.join(', ')}`,
        },
      });
    }

    const certificado = await CalibrationCertificate.findByPk(req.params.id);
    if (!certificado) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'El certificado no existe' },
      });
    }

    // Inmutabilidad (tarea 2.9 / D4): un certificado emitido, enviado o
    // superseded no se edita por ningún campo de este endpoint (ni estado ni
    // fechas) — ni siquiera para "volver" a borrador. La única vía de
    // corrección es amendCertificate, que crea un certificado nuevo.
    const ESTADOS_INMUTABLES = ['emitido', 'enviado', 'superseded'];
    if (ESTADOS_INMUTABLES.includes(certificado.estado)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CERTIFICATE_IMMUTABLE',
          message: `El certificado está en estado '${certificado.estado}' y ya no puede editarse. Use el flujo de enmienda para corregirlo.`,
        },
      });
    }

    // Las fechas se guardan primero (si vienen en la misma llamada), para
    // que el motor de reglas de más abajo evalúe fecha_calibracion ya
    // actualizada, no la que tenía el certificado antes de esta petición.
    if (fecha_emision !== undefined) certificado.fecha_emision = fecha_emision;
    if (fecha_calibracion !== undefined) certificado.fecha_calibracion = fecha_calibracion;
    if (fecha_emision !== undefined || fecha_calibracion !== undefined) {
      await certificado.save();
    }

    // Estados respetados (tarea 2.8): no se puede emitir sin haber pasado
    // por firmado (es decir, sin una firma real registrada en signCertificate).
    if (estado === 'emitido' && certificado.estado !== 'firmado') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'NOT_SIGNED',
          message: 'El certificado debe estar firmado antes de poder emitirse',
        },
      });
    }

    // Motor de reglas de emisión (tarea 2.7): único punto de bloqueo, no hay
    // otra forma de pasar a "emitido" saltándoselo — este es el único lugar
    // del código que hace esa transición.
    if (estado === 'emitido') {
      const { permitida, checks } = await CertificateIssuanceService.verificarEmision(certificado.id);
      if (!permitida) {
        const motivos = checks.filter((c) => !c.paso).map((c) => c.motivo);
        await AuditLog.create({
          usuario_id: req.user.id,
          accion: 'rechazar',
          entidad: 'calibration_certificate',
          entidad_id: certificado.id,
          detalles: `Emisión bloqueada: ${motivos.join(' | ')}`,
          ip_address: req.ip,
        });
        logger.warn(`[CALIBRATION_CERTIFICATES] Emisión de ${certificado.codigo} bloqueada: ${motivos.join(' | ')}`);
        return res.status(400).json({
          success: false,
          error: {
            code: 'ISSUANCE_BLOCKED',
            message: 'La emisión fue bloqueada por el motor de reglas',
            checks,
          },
        });
      }
    }

    const estadoAnterior = certificado.estado;
    certificado.estado = estado;
    await certificado.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      cambios_anteriores: { estado: estadoAnterior },
      cambios_nuevos: { estado },
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_CERTIFICATES] Certificado ${certificado.codigo} pasó de ${estadoAnterior} a ${estado} por ${req.user.email}`);

    if (estado === ESTADO_CERTIFICADO_QUE_DISPARA_FACTURACION) {
      await intentarMarcarListaParaFacturar(certificado, req.user.id, req.ip);
    }

    res.json({
      success: true,
      message: 'Estado del certificado actualizado correctamente',
      data: certificado,
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error actualizando estado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_CERTIFICATE_ESTADO_ERROR', message: 'Error actualizando el estado del certificado' },
    });
  }
};

// Enmienda (tarea 2.9 / D4 / ISO 17025 7.8.8): único camino para "corregir"
// un certificado ya emitido/enviado. No lo edita — crea un certificado
// nuevo con los datos ACTUALES del ítem (ya corregidos por el usuario antes
// de llamar este endpoint), que referencia al original vía supersede_a_id;
// el original pasa a 'superseded' y queda protegido por el mismo guardia de
// inmutabilidad de updateCertificateEstado. La enmienda nace en 'borrador'
// y debe recorrer el mismo camino que cualquier certificado nuevo
// (firmar -> motor de reglas 2.7 -> emitido) antes de poder enviarse.
exports.amendCertificate = async (req, res) => {
  try {
    const { motivo_enmienda, decision_rule, fecha_calibracion } = req.body;
    if (!motivo_enmienda || !motivo_enmienda.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'motivo_enmienda es obligatorio para enmendar un certificado' },
      });
    }

    const original = await CalibrationCertificate.findByPk(req.params.id, {
      include: [
        {
          model: WorkOrderItem,
          as: 'item',
          include: [
            { model: ClientInstrument, as: 'instrumento' },
            { model: WorkOrder, as: 'ordenTrabajo', include: [{ model: Client, as: 'cliente' }] },
            { model: Equipment, as: 'patrones', through: { attributes: [] } },
          ],
        },
      ],
    });
    if (!original) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'El certificado no existe' },
      });
    }
    if (!['emitido', 'enviado'].includes(original.estado)) {
      return res.status(409).json({
        success: false,
        error: { code: 'INVALID_STATE', message: 'Solo un certificado emitido o enviado puede enmendarse' },
      });
    }

    const item = original.item;
    if (item.incertidumbre_U === null || item.factor_k === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_UNCERTAINTY',
          message: 'No se puede generar la enmienda sin incertidumbre (U) y factor de cobertura (k) capturados en el ítem',
        },
      });
    }

    let codigoAcreditacion = null;
    if (original.acreditado) {
      const scope = await AccreditationScope.findOne({ where: { activo: true } });
      codigoAcreditacion = scope?.codigo_acreditacion || null;
    }

    const estadoAnteriorOriginal = original.estado;

    const enmienda = await sequelize.transaction(async (t) => {
      // El índice único parcial (calibration_certificates_un_activo_por_item,
      // tarea 2.9) exige como máximo UN certificado no-superseded por ítem en
      // todo momento dentro de la transacción — no es diferible. Por eso el
      // original se marca 'superseded' PRIMERO; si se creara la fila nueva
      // antes, ambas filas serían no-superseded a la vez y el INSERT violaría
      // la restricción de unicidad.
      original.estado = 'superseded';
      await original.save({ transaction: t });

      const codigo = await CalibrationCertificate.generarCodigo({ transaction: t });
      return CalibrationCertificate.create({
        codigo,
        orden_trabajo_item_id: item.id,
        estado: 'borrador',
        // Hereda "acreditado" del ORIGINAL, no del ítem actual: una enmienda
        // corrige datos de la calibración, no reclasifica si el servicio fue
        // o no acreditado en su momento.
        acreditado: original.acreditado,
        decision_rule: decision_rule || original.decision_rule,
        fecha_calibracion: fecha_calibracion || original.fecha_calibracion,
        supersede_a_id: original.id,
        motivo_enmienda: motivo_enmienda.trim(),
        creado_por: req.user.id,
      }, { transaction: t });
    });

    const nombreAlmacenado = `${crypto.randomUUID()}.pdf`;
    const filePath = path.join(uploadDirectory, nombreAlmacenado);
    await buildCertificatePdf(
      { ...enmienda.toJSON(), item: item.toJSON() },
      filePath,
      { codigoAcreditacion, enmienda: { codigoOriginal: original.codigo, motivo: enmienda.motivo_enmienda } }
    );

    const sha256 = sha256DeArchivo(filePath);
    enmienda.nombre_original = `${enmienda.codigo}.pdf`;
    enmienda.nombre_almacenado = nombreAlmacenado;
    enmienda.tipo_mime = 'application/pdf';
    enmienda.tamano_bytes = fs.statSync(filePath).size;
    enmienda.sha256_pdf = sha256;
    await enmienda.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'crear',
      entidad: 'calibration_certificate',
      entidad_id: enmienda.id,
      cambios_nuevos: { codigo: enmienda.codigo, supersede_a_id: original.id, motivo_enmienda: enmienda.motivo_enmienda },
      detalles: `Enmienda del certificado ${original.codigo}`,
      ip_address: req.ip,
    });
    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'actualizar',
      entidad: 'calibration_certificate',
      entidad_id: original.id,
      cambios_anteriores: { estado: estadoAnteriorOriginal },
      cambios_nuevos: { estado: 'superseded' },
      detalles: `Superado por la enmienda ${enmienda.codigo}`,
      ip_address: req.ip,
    });

    logger.info(`[CALIBRATION_CERTIFICATES] Certificado ${original.codigo} enmendado por ${enmienda.codigo} (${req.user.email})`);

    res.status(201).json({
      success: true,
      message: `Enmienda ${enmienda.codigo} creada en borrador; el certificado ${original.codigo} queda superseded`,
      data: { original, enmienda },
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error enmendando certificado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'AMEND_CERTIFICATE_ERROR', message: 'Error enmendando el certificado' },
    });
  }
};

// Checklist de emisión sin intentar emitir (D6: la UI lo muestra antes de
// que el usuario intente el cambio de estado real).
exports.getIssuanceCheck = async (req, res) => {
  try {
    const certificado = await CalibrationCertificate.findByPk(req.params.id);
    if (!certificado) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'El certificado no existe' },
      });
    }

    const resultado = await CertificateIssuanceService.verificarEmision(certificado.id);
    res.json({ success: true, data: resultado });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error obteniendo checklist de emisión: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_ISSUANCE_CHECK_ERROR', message: 'Error obteniendo el checklist de emisión' },
    });
  }
};

// Descargar el PDF del certificado. La descarga exige autenticación.
exports.downloadCertificate = async (req, res) => {
  try {
    const certificado = await CalibrationCertificate.findByPk(req.params.id);
    if (!certificado || !certificado.nombre_almacenado) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'El certificado no existe' },
      });
    }

    const filePath = path.join(uploadDirectory, certificado.nombre_almacenado);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'El archivo no está disponible en el servidor' },
      });
    }

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'descargar',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      ip_address: req.ip,
    });

    return res.download(filePath, certificado.nombre_original);
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error descargando certificado: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_CERTIFICATE_ERROR', message: 'Error descargando el certificado' },
    });
  }
};

// Enviar el certificado emitido al correo de contacto del cliente
exports.sendCertificate = async (req, res) => {
  try {
    const certificado = await CalibrationCertificate.findByPk(req.params.id, {
      include: CERTIFICATE_INCLUDES,
    });
    if (!certificado) {
      return res.status(404).json({
        success: false,
        error: { code: 'CERTIFICATE_NOT_FOUND', message: 'El certificado no existe' },
      });
    }

    if (certificado.estado !== 'emitido') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CERTIFICATE_NOT_EMITTED',
          message: 'El certificado debe estar en estado "emitido" antes de enviarlo',
        },
      });
    }

    const cliente = certificado.item?.ordenTrabajo?.cliente;

    // Se puede elegir un contacto guardado del cliente (contacto_id), escribir
    // un correo puntual (email_destino), o si no se manda nada se usa el
    // correo de contacto principal del cliente.
    let destinatario = req.body.email_destino;
    if (!destinatario && req.body.contacto_id) {
      const contacto = await ClientContact.findOne({ where: { id: req.body.contacto_id, cliente_id: cliente?.id } });
      if (!contacto || !contacto.email) {
        return res.status(400).json({
          success: false,
          error: { code: 'CONTACT_WITHOUT_EMAIL', message: 'El contacto seleccionado no tiene un correo registrado' },
        });
      }
      destinatario = contacto.email;
    }
    destinatario = destinatario || cliente?.email_contacto;

    if (!destinatario) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_CONTACT_EMAIL', message: 'El cliente no tiene un correo de contacto configurado' },
      });
    }

    const filePath = path.join(uploadDirectory, certificado.nombre_almacenado);
    const resultado = await sendCertificateEmail({
      to: destinatario,
      cliente,
      certificado,
      filePath,
    });

    certificado.enviado_a = destinatario;
    certificado.fecha_envio = new Date();
    certificado.estado_envio = resultado.success ? 'enviado' : 'fallido';
    if (resultado.success) certificado.estado = 'enviado';
    await certificado.save();

    await AuditLog.create({
      usuario_id: req.user.id,
      accion: 'enviar',
      entidad: 'calibration_certificate',
      entidad_id: certificado.id,
      cambios_nuevos: { enviado_a: destinatario, estado_envio: certificado.estado_envio },
      ip_address: req.ip,
    });

    if (!resultado.success) {
      logger.error(`[CALIBRATION_CERTIFICATES] Falló el envío de ${certificado.codigo}: ${resultado.error}`);
      return res.status(502).json({
        success: false,
        error: { code: 'SEND_CERTIFICATE_FAILED', message: `No se pudo enviar el certificado: ${resultado.error}` },
      });
    }

    logger.info(`[CALIBRATION_CERTIFICATES] Certificado ${certificado.codigo} enviado a ${destinatario} por ${req.user.email}`);

    res.json({
      success: true,
      message: `Certificado enviado a ${destinatario}`,
      data: certificado,
    });
  } catch (error) {
    logger.error(`[CALIBRATION_CERTIFICATES] Error enviando certificado: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'SEND_CERTIFICATE_ERROR', message: 'Error enviando el certificado' },
    });
  }
};
