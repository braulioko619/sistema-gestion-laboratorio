const { AccreditationScope } = require('../models');
const logger = require('../config/logger');

// Listar el alcance de acreditación del laboratorio
exports.getAccreditationScopes = async (req, res) => {
  try {
    const { area, codigo_acreditacion, activo, search } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (area) where.area = area;
    if (codigo_acreditacion) where.codigo_acreditacion = codigo_acreditacion;
    if (activo !== undefined) where.activo = activo === 'true';
    if (search) {
      where[Op.or] = [
        { item: { [Op.iLike]: `%${search}%` } },
        { area: { [Op.iLike]: `%${search}%` } },
        { subarea: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const scopes = await AccreditationScope.findAll({
      where,
      order: [['area', 'ASC'], ['subarea', 'ASC']],
    });

    res.json({ success: true, data: scopes });
  } catch (error) {
    logger.error(`[ACCREDITATION] Error obteniendo alcance: ${error.message}`);
    res.status(500).json({
      success: false,
      error: { code: 'GET_ACCREDITATION_SCOPES_ERROR', message: 'Error obteniendo el alcance de acreditación' },
    });
  }
};
