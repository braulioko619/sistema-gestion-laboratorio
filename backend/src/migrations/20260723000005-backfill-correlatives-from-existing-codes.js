'use strict';

// La tabla correlatives (0.1) arranca en 0 para cada (tipo, anio). Pero ya
// existían códigos generados con el método viejo (COUNT(*)) antes de esta
// migración -- si no se hereda el número más alto ya usado, la primera
// llamada nueva a CorrelativeService.next() puede repetir un código que ya
// existe (ej: COT-2026-001 duplicado). Este backfill calcula, por tabla y
// año, el número más alto realmente usado en los códigos existentes y deja
// correlatives.ultimo_numero en ese valor (o más alto, si ya había algo).
const FUENTES = [
  { tabla: 'quotes', tipo: 'cotizacion', prefijo: 'COT' },
  { tabla: 'work_orders', tipo: 'orden_trabajo', prefijo: 'OT' },
  { tabla: 'calibration_certificates', tipo: 'certificado', prefijo: 'CERT' },
];

module.exports = {
  up: async (queryInterface) => {
    for (const { tabla, tipo, prefijo } of FUENTES) {
      const filas = await queryInterface.sequelize.query(
        `SELECT codigo FROM ${tabla} WHERE codigo LIKE :patron`,
        { replacements: { patron: `${prefijo}-%` }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      const maxPorAnio = new Map();
      for (const { codigo } of filas) {
        const match = codigo.match(new RegExp(`^${prefijo}-(\\d{4})-(\\d+)$`));
        if (!match) continue;
        const anio = Number(match[1]);
        const numero = Number(match[2]);
        maxPorAnio.set(anio, Math.max(maxPorAnio.get(anio) || 0, numero));
      }

      for (const [anio, maxNumero] of maxPorAnio.entries()) {
        await queryInterface.sequelize.query(
          `
          INSERT INTO correlatives (id, tipo, anio, ultimo_numero, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), :tipo, :anio, :maxNumero, now(), now())
          ON CONFLICT (tipo, anio)
          DO UPDATE SET ultimo_numero = GREATEST(correlatives.ultimo_numero, EXCLUDED.ultimo_numero), "updatedAt" = now()
          `,
          { replacements: { tipo, anio, maxNumero } }
        );
      }
    }
  },

  down: async () => {
    // Migración de reparación de datos: no hay un estado "anterior" seguro
    // al que volver sin arriesgar códigos ya emitidos después de correrla.
  },
};
