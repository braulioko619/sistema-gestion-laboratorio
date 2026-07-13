require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv();

const app = require('./app');
const db = require('./models');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3001;

// Capturar errores no manejados para que el proceso no muera silenciosamente
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Promesa rechazada sin manejar: ${reason}`);
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error(`Excepcion no capturada: ${error.message}`);
  console.error('Uncaught Exception:', error);
  // NO hacer process.exit aqui para mantener el servidor corriendo
});

async function start() {
  try {
    await db.sequelize.authenticate();
    logger.info('Conexion a la base de datos establecida correctamente.');

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Servidor escuchando en el puerto ${PORT}`);
      console.log(`✓ Backend corriendo en http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Puerto ${PORT} ya está en uso. Cerrando proceso anterior...`);
        logger.error(`Puerto ${PORT} en uso: ${err.message}`);
      } else {
        logger.error(`Error del servidor: ${err.message}`);
        console.error('Server error:', err);
      }
    });

  } catch (error) {
    logger.error(`No se pudo iniciar el servidor: ${error.message}`);
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
}

start();
