const path = require('path');

// Logotipo oficial de Lenor (mismo archivo usado en frontend/public), copiado
// a este directorio porque backend y frontend son builds Docker independientes
// y el contenedor de backend no tiene acceso a la carpeta frontend/public.
const LOGO_PATH = path.join(__dirname, '../assets/Lenor_LogotipoVertical_ColorPositivo.png');
// Proporción real del contenido visible dentro del PNG (ancho/alto), para
// no deformar el logo al escalarlo por altura.
const LOGO_ASPECT_RATIO = 1149 / 1201;

// Encabezado estándar: logo (marca + wordmark) + texto descriptivo.
// Compartido entre quotePdf.js y certificatePdf.js: mismo encabezado visual
// en todos los PDF generados.
function drawHeader(doc, subtitulo) {
  const logoHeight = 50;
  const logoWidth = logoHeight * LOGO_ASPECT_RATIO;
  const logoX = 50;
  const logoY = 35;

  doc.image(LOGO_PATH, logoX, logoY, { height: logoHeight });

  const textoX = logoX + logoWidth + 14;
  doc.font('Helvetica').fontSize(10).fillColor('#333').text('Gestión de laboratorio', textoX, logoY + 16);
  doc.fontSize(9).fillColor('#666').text(subtitulo || 'Laboratorio de Calibraciones — ISO/IEC 17025', textoX, logoY + 30);
}

module.exports = { drawHeader };
