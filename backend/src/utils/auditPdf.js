const PDFDocument = require('pdfkit');
const { drawHeader } = require('./pdfBranding');

const ESTADOS = {
  planificada: 'PLANIFICADA',
  en_curso: 'EN CURSO',
  completada: 'COMPLETADA',
  cancelada: 'CANCELADA',
};

const EVALUACIONES = { C: 'C', NC: 'NC', OM: 'OM', 'N/A': 'N/A' };
const EVALUACIONES_ORDEN = ['C', 'NC', 'OM', 'N/A'];
const EVALUACION_COLORES = { C: '#1a7a4c', NC: '#c0392b', OM: '#b7791f', 'N/A': '#888' };

const HALLAZGO_TIPOS = {
  no_conformidad: 'No conformidad',
  observacion: 'Observación',
  oportunidad_mejora: 'Oportunidad de mejora',
};

// Filas del resumen inicial, en el orden en que se leen en el informe.
const RESUMEN_TIPOS = [
  { tipo: 'no_conformidad', etiqueta: 'No conformidades', color: '#c0392b' },
  { tipo: 'oportunidad_mejora', etiqueta: 'Oportunidades de mejora', color: '#b7791f' },
  { tipo: 'observacion', etiqueta: 'Observaciones', color: '#2471a3' },
];

const NORMA_LABELS = {
  ISO17025: 'NCh ISO/IEC 17025:2017',
  ISO17020: 'NCh-ISO 17020:2012',
};

const FUENTE_LABELS = {
  DA_D22: 'DA-D22',
  DA_D23: 'DA-D23',
};

function ensureSpace(doc, y, needed) {
  if (y + needed > 760) {
    doc.addPage();
    return 50;
  }
  return y;
}

// Las fuentes estándar de pdfkit (Helvetica) no tienen glifo para tabulaciones;
// dejarlas en el texto corrompe el resto de la línea al renderizar.
function limpiarTexto(texto) {
  return String(texto || '').replace(/\t/g, ' ');
}

// Arma el PDF del informe final de la auditoría interna y lo escribe
// directamente en la respuesta HTTP (se regenera al vuelo, igual que
// quotePdf.js, para reflejar siempre el estado más reciente del checklist).
function buildAuditPdf(auditoria, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${auditoria.codigo}.pdf"`);
  doc.pipe(res);

  const normaLabel = NORMA_LABELS[auditoria.norma] || auditoria.norma || 'ISO/IEC 17025';
  drawHeader(doc, `Informe de Auditoría Interna — ${normaLabel}`);

  doc.fontSize(16).fillColor('#000').text(`Auditoría ${auditoria.codigo}`, 50, 115);
  doc.fontSize(9).fillColor('#666');
  doc.text(`Estado: ${ESTADOS[auditoria.estado] || auditoria.estado}`, 50, 137);
  if (auditoria.fecha_planificada) doc.text(`Fecha planificada: ${auditoria.fecha_planificada}`, 50, doc.y + 2);
  if (auditoria.fecha_realizacion) doc.text(`Fecha de realización: ${auditoria.fecha_realizacion}`, 50, doc.y + 2);

  let y = 190;
  doc.fontSize(11).fillColor('#000').text('Datos generales', 50, y, { underline: true });
  y = doc.y + 4;
  doc.fontSize(9).fillColor('#333');
  doc.text(`Auditor: ${auditoria.auditor?.nombre || auditoria.auditor_externo || '—'}`, 50, y);
  y = doc.y + 2;
  doc.text(`Alcance: ${limpiarTexto(auditoria.alcance)}`, 50, y, { width: 495 });
  y = doc.y + 2;
  if (auditoria.criterios) {
    doc.text(`Criterios: ${limpiarTexto(auditoria.criterios)}`, 50, y, { width: 495 });
    y = doc.y + 2;
  }

  // Resumen de hallazgos: las cantidades por tipo van al inicio del informe,
  // para leer el resultado de la auditoría sin recorrer el checklist completo.
  // Cuenta hallazgos formalmente registrados (AuditFinding).
  const hallazgos = auditoria.hallazgos || [];
  const resumen = RESUMEN_TIPOS.map((t) => ({
    ...t,
    cantidad: hallazgos.filter((h) => h.tipo === t.tipo).length,
  }));

  // El checklist se dibuja más abajo, pero su conteo se necesita acá: la
  // segunda fila del resumen contrasta los hallazgos formales con cómo
  // quedaron evaluados los puntos de la norma. Son dos registros distintos
  // (un punto marcado NC no crea un hallazgo) y separarlos entre páginas se
  // presta a leer una cifra por la otra. Sólo cuenta los puntos activos, que
  // son los únicos que se imprimen en el informe final.
  const puntos = (auditoria.checklist || []).slice().sort((a, b) => a.orden - b.orden);
  const itemsChecklist = puntos.filter((p) => p.tipo === 'item');
  const itemsActivos = itemsChecklist.filter((p) => p.activo);
  const itemsEvaluados = itemsActivos.filter((p) => p.evaluacion);
  const conteoEvaluaciones = EVALUACIONES_ORDEN.map(
    (valor) => itemsActivos.filter((p) => p.evaluacion === valor).length
  );

  y += 14;
  y = ensureSpace(doc, y, 155);
  doc.fontSize(11).fillColor('#000').text('Resumen de hallazgos', 50, y, { underline: true });
  y = doc.y + 8;

  const resumenRight = 340;
  const cantidadX = 235;
  const cantidadAncho = resumenRight - cantidadX - 4;

  doc.rect(50, y, resumenRight - 50, 18).fill('#00857d');
  doc.fillColor('#fff').fontSize(8).font('Helvetica-Bold');
  doc.text('Tipo de hallazgo', 53, y + 5, { width: cantidadX - 56 });
  doc.text('Cantidad', cantidadX, y + 5, { width: cantidadAncho, align: 'right' });
  doc.font('Helvetica');
  y += 18;

  resumen.forEach((fila, idx) => {
    if (idx % 2 === 1) doc.rect(50, y, resumenRight - 50, 16).fill('#f7fafa');
    doc.fillColor('#000').fontSize(8).text(fila.etiqueta, 53, y + 4, { width: cantidadX - 56 });
    doc.font('Helvetica-Bold').fillColor(fila.cantidad > 0 ? fila.color : '#888');
    doc.text(String(fila.cantidad), cantidadX, y + 4, { width: cantidadAncho, align: 'right' });
    doc.font('Helvetica').fillColor('#000');
    y += 16;
  });

  doc.rect(50, y, resumenRight - 50, 16).fill('#e8f2f0');
  doc.fillColor('#00857d').fontSize(8).font('Helvetica-Bold');
  doc.text('Total de hallazgos', 53, y + 4, { width: cantidadX - 56 });
  doc.text(String(hallazgos.length), cantidadX, y + 4, { width: cantidadAncho, align: 'right' });
  doc.font('Helvetica').fillColor('#000');
  y += 16;

  // Segunda fila: cómo quedó evaluado el checklist normativo. Va pegada a la
  // tabla pero en gris, para que se lea como una cifra de otra naturaleza.
  y += 4;
  doc.rect(50, y, resumenRight - 50, 16).fill('#f2f4f4');
  doc.fillColor('#555').fontSize(8).text('Checklist (C / NC / OM / N/A)', 53, y + 4, { width: cantidadX - 56 });
  doc.font('Helvetica-Bold').fillColor('#333');
  doc.text(conteoEvaluaciones.join(' / '), cantidadX, y + 4, { width: cantidadAncho, align: 'right' });
  doc.font('Helvetica').fillColor('#000');
  y += 16;

  y += 5;
  if (hallazgos.length === 0) {
    doc.fontSize(7.5).fillColor('#888').text('No se registraron hallazgos formales en esta auditoría.', 50, y, { width: 495 });
    y = doc.y + 2;
  }
  doc.fontSize(7.5).fillColor('#888').text(
    `C = Cumple · NC = No cumple · OM = Oportunidad de mejora · N/A = No aplica, sobre ${itemsActivos.length} ` +
    'puntos activos del checklist. Un punto evaluado NC u OM no es por sí solo un hallazgo: las cantidades ' +
    'de arriba corresponden a los hallazgos registrados formalmente en la auditoría.',
    50, y, { width: 495 }
  );
  y = doc.y;

  // Tabla del checklist normativo
  y += 12;
  y = ensureSpace(doc, y, 30);
  doc.fontSize(11).fillColor('#000').text(`Checklist normativo evaluado — ${normaLabel}`, 50, y, { underline: true });
  y = doc.y + 8;

  const cols = { clausula: 50, texto: 100, eval: 470, evidencia: 505 };
  const tableRight = 545;

  doc.rect(50, y, tableRight - 50, 18).fill('#00857d');
  doc.fillColor('#fff').fontSize(8);
  doc.text('Cláus.', cols.clausula + 3, y + 5, { width: cols.texto - cols.clausula - 6 });
  doc.text('Punto de la norma', cols.texto + 3, y + 5, { width: cols.eval - cols.texto - 6 });
  doc.text('Eval.', cols.eval + 3, y + 5, { width: cols.evidencia - cols.eval - 6 });
  y += 18;

  puntos.forEach((punto, idx) => {
    if (punto.tipo === 'titulo') {
      y = ensureSpace(doc, y, 20);
      doc.rect(50, y, tableRight - 50, 16).fill('#e8f2f0');
      doc.fillColor('#00857d').fontSize(8).font('Helvetica-Bold');
      doc.text(limpiarTexto(punto.texto).replace(/\n/g, ' — '), cols.clausula + 3, y + 4, { width: tableRight - cols.clausula - 6 });
      doc.font('Helvetica');
      y += 16;
      return;
    }

    if (!punto.activo) return; // los puntos desactivados no se imprimen en el informe final

    const texto = limpiarTexto(punto.texto);
    const evidencia = limpiarTexto(punto.evidencia);
    const textoAltura = doc.heightOfString(texto, { width: cols.eval - cols.texto - 6, fontSize: 7.5 });
    const evidenciaAltura = evidencia
      ? doc.heightOfString(`Evidencia: ${evidencia}`, { width: tableRight - cols.clausula - 6, fontSize: 7 })
      : 0;
    const rowHeight = Math.max(16, textoAltura + 6) + (evidenciaAltura ? evidenciaAltura + 4 : 0);

    y = ensureSpace(doc, y, rowHeight + 4);
    if (idx % 2 === 1) {
      doc.rect(50, y, tableRight - 50, rowHeight).fill('#f7fafa');
    }
    const fuenteEtiqueta = FUENTE_LABELS[punto.fuente];
    doc.fillColor('#000').fontSize(7.5);
    doc.text(punto.clausula || '—', cols.clausula + 3, y + 3, { width: cols.texto - cols.clausula - 6 });
    if (fuenteEtiqueta) {
      doc.fontSize(6.5).fillColor('#888').text(fuenteEtiqueta, cols.clausula + 3, y + 12, { width: cols.texto - cols.clausula - 6 });
      doc.fillColor('#000').fontSize(7.5);
    }
    doc.text(texto, cols.texto + 3, y + 3, { width: cols.eval - cols.texto - 6, fontSize: 7.5 });

    const evalTexto = EVALUACIONES[punto.evaluacion] || '—';
    doc.fillColor(EVALUACION_COLORES[punto.evaluacion] || '#000').font('Helvetica-Bold').fontSize(8);
    doc.text(evalTexto, cols.eval + 3, y + 3, { width: cols.evidencia - cols.eval - 6 });
    doc.font('Helvetica').fillColor('#000');

    if (evidencia) {
      doc.fontSize(7).fillColor('#555');
      doc.text(`Evidencia: ${evidencia}`, cols.clausula + 3, y + textoAltura + 8, { width: tableRight - cols.clausula - 6 });
      doc.fillColor('#000');
    }

    y += rowHeight + 4;
  });

  y += 6;
  doc.fontSize(7.5).fillColor('#888').text(
    `Leyenda: C = Cumple · NC = No cumple · OM = Oportunidad de mejora · N/A = No aplica. ` +
    `Puntos activos: ${itemsActivos.length} de ${itemsChecklist.length} · Evaluados: ${itemsEvaluados.length} de ${itemsActivos.length}.`,
    50, y, { width: tableRight - 50 }
  );
  y = doc.y + 14;

  // Hallazgos (detalle; las cantidades ya salieron en el resumen inicial)
  if (hallazgos.length > 0) {
    y = ensureSpace(doc, y, 30);
    doc.fontSize(11).fillColor('#000').text('Hallazgos', 50, y, { underline: true });
    y = doc.y + 8;

    hallazgos.forEach((h) => {
      const descripcion = limpiarTexto(h.descripcion);
      const alto = doc.heightOfString(descripcion, { width: 495, fontSize: 8.5 }) + 20;
      y = ensureSpace(doc, y, alto);
      doc.fontSize(8.5).fillColor('#00857d').font('Helvetica-Bold').text(HALLAZGO_TIPOS[h.tipo] || h.tipo, 50, y);
      doc.font('Helvetica').fillColor('#333');
      if (h.clausula) doc.text(`Cláusula: ${limpiarTexto(h.clausula)}`, 300, y);
      if (h.no_conformidad) doc.text(`NC: ${h.no_conformidad.codigo}`, 420, y);
      y = doc.y + 2;
      doc.fontSize(8.5).fillColor('#000').text(descripcion, 50, y, { width: 495 });
      y = doc.y + 10;
    });
  }

  if (auditoria.conclusiones) {
    y = ensureSpace(doc, y, 40);
    doc.fontSize(11).fillColor('#000').text('Conclusiones', 50, y, { underline: true });
    y = doc.y + 4;
    doc.fontSize(9).fillColor('#333').text(limpiarTexto(auditoria.conclusiones), 50, y, { width: 495 });
  }

  doc.end();
}

module.exports = { buildAuditPdf };
