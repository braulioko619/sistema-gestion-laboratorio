process.env.NODE_ENV = process.env.NODE_ENV || 'test';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  globalSetup: './jest.setup.js',
  verbose: true,
  // Todas las suites comparten una sola BD Postgres real (sgl_test), no
  // tablas aisladas por archivo — correr en paralelo hace que una suite
  // (ej. TRUNCATE de CorrelativeService.test.js) pise el estado que otra
  // suite E2E concurrente necesita (correlativos, roles con nombre único).
  maxWorkers: 1,
};
