const PDFDocument = require('pdfkit');
const { drawHeader } = require('./pdfBranding');

const ESTADOS = {
  planificada: 'PLANIFICADA',
  en_curso: 'EN CURSO',
  completada: 'COMPLETADA',
  cancelada: 'CANCELADA',
};

const EVALUACIONES = { C: 'C', NC: 'NC', OM: 'OM', 'N/A': 'N/A' };
const EVALUACION_COLORES = { C: '#1a7a4c', NC: '#c0392b', OM: '#b7791f', 'N/A': '#888' };

const HALLAZGO_TIPOS = {
  no_conformidad: 'No conformidad',
  observacion: 'Observación',
  oportunidad_mejora: 'Oportunidad de mejora',
};

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

  // Tabla del checklist normativo
  y += 12;
  y = ensureSpace(doc, y, 30);
  doc.fontSize(11).fillColor('#000').text(`Checklist normativo evaluado — ${normaLabel}`, 50, y, { underline: true });
  y = doc.y + 8;

  const cols = { clausula: 50, texto: 100, eval: 470, evidencia: 505 };
  const tableRight = 545;

  const puntos = (auditoria.checklist || []).slice().sort((a, b) => a.orden - b.orden);
  const itemsChecklist = puntos.filter((p) => p.tipo === 'item');
  const itemsActivos = itemsChecklist.filter((p) => p.activo);
  const itemsEvaluados = itemsActivos.filter((p) => p.evaluacion);

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

  // Hallazgos
  const hallazgos = auditoria.hallazgos || [];
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
