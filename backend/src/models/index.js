const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../../config/database');

// Usa la configuración correspondiente a NODE_ENV (development/test/production).
// Antes esto siempre usaba "development" sin importar el entorno, lo que en
// producción ignoraba las credenciales y la config SSL de config.production.
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

if (!dbConfig) {
  throw new Error(`No hay configuración de base de datos para NODE_ENV="${env}" en config/database.js`);
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    dialectOptions: dbConfig.dialectOptions,
  }
);

const db = {};

const modelFiles = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js');

modelFiles.forEach(file => {
  const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
});

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
