const PDFDocument = require('pdfkit');
const { drawHeader } = require('./pdfBranding');

function formatMoney(value, moneda) {
  const number = Number(value || 0);
  return `${moneda || 'CLP'} ${number.toLocaleString('es-CL', { maximumFractionDigits: 2 })}`;
}

// Arma el PDF de la cotización y lo escribe directamente en la respuesta HTTP.
// Se genera al vuelo (no se guarda en disco) para que siempre refleje el
// estado más reciente de la cotización, incluso si fue editada después de
// haberse emitido.
function buildQuotePdf(cotizacion, res) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${cotizacion.codigo}.pdf"`);
  doc.pipe(res);

  drawHeader(doc);

  doc.fontSize(16).fillColor('#000').text(`Cotización ${cotizacion.codigo}`, 50, 115);
  doc.fontSize(9).fillColor('#666');
  doc.text(`Estado: ${cotizacion.estado.toUpperCase()}`, 50, 137);
  if (cotizacion.fecha_emision) doc.text(`Fecha de emisión: ${cotizacion.fecha_emision}`, 50, doc.y + 2);
  if (cotizacion.fecha_vencimiento) doc.text(`Válida hasta: ${cotizacion.fecha_vencimiento}`, 50, doc.y + 2);

  // Datos del cliente
  let y = 190;
  doc.fontSize(11).fillColor('#000').text('Cliente', 50, y, { underline: true });
  y = doc.y + 4;
  doc.fontSize(9).fillColor('#333');
  doc.text(cotizacion.cliente?.nombre || '—', 50, y);
  y = doc.y + 2;
  if (cotizacion.cliente?.identificacion_fiscal) {
    doc.text(`Identificación: ${cotizacion.cliente.identificacion_fiscal}`, 50, y);
    y = doc.y + 2;
  }
  if (cotizacion.cliente?.direccion) {
    doc.text(`Dirección: ${cotizacion.cliente.direccion}`, 50, y);
    y = doc.y + 2;
  }
  if (cotizacion.cliente?.telefono) {
    doc.text(`Teléfono: ${cotizacion.cliente.telefono}`, 50, y);
    y = doc.y + 2;
  }
  if (cotizacion.cliente?.email_contacto) {
    doc.text(`Correo: ${cotizacion.cliente.email_contacto}`, 50, y);
    y = doc.y + 2;
  }

  // Tabla de ítems
  y += 15;
  const cols = { desc: 50, protocolo: 190, modalidad: 260, acred: 315, cant: 350, precio: 390, subtotal: 465 };
  const tableRight = 545;

  doc.rect(50, y, tableRight - 50, 20).fill('#00857d');
  doc.fillColor('#fff').fontSize(9);
  doc.text('Descripción', cols.desc + 4, y + 6, { width: cols.protocolo - cols.desc - 8 });
  doc.text('Protocolo', cols.protocolo + 4, y + 6, { width: cols.modalidad - cols.protocolo - 8 });
  doc.text('Modalidad', cols.modalidad + 4, y + 6, { width: cols.acred - cols.modalidad - 8 });
  doc.text('Acred.', cols.acred + 4, y + 6, { width: cols.cant - cols.acred - 8 });
  doc.text('Cant.', cols.cant + 4, y + 6, { width: cols.precio - cols.cant - 8 });
  doc.text('P. Unit.', cols.precio + 4, y + 6, { width: cols.subtotal - cols.precio - 8 });
  doc.text('Subtotal', cols.subtotal + 4, y + 6, { width: tableRight - cols.subtotal - 4 });
  y += 20;

  (cotizacion.items || []).forEach((item, idx) => {
    if (y > 680) {
      doc.addPage();
      y = 50;
    }
    const esTerreno = item.modalidad === 'terreno';
    const rowHeight = esTerreno ? 32 : 20;
    if (idx % 2 === 1) {
      doc.rect(50, y, tableRight - 50, rowHeight).fill('#f2f7f6');
    }
    doc.fillColor('#000').fontSize(8.5);
    doc.text(item.descripcion, cols.desc + 4, y + 6, { width: cols.protocolo - cols.desc - 8 });
    doc.text(item.protocolo, cols.protocolo + 4, y + 6, { width: cols.modalidad - cols.protocolo - 8 });
    doc.text(esTerreno ? 'Terreno' : 'Laboratorio', cols.modalidad + 4, y + 6, { width: cols.acred - cols.modalidad - 8 });
    doc.text(item.acreditado ? 'Sí' : 'No', cols.acred + 4, y + 6, { width: cols.cant - cols.acred - 8 });
    doc.text(String(item.cantidad), cols.cant + 4, y + 6, { width: cols.precio - cols.cant - 8 });
    doc.text(formatMoney(item.precio_unitario, cotizacion.moneda), cols.precio + 4, y + 6, { width: cols.subtotal - cols.precio - 8 });
    doc.text(formatMoney(item.subtotal, cotizacion.moneda), cols.subtotal + 4, y + 6, { width: tableRight - cols.subtotal - 4 });

    if (esTerreno) {
      const costoTraslado = Number(item.valor_traslado || 0) + Number(item.tiempo_traslado_horas || 0) * Number(item.tarifa_hora_traslado || 0);
      const costoManoObra = Number(item.horas_hombre || 0) * Number(item.tarifa_hora_hombre || 0);
      doc.fillColor('#666').fontSize(7);
      doc.text(
        `Base: ${formatMoney(item.precio_base, cotizacion.moneda)}  +  Traslado: ${formatMoney(costoTraslado, cotizacion.moneda)}  +  Mano de obra: ${formatMoney(costoManoObra, cotizacion.moneda)}`,
        cols.desc + 4, y + 20, { width: tableRight - cols.desc - 8 }
      );
    }

    y += rowHeight;
  });

  y += 10;
  doc.moveTo(50, y).lineTo(tableRight, y).strokeColor('#ccc').stroke();
  y += 10;

  const totalsLabelX = 370;
  const totalsValueX = 460;
  doc.fontSize(9).fillColor('#333');
  doc.text('Subtotal:', totalsLabelX, y, { width: 85 });
  doc.text(formatMoney(cotizacion.subtotal, cotizacion.moneda), totalsValueX, y, { width: tableRight - totalsValueX, align: 'right' });
  y += 14;

  if (Number(cotizacion.descuento_porcentaje) > 0) {
    doc.text(`Descuento (${cotizacion.descuento_porcentaje}%):`, totalsLabelX, y, { width: 85 });
    doc.text(`- ${formatMoney(cotizacion.descuento_monto, cotizacion.moneda)}`, totalsValueX, y, { width: tableRight - totalsValueX, align: 'right' });
    y += 14;
  }

  doc.text(`IVA (${cotizacion.iva_porcentaje}%):`, totalsLabelX, y, { width: 85 });
  doc.text(formatMoney(cotizacion.iva_monto, cotizacion.moneda), totalsValueX, y, { width: tableRight - totalsValueX, align: 'right' });
  y += 18;

  doc.fontSize(12).fillColor('#00857d');
  doc.text('TOTAL:', totalsLabelX, y, { width: 85 });
  doc.text(formatMoney(cotizacion.total, cotizacion.moneda), totalsValueX, y, { width: tableRight - totalsValueX, align: 'right' });
  y += 35;

  if (cotizacion.condiciones) {
    doc.fontSize(10).fillColor('#000').text('Condiciones', 50, y, { underline: true });
    y = doc.y + 4;
    doc.fontSize(9).fillColor('#333').text(cotizacion.condiciones, 50, y, { width: tableRight - 50 });
    y = doc.y + 12;
  }

  if (cotizacion.notas) {
    doc.fontSize(10).fillColor('#000').text('Notas', 50, y, { underline: true });
    y = doc.y + 4;
    doc.fontSize(9).fillColor('#333').text(cotizacion.notas, 50, y, { width: tableRight - 50 });
  }

  doc.end();
}

module.exports = { buildQuotePdf };
