const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

const PREFIJOS = {
  orden_trabajo: 'OT',
  certificado: 'CERT',
  cotizacion: 'COT',
  muestra: 'MU',
  aseguramiento: 'AS',
};

// Incrementa de forma atómica el correlativo (tipo, año) con un UPSERT de
// Postgres: el ON CONFLICT DO UPDATE se resuelve a nivel de fila, así que
// dos transacciones concurrentes nunca reciben el mismo ultimo_numero, sin
// necesidad de SELECT ... FOR UPDATE ni de reintentos ante una unique
// violation.
async function next(tipo, options = {}) {
  const prefijo = PREFIJOS[tipo];
  if (!prefijo) {
    throw new Error(`Tipo de correlativo desconocido: ${tipo}`);
  }

  const anio = new Date().getFullYear();

  const [row] = await sequelize.query(
    `
    INSERT INTO correlatives (id, tipo, anio, ultimo_numero, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), :tipo, :anio, 1, now(), now())
    ON CONFLICT (tipo, anio)
    DO UPDATE SET ultimo_numero = correlatives.ultimo_numero + 1, "updatedAt" = now()
    RETURNING ultimo_numero
    `,
    {
      replacements: { tipo, anio },
      type: QueryTypes.SELECT,
      transaction: options.transaction,
    }
  );

  const correlativo = String(row.ultimo_numero).padStart(3, '0');
  return `${prefijo}-${anio}-${correlativo}`;
}

module.exports = { next };
