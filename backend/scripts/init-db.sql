-- Database initialization script for laboratorio_db
-- This script is executed by Docker when the PostgreSQL container starts
-- It's intentionally minimal because Sequelize migrations handle schema creation

-- Ensure UTF8 encoding is set
SET client_encoding = 'UTF8';

-- Optional: Enable extensions if needed
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The actual schema will be created by Sequelize migrations
-- Run: npm run migrate
-- Then: npm run seed
