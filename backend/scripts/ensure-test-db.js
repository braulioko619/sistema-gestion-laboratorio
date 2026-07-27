// Postgres no soporta "CREATE DATABASE IF NOT EXISTS", así que este script
// se conecta a la base "postgres" por defecto y crea la BD de test si falta.
// Se corre como "pretest" antes de "npm test".
require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const dbNameTest = process.env.DB_NAME_TEST || 'sgl_test';

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  await client.connect();
  try {
    await client.query(`CREATE DATABASE "${dbNameTest}"`);
    console.log(`[ensure-test-db] Base de datos "${dbNameTest}" creada.`);
  } catch (error) {
    if (error.code === '42P04') {
      // duplicate_database: ya existe, nada que hacer
      console.log(`[ensure-test-db] Base de datos "${dbNameTest}" ya existe.`);
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[ensure-test-db] Error preparando la base de datos de test:', error.message);
  process.exit(1);
});
