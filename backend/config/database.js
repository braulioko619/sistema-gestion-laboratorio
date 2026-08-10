require('dotenv').config();

// DB_POOL_MAX ya estaba documentada en .env.example pero ningún environment
// la leía, así que el pool corría siempre con el default de Sequelize (max: 5).
const pool = {
  max: parseInt(process.env.DB_POOL_MAX, 10) || 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
};

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sgl_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool,
  },
  test: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME_TEST || 'sgl_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool,
    dialectOptions: {
      ssl:
        process.env.DB_SSL === 'true'
          ? { require: true, rejectUnauthorized: false }
          : false,
    },
  },
};
