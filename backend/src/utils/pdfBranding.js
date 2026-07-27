// Redibuja la marca de Lenor (mismas coordenadas que
// frontend/src/assets/lenor-mark.svg) con primitivas de pdfkit, para no
// depender de un archivo de imagen ráster. Compartido entre quotePdf.js y
// certificatePdf.js: mismo encabezado visual en todos los PDF generados.
function drawLenorMark(doc, x, y, size) {
  const scale = size / 220;
  const sx = (px) => x + px * scale;
  const sy = (py) => y + py * scale;

  doc.save();
  doc.lineCap('round');
  doc.strokeColor('#00857d').lineWidth(46 * scale);
  doc.moveTo(sx(188), sy(16)).lineTo(sx(66), sy(150)).stroke();
  doc.moveTo(sx(80), sy(150)).lineTo(sx(138), sy(150)).stroke();
  doc.fillColor('#00857d');
  doc.polygon([sx(138), sy(116)], [sx(196), sy(150)], [sx(138), sy(184)]).fill();
  doc.restore();
}

// Encabezado estándar: marca + wordmark "LENOR" + texto descriptivo.
function drawHeader(doc, subtitulo) {
  drawLenorMark(doc, 50, 40, 40);
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#00857d').text('LENOR', 100, 45);
  doc.font('Helvetica').fontSize(10).fillColor('#333').text('Gestión de laboratorio', 100, 66);
  doc.fontSize(9).fillColor('#666').text(subtitulo || 'Laboratorio de Calibraciones — ISO/IEC 17025', 100, 80);
}

module.exports = { drawLenorMark, drawHeader };
