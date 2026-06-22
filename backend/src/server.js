require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv();

const app = require('./app');
const db = require('./models');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await db.sequelize.authenticate();
    logger.info('Conexion a la base de datos establecida correctamente.');

    app.listen(PORT, () => {
      logger.info(`Servidor escuchando en el puerto ${PORT}`);
    });
  } catch (error) {
    logger.error(`No se pudo iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
}

start();
