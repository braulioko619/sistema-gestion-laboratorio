const { execSync } = require('child_process');

// Corre las migraciones reales contra la BD de test antes de cualquier
// suite. Así los tests usan el esquema real (incluidas las FK, como
// audit_logs -> users) en vez de recrear tablas sueltas por archivo.
// sequelize-cli lleva su propio control de migraciones ya aplicadas
// (SequelizeMeta), así que repetir esto entre corridas es seguro y rápido.
module.exports = async function globalSetup() {
  execSync('npx sequelize-cli db:migrate --env test', {
    cwd: __dirname,
    stdio: 'inherit',
  });
};
