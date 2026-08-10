require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv();

const app = require('./app');
const db = require('./models');
const logger = require('./config/logger');
const { startStabilityAlertsJob } = require('./jobs/stabilityAlertsJob');

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

    startStabilityAlertsJob();

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`✗ Puerto ${PORT} ya está en uso. Cerrando proceso anterior...`);
        logger.error(`Puerto ${PORT} en uso: ${err.message}`);
      } else {
        logger.error(`Error del servidor: ${err.message}`);
        console.error('Server error:', err);
      }
    });

    // Bajo NSSM (servicio de Windows), detener/reiniciar el servicio envía
    // un evento de consola que Node traduce a SIGINT; sin este handler el
    // proceso moría en seco, sin drenar requests ni cerrar el pool a Postgres.
    let shuttingDown = false;
    function shutdown(signal) {
      if (shuttingDown) return;
      shuttingDown = true;
      logger.info(`Señal ${signal} recibida, cerrando servidor...`);
      server.close(() => {
        db.sequelize
          .close()
          .then(() => logger.info('Conexiones a la base de datos cerradas.'))
          .catch((err) => logger.error(`Error cerrando la base de datos: ${err.message}`))
          .finally(() => process.exit(0));
      });
      // Si algo queda colgado (requests que no terminan), fuerza la salida.
      setTimeout(() => process.exit(1), 10000).unref();
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error(`No se pudo iniciar el servidor: ${error.message}`);
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
}

start();
