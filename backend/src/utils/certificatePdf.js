const fs = require('fs');
const PDFDocument = require('pdfkit');
const { drawHeader } = require('./pdfBranding');

function texto(valor) {
  return valor === null || valor === undefined || valor === '' ? '—' : String(valor);
}

// Arma el PDF del certificado y lo escribe a disco (a diferencia de
// quotePdf.js, que transmite directo a la respuesta HTTP): el certificado
// necesita un SHA-256 calculado sobre bytes ya fijos y guardados (D1 +
// D4 — una vez emitido, el PDF no puede cambiar), no un documento
// regenerado al vuelo en cada descarga.
// `certificado` debe venir con item -> instrumento, item -> ordenTrabajo ->
// cliente, e item -> patrones ya incluidos (ver CalibrationCertificateController).
function buildCertificatePdf(certificado, filePath, opciones = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    stream.on('finish', resolve);
    stream.on('error', reject);

    const item = certificado.item;
    const instrumento = item.instrumento;
    const cliente = item.ordenTrabajo?.cliente;

    drawHeader(doc, 'Certificado de Calibración');

    doc.fontSize(16).fillColor('#000').text(`Certificado ${certificado.codigo}`, 50, 115);
    doc.fontSize(9).fillColor('#666');
    doc.text(`Estado: ${certificado.estado.toUpperCase()}`, 50, 137);
    if (certificado.fecha_calibracion) doc.text(`Fecha de calibración: ${certificado.fecha_calibracion}`, 50, doc.y + 2);
    if (certificado.fecha_emision) doc.text(`Fecha de emisión: ${certificado.fecha_emision}`, 50, doc.y + 2);

    let y = doc.y + 15;

    // Enmienda (tarea 2.9 / D4 / ISO 17025 7.8.8): si este certificado
    // supersede a otro, la PDF lo declara de forma visible, antes que
    // cualquier otro bloque — es el aviso que exige el documento de plan.
    if (opciones.enmienda) {
      doc.rect(50, y, 495, 34).fillAndStroke('#fff4e5', '#c9820a');
      doc.fillColor('#c9820a').fontSize(10).font('Helvetica-Bold')
        .text(`ENMIENDA AL CERTIFICADO N° ${opciones.enmienda.codigoOriginal || 'N/D'}`, 60, y + 6);
      doc.fillColor('#5c4200').font('Helvetica').fontSize(8)
        .text(`Motivo: ${opciones.enmienda.motivo || 'No especificado'}`, 60, y + 20, { width: 475 });
      y += 44;
      doc.font('Helvetica');
    }

    // Bloque condicional de acreditación: la única diferencia visual real
    // entre un certificado acreditado y uno no acreditado (D8 / tarea 2.6).
    if (certificado.acreditado) {
      doc.rect(50, y, 495, 40).fillAndStroke('#f2f7f6', '#00857d');
      doc.fillColor('#00857d').fontSize(10).font('Helvetica-Bold')
        .text('CALIBRACIÓN ACREDITADA', 60, y + 8);
      doc.fillColor('#333').font('Helvetica').fontSize(9)
        .text(`Laboratorio acreditado por el INN — N° ${opciones.codigoAcreditacion || 'N/D'} — Norma ISO/IEC 17025`, 60, y + 22);
      y += 50;
    } else {
      doc.fillColor('#888').fontSize(8).font('Helvetica-Oblique')
        .text('Este certificado no está cubierto por el alcance de acreditación del INN.', 50, y);
      y += 20;
    }

    doc.font('Helvetica');
    y += 10;

    doc.fontSize(11).fillColor('#000').text('Cliente', 50, y, { underline: true });
    y = doc.y + 4;
    doc.fontSize(9).fillColor('#333');
    doc.text(texto(cliente?.nombre), 50, y); y = doc.y + 2;
    if (cliente?.identificacion_fiscal) { doc.text(`Identificación: ${cliente.identificacion_fiscal}`, 50, y); y = doc.y + 2; }
    if (cliente?.direccion) { doc.text(`Dirección: ${cliente.direccion}`, 50, y); y = doc.y + 2; }

    y += 12;
    doc.fontSize(11).fillColor('#000').text('Instrumento calibrado', 50, y, { underline: true });
    y = doc.y + 4;
    doc.fontSize(9).fillColor('#333');
    doc.text(`${texto(instrumento?.tipo_instrumento)} — ${texto(instrumento?.marca)} ${texto(instrumento?.modelo)}`, 50, y); y = doc.y + 2;
    doc.text(`N° serie: ${texto(instrumento?.numero_serie)}  |  Código interno: ${texto(instrumento?.codigo_interno)}`, 50, y); y = doc.y + 2;
    doc.text(`Rango: ${texto(instrumento?.rango_medida)}  |  Resolución: ${texto(instrumento?.resolucion)}  |  Unidad: ${texto(instrumento?.unidad)}`, 50, y); y = doc.y + 2;

    y += 12;
    doc.fontSize(11).fillColor('#000').text('Patrones utilizados (trazabilidad)', 50, y, { underline: true });
    y = doc.y + 4;
    doc.fontSize(9).fillColor('#333');
    const patrones = item.patrones || [];
    if (patrones.length === 0) {
      doc.text('Sin patrones registrados para esta calibración.', 50, y);
      y = doc.y + 2;
    } else {
      patrones.forEach((p) => {
        doc.text(`${p.codigo} — ${p.nombre} (${texto(p.magnitud)}) — próxima calibración: ${texto(p.proxima_calibracion)}`, 50, y);
        y = doc.y + 2;
      });
    }

    y += 12;
    doc.fontSize(11).fillColor('#000').text('Resultados', 50, y, { underline: true });
    y = doc.y + 4;
    doc.fontSize(9).fillColor('#333');
    doc.text(`Incertidumbre expandida U: ${texto(item.incertidumbre_U)}   Factor de cobertura k: ${texto(item.factor_k)}`, 50, y);
    y = doc.y + 2;
    if (Array.isArray(item.puntos) && item.puntos.length > 0) {
      item.puntos.forEach((punto, idx) => {
        doc.text(`Punto ${idx + 1}: ${JSON.stringify(punto)}`, 50, y, { width: 495 });
        y = doc.y + 2;
      });
    }

    if (certificado.decision_rule) {
      y += 12;
      doc.fontSize(11).fillColor('#000').text('Regla de decisión (7.8.6)', 50, y, { underline: true });
      y = doc.y + 4;
      doc.fontSize(9).fillColor('#333').text(certificado.decision_rule, 50, y, { width: 495 });
      y = doc.y + 2;
    }

    y += 30;
    if (y > 700) { doc.addPage(); y = 50; }
    doc.fontSize(9).fillColor('#666').text('Firmas', 50, y, { underline: true });
    y = doc.y + 30;

    // Estampado visual de firma (tarea 2.8): si ya hay firma registrada para
    // esa columna, se dibuja el nombre + rol + fecha ARRIBA de la línea, en
    // vez de la línea vacía. Se llama de nuevo con esto lleno al firmar
    // (ver CalibrationCertificateController.signCertificate), lo que cambia
    // los bytes del PDF y por eso sha256_pdf_firmado difiere de sha256_pdf.
    const firmaTecnico = opciones.firmas?.tecnicoOSupervisor;
    const firmaSignatario = opciones.firmas?.signatarioInn;

    if (firmaTecnico) {
      doc.fontSize(8).fillColor('#333').text(`${firmaTecnico.nombre} (${firmaTecnico.rol})`, 50, y - 14, { width: 170 });
      doc.text(firmaTecnico.fecha, 50, y - 4, { width: 170 });
    }
    if (firmaSignatario) {
      doc.fontSize(8).fillColor('#333').text(`${firmaSignatario.nombre} (signatario INN)`, 320, y - 14, { width: 170 });
      doc.text(firmaSignatario.fecha, 320, y - 4, { width: 170 });
    }

    doc.moveTo(50, y).lineTo(220, y).stroke();
    doc.moveTo(320, y).lineTo(490, y).stroke();
    doc.fontSize(9).fillColor('#666');
    doc.text('Técnico responsable', 50, y + 4);
    doc.text('Signatario autorizado', 320, y + 4);

    doc.end();
  });
}

module.exports = { buildCertificatePdf };
