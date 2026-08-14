const bcrypt = require('bcryptjs');

// Las contraseñas de arranque no van escritas en el código: se toman de
// SEED_PASSWORD al momento de correr los seeders. Falla fuerte si la variable
// no está definida, en vez de caer en un valor por defecto que terminaría
// publicado en el repositorio.
//
// Uso: SEED_PASSWORD=... npx sequelize-cli db:seed:all
//
// Las cuentas creadas así son de arranque: hay que cambiarles la contraseña
// desde la aplicación después del primer ingreso, porque quedan todas con la
// misma clave y eso rompe la trazabilidad por usuario de la bitácora.
function seedPassword() {
  const password = process.env.SEED_PASSWORD;
  if (!password) {
    throw new Error(
      'Falta la variable SEED_PASSWORD. Define una contraseña de arranque antes de correr los seeders, ' +
      'por ejemplo: SEED_PASSWORD=<contraseña> npx sequelize-cli db:seed:all'
    );
  }
  return password;
}

function hashSeedPassword(saltRounds = 10) {
  return bcrypt.hash(seedPassword(), saltRounds);
}

module.exports = { seedPassword, hashSeedPassword };
