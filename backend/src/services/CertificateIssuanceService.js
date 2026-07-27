const { Op } = require('sequelize');
const {
  CalibrationCertificate,
  WorkOrderItem,
  WorkOrder,
  Equipment,
  CalibrationDataFile,
  CalibrationFormEntry,
  AccreditationScope,
  Role,
  User,
} = require('../models');
const PersonnelAuthorizationService = require('./PersonnelAuthorizationService');

// Motor de reglas de emisión (tarea 2.7, D6): un solo servicio, una sola
// suite de tests, ninguna lógica repartida en controladores. Devuelve una
// lista de verificaciones (pasó/falló/motivo); el llamador decide qué hacer
// con eso (bloquear la emisión, mostrar un checklist en la UI, etc.).
//
// Dos reglas son aproximaciones honestas por brechas de datos que aún no
// existen en el sistema (documentadas también en PLAN_DESARROLLO.md):
// - "patrón vigente a la fecha de calibración" usa Equipment.proxima_calibracion
//   (el valor ACTUAL), porque standard_calibration_history (Etapa 3.3) —el
//   historial real de cuándo cada patrón estuvo vigente— todavía no existe.
// - "alcance INN cubre la magnitud" empareja por texto entre la magnitud del
//   patrón y area/subarea/item de AccreditationScope, porque esa tabla no
//   tiene un campo "magnitud" formal — son taxonomías que hoy no calzan 1:1.
function coincideTexto(a, b) {
  if (!a || !b) return false;
  const x = String(a).toLowerCase();
  const y = String(b).toLowerCase();
  return x.includes(y) || y.includes(x);
}

async function verificarPatronVigente(item, fechaCalibracion) {
  const patrones = item.patrones || [];
  if (patrones.length === 0) {
    return { regla: 'patron_vigente', paso: false, motivo: 'No hay patrones registrados para esta calibración (ver tarea 2.6)' };
  }
  if (!fechaCalibracion) {
    return { regla: 'patron_vigente', paso: false, motivo: 'El certificado no tiene fecha_calibracion registrada' };
  }
  const vencidos = patrones.filter((p) => p.proxima_calibracion && p.proxima_calibracion < fechaCalibracion);
  if (vencidos.length > 0) {
    return {
      regla: 'patron_vigente',
      paso: false,
      motivo: `Patrón(es) vencido(s) a la fecha de calibración: ${vencidos.map((p) => p.codigo).join(', ')}`,
    };
  }
  return { regla: 'patron_vigente', paso: true, motivo: `Todos los patrones vigentes (${patrones.map((p) => p.codigo).join(', ')})` };
}

async function verificarTecnicoAutorizado(item, fechaCalibracion) {
  const responsableId = item.ordenTrabajo?.responsable_id;
  if (!responsableId) {
    return { regla: 'tecnico_autorizado', paso: false, motivo: 'La OT no tiene un técnico responsable asignado' };
  }
  const magnitudes = [...new Set((item.patrones || []).map((p) => p.magnitud).filter(Boolean))];
  if (magnitudes.length === 0) {
    return { regla: 'tecnico_autorizado', paso: false, motivo: 'No hay magnitud que verificar (sin patrones con magnitud registrada)' };
  }

  const resultados = await Promise.all(
    magnitudes.map((m) => PersonnelAuthorizationService.estaAutorizado(responsableId, m, fechaCalibracion))
  );
  const noAutorizadas = magnitudes.filter((_, idx) => !resultados[idx].autorizado);
  if (noAutorizadas.length > 0) {
    return {
      regla: 'tecnico_autorizado',
      paso: false,
      motivo: `El técnico responsable no está autorizado para: ${noAutorizadas.join(', ')}`,
    };
  }
  return { regla: 'tecnico_autorizado', paso: true, motivo: `Técnico autorizado para: ${magnitudes.join(', ')}` };
}

function verificarUyK(item) {
  const tiene = item.incertidumbre_U !== null && item.incertidumbre_U !== undefined
    && item.factor_k !== null && item.factor_k !== undefined;
  return {
    regla: 'incertidumbre_presente',
    paso: tiene,
    motivo: tiene ? 'U y k presentes' : 'Falta incertidumbre (U) y/o factor de cobertura (k) en el ítem',
  };
}

// "Excel adjunto o formulario" (documentado como pendiente en la tarea 2.7
// hasta que existiera calibration_form_entries): cuenta como raw data
// cualquiera de las dos fuentes. Solo una captura de formulario CONFIRMADA
// cuenta — una en borrador todavía puede estar incompleta o fuera de rango,
// mismo criterio que el guardia de fuente_datos='digitacion' en
// WorkOrderController.updateWorkOrderItem.
async function verificarRawData(item) {
  const [archivosExcel, entradasFormulario] = await Promise.all([
    CalibrationDataFile.count({ where: { work_order_item_id: item.id } }),
    CalibrationFormEntry.count({ where: { work_order_item_id: item.id, estado: 'confirmado' } }),
  ]);
  const cantidad = archivosExcel + entradasFormulario;
  return {
    regla: 'raw_data_adjunto',
    paso: cantidad > 0,
    motivo: cantidad > 0
      ? `${archivosExcel} archivo(s) de raw data adjunto(s), ${entradasFormulario} captura(s) de formulario confirmada(s)`
      : 'No hay ningún raw data (Excel) ni captura de formulario confirmada en este ítem',
  };
}

async function verificarAlcanceINN(item, fechaCalibracion) {
  const magnitudes = [...new Set((item.patrones || []).map((p) => p.magnitud).filter(Boolean))];
  if (magnitudes.length === 0) {
    return { regla: 'alcance_inn', paso: false, motivo: 'No hay magnitud que verificar contra el alcance INN (sin patrones con magnitud)' };
  }

  const vigentesHoy = await AccreditationScope.findAll({
    where: {
      activo: true,
      [Op.and]: [
        { [Op.or]: [{ vigencia_desde: null }, { vigencia_desde: { [Op.lte]: fechaCalibracion || new Date() } }] },
        { [Op.or]: [{ vigencia_hasta: null }, { vigencia_hasta: { [Op.gte]: fechaCalibracion || new Date() } }] },
      ],
    },
  });

  const cubiertas = magnitudes.filter((m) =>
    vigentesHoy.some((scope) => coincideTexto(scope.area, m) || coincideTexto(scope.subarea, m) || coincideTexto(scope.item, m))
  );
  const noCubiertas = magnitudes.filter((m) => !cubiertas.includes(m));

  if (noCubiertas.length > 0) {
    return {
      regla: 'alcance_inn',
      paso: false,
      motivo: `El alcance de acreditación INN vigente no cubre: ${noCubiertas.join(', ')}`,
    };
  }
  return { regla: 'alcance_inn', paso: true, motivo: `Alcance INN cubre: ${magnitudes.join(', ')}` };
}

async function verificarSignatarioDisponible() {
  const rol = await Role.findOne({ where: { nombre: 'signatario_inn' } });
  const hay = rol ? await User.count({ where: { role_id: rol.id, estado: 'activo' } }) : 0;
  return {
    regla: 'signatario_disponible',
    paso: hay > 0,
    motivo: hay > 0 ? `${hay} usuario(s) con rol signatario_inn activo(s)` : 'No hay ningún usuario activo con rol signatario_inn',
  };
}

async function verificarEmision(certificadoId) {
  const certificado = await CalibrationCertificate.findByPk(certificadoId, {
    include: [
      {
        model: WorkOrderItem,
        as: 'item',
        include: [
          { model: WorkOrder, as: 'ordenTrabajo' },
          { model: Equipment, as: 'patrones', through: { attributes: [] } },
        ],
      },
    ],
  });
  if (!certificado) {
    throw new Error('Certificado no encontrado');
  }

  const item = certificado.item;
  const fecha = certificado.fecha_calibracion;

  const checks = [
    await verificarPatronVigente(item, fecha),
    await verificarTecnicoAutorizado(item, fecha),
    verificarUyK(item),
    await verificarRawData(item),
  ];

  if (certificado.acreditado) {
    checks.push(await verificarAlcanceINN(item, fecha));
    checks.push(await verificarSignatarioDisponible());
  }

  return { permitida: checks.every((c) => c.paso), checks };
}

module.exports = { verificarEmision };
