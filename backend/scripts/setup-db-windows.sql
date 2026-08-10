-- Aprovisionamiento inicial de la base de datos para despliegue nativo
-- (Windows Server 2022, sin Docker).
--
-- Docker Compose crea el rol, la base de datos y sus permisos implícitamente
-- vía las variables POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB del
-- servicio "postgres" (ver docker-compose.yml). En una instalación nativa
-- de PostgreSQL nadie hace eso por ti, así que este script cubre lo mismo.
--
-- Ejecutar UNA SOLA VEZ, como superusuario, antes del primer "npm run migrate":
--   psql -U postgres -h localhost -f setup-db-windows.sql
--
-- Te pedirá reemplazar la contraseña de ejemplo antes de correrlo.

-- 1) Rol de la aplicación
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lab_user') THEN
    CREATE ROLE lab_user WITH LOGIN PASSWORD 'CAMBIA_ESTA_CLAVE';
  END IF;
END
$$;

-- 2) Base de datos, con lab_user como OWNER.
--    Importante: desde PostgreSQL 15 el owner de la base de datos es también
--    el owner del schema "public" (antes era compartido/público por defecto).
--    Si no se fija el OWNER aquí, lab_user puede terminar sin permiso CREATE
--    sobre "public", y la migración del paso 3 fallará más abajo.
SELECT 'CREATE DATABASE laboratorio_db OWNER lab_user ENCODING ''UTF8'''
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'laboratorio_db')\gexec

-- 3) Extensión requerida por la migración de hash-chain de auditoría
--    (backend/src/migrations/20260726000002-add-hash-chain-to-audit-logs.js).
--    Esa migración corre "CREATE EXTENSION IF NOT EXISTS pgcrypto" con el
--    rol lab_user; se pre-crea aquí como superusuario para no depender de
--    que lab_user tenga ese permiso. Como la migración usa IF NOT EXISTS,
--    al encontrarla ya creada simplemente no hace nada y sigue.
\c laboratorio_db
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verificación rápida:
-- \du lab_user
-- \l laboratorio_db
-- \dx (debe listar pgcrypto)
