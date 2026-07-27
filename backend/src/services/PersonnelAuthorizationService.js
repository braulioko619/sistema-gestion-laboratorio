const { Op } = require('sequelize');
const { PersonnelAuthorization } = require('../models');

// Resuelve "¿está X autorizado para la magnitud M hoy?" (tarea 2.5).
// No basta con leer authorization.estado==='vigente': ese campo no se
// actualiza solo cuando pasa fecha_vencimiento (nada hace esa transición
// automática todavía), así que la vigencia real se recalcula comparando
// fecha_vencimiento contra la fecha de consulta en cada llamada.
async function estaAutorizado(userId, magnitud, fecha) {
  const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

  const autorizacion = await PersonnelAuthorization.findOne({
    where: {
      user_id: userId,
      magnitud: { [Op.iLike]: magnitud },
      estado: 'vigente',
      [Op.or]: [
        { fecha_vencimiento: null },
        { fecha_vencimiento: { [Op.gte]: fechaConsulta } },
      ],
    },
    order: [['fecha_autorizacion', 'DESC']],
  });

  return { autorizado: !!autorizacion, autorizacion, fecha_consulta: fechaConsulta };
}

module.exports = { estaAutorizado };
