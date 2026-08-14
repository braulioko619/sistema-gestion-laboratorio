# Sistema de Gestión de Laboratorio de Calibración e Inspección

Sistema web para la operación completa de un laboratorio de calibración e inspección bajo **ISO/IEC 17025** e **ISO/IEC 17020**: desde la cotización al cliente hasta la emisión firmada del certificado, con trazabilidad metrológica, cálculo de incertidumbre según GUM y auditoría inalterable.

No es un LIMS de ensayos analíticos: la unidad de trabajo es el **instrumento del cliente**, no la muestra de producto.

---

## Qué hace

### Flujo comercial-operativo

Cadena completa con marca de acreditación propagada extremo a extremo:

```
Tarifario → Cotización → Orden de Trabajo → Calibración → Certificado → Lista para facturar
```

- **Clientes (CRM):** direcciones y contactos múltiples, parque de instrumentos por cliente, control de órdenes de compra, facturas y notas de crédito.
- **Tarifario y cotizaciones:** precios por servicio, generación de cotización con historial y PDF de marca, servicios marcados como acreditados o no acreditados, ítems de terreno.
- **Órdenes de trabajo:** derivadas de la cotización, con ítems, patrones asignados por ítem y estado de facturación.
- **Recepción de instrumentos:** registro de ingreso con condición de recepción, correlativo propio y enlace a la OT.
- **Visitas de servicio:** planificación de trabajos en terreno.

### Emisión controlada de certificados (núcleo INN)

El certificado no se emite si no pasa el **motor de reglas** (`CertificateIssuanceService`), que verifica en un solo lugar y deja registro auditado de cada bloqueo:

| Verificación | Qué controla |
|---|---|
| Patrón vigente | El patrón usado tenía calibración válida a la fecha del servicio |
| Técnico autorizado | El ejecutor tenía autorización vigente para esa magnitud/procedimiento |
| Raw data presente | Existe el Excel o el formulario de captura asociado al ítem |
| Alcance INN | El servicio acreditado está dentro del alcance vigente del laboratorio |
| Signatario disponible | Existe un usuario activo con rol `signatario_inn` |

Además:

- **Certificados inmutables** una vez emitidos. Las correcciones se hacen por **enmienda**: un certificado nuevo que referencia y supersede al anterior (ISO 17025 7.8.8).
- **Firma electrónica** con registro auditado (usuario, timestamp, SHA-256 del PDF). Los certificados acreditados exigen rol `signatario_inn`. El modelo ya contempla firma avanzada (FEA, Ley 19.799) sin cambio de esquema.
- **PDF generado internamente** con `pdfkit`, incluyendo el bloque de acreditación cuando corresponde.
- **Correlativos atómicos** por tipo y año (`CorrelativeService`), sin condiciones de carrera ni reutilización de números.

### Captura de datos

Dos caminos, ambos trazables:

- **Guardián de plantillas Excel:** plantillas versionadas con SHA-256, una sola versión vigente por plantilla, descarga controlada y verificación de integridad al recibir el archivo del técnico.
- **Formularios dinámicos:** plantillas definidas con JSON Schema (validadas con `ajv`) y datos en JSONB. Permite incorporar instrumentos nuevos sin tocar el esquema de base de datos. Una entrada confirmada queda inmutable.

### Base metrológica

- **Historial de patrones:** cada punto calibrado de cada patrón, con valor nominal, valor certificado, incertidumbre y factor k. Importable desde CSV.
- **Análisis de deriva** (`DriftAnalysisService`): regresión lineal sobre el histórico, con mínimo de 3 calibraciones antes de reportar pendiente y comparación contra el error máximo permitido del patrón.
- **Cartas de control** (`ControlChartService`): carta Shewhart de valores individuales por equipo y punto, con rango móvil (n=2, d₂=1.128).
- **Alertas de estabilidad:** job diario (`node-cron`) que avisa cuando un patrón se acerca a su límite.
- **Motor de incertidumbre GUM** (`UncertaintyEngineService`): cálculo dentro del sistema. Implementado para **Pie de Metros** en sus cuatro secciones (topes de exteriores, interiores, profundímetro y escalón), validado celda por celda contra las planillas de origen.

### Calidad y cumplimiento

- **Gestión documental** con versionado, publicación y adjuntos.
- **Indicadores de calidad** con límites y validación automática.
- **No conformidades** con seguimiento.
- **Auditorías internas** con checklists precargados para **ISO 17025** e **ISO 17020**, y registro de hallazgos.
- **Personal:** matriz de competencias, autorizaciones por procedimiento y por magnitud, con vigencia.
- **Equipos:** ficha metrológica (magnitud, rango, resolución, error máximo permitido, sede, categoría), imágenes, documentos y bitácora de eventos.
- **Alcance de acreditación** modelado como dato, no como documento suelto.
- **Validación de software (7.11.2)** registrada en tabla, con suite de tests por etapa como evidencia.

### Auditoría

`AuditLog` con **encadenamiento de hashes** (`pgcrypto`, columnas `secuencia`, `hash_anterior`, `hash_actual`) y trigger de PostgreSQL que impide UPDATE y DELETE. La cadena se verifica con:

```bash
npm run verify-audit-chain
```

Registra además los eventos críticos del flujo: descarga de plantilla, subida de Excel, verificación de hash, firma, bloqueo de emisión y supersede.

---

## Stack

**Backend** — Node.js 18, Express 4, Sequelize 6, PostgreSQL 15, JWT + MSAL (SSO Microsoft), `pdfkit`, `ajv`, `xlsx`, `node-cron`, `nodemailer`, Winston. Tests con Jest + Supertest.

**Frontend** — React 18, React Router 6, Axios, Recharts, React Icons.

**Infra** — Docker Compose (postgres + backend + frontend).

---

## Puesta en marcha

### Requisitos

Docker 20.10+ y Docker Compose 2.0+. Para desarrollo sin contenedores: Node.js 18 y PostgreSQL 15.

### Arranque

```bash
cp .env.example .env
docker-compose up
```

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Health: http://localhost:3001/api/health

En Windows también existen `iniciar-laboratorio.bat`, `start-backend.bat` y `start-frontend.bat`.

### Migraciones y datos iniciales

```bash
cd backend
npm run migrate
```

> **Atención con los seeders.** `npm run seed` está roto: el archivo `seeders/20260616000001-seed-roles-and-admin.js` inserta en tablas `"Roles"`/`"Users"` (mayúsculas) que no existen — las reales son `roles`/`users`. Como Sequelize ordena por nombre de archivo, ese seeder corre primero y aborta todo. Mientras no se decida borrarlo o corregirlo, hay que sembrar archivo por archivo:
>
> ```bash
> npx sequelize-cli db:seed --seed 20260616000001-seed-roles.js
> ```

### Usuarios de arranque

Los seeders no llevan contraseñas escritas en el código: toman la variable
`SEED_PASSWORD` al momento de ejecutarse y fallan si no está definida.

```bash
SEED_PASSWORD='<contraseña de arranque>' npx sequelize-cli db:seed:all
```

| Email | Rol |
|---|---|
| admin@laboratorio.com | administrador |
| jefe@laboratorio.com | jefe_laboratorio |
| supervisor@laboratorio.com | supervisor |
| calidad@laboratorio.com | personal_calidad |
| firmante@laboratorio.com | signatario_inn |

Existe además el rol `usuario_lectura`.

> **Cambia estas contraseñas desde la aplicación después del primer ingreso.**
> Todas las cuentas nacen con la misma clave, y mientras la compartan no hay
> forma de atribuir con certeza a una persona lo que queda en la bitácora de
> auditoría: firmas de certificados, emisiones y cambios de estado.

### Tests

```bash
cd backend
npm test
```

> El paso `pretest` crea la base `sgl_test`, lo que exige que el usuario de Postgres pueda crear bases. Si falla, ejecutar como superusuario: `ALTER ROLE lab_user CREATEDB;`

Cubren: motor GUM, servicio de emisión, correlativos bajo concurrencia, deriva, cartas de control, alertas de estabilidad, inmutabilidad del audit log, y tres flujos E2E (cotización→facturación, guardián de Excel, captura y base metrológica).

---

## Estructura

```
backend/src/
├── config/          env, logger, msal
├── models/          48 modelos Sequelize
├── controllers/     32 controladores
├── routes/          22 grupos de rutas bajo /api
├── services/        motor de emisión, GUM, deriva, cartas de control,
│                    correlativos, autorizaciones, alertas, email
├── middleware/       auth, audit, rate limit, uploads especializados
├── migrations/      62 migraciones (nunca editar una ya ejecutada)
├── jobs/            job diario de alertas de estabilidad
└── utils/           PDF de certificado, cotización y auditoría; branding

frontend/src/
├── pages/           Home, Documents, Quality, NonConformities, Personnel,
│                    InternalAudits, Audit, Calibraciones, ControlMetrologico
│                    (Calibraciones agrupa como paneles: dashboard, cotizaciones,
│                     muestras, agenda de servicios y equipos)
├── components/      Navbar, DateBar
├── context/         AuthContext
└── services/        cliente API

docs/
├── PLAN_DESARROLLO.md    plan por etapas, decisiones de arquitectura y estado
├── PLAN_4.1_MOTOR_GUM.md diseño del motor de incertidumbre
└── API.md                referencia REST (parcial, ver nota)
```

---

## API

Base: `/api`. Todos los endpoints salvo login requieren `Authorization: Bearer <token>`.

```
/auth              /documents          /quality           /nonconformities
/equipment         /personnel          /internal-audits   /checklist-template
/users             /audit              /clients           /work-orders
/samples           /service-visits     /dashboard         /accreditations
/commercial-documents  /price-list     /quotes            /software-validations
/excel-templates   /calibration-form-templates
```

> **`docs/API.md` está incompleto:** documenta solo los nueve primeros grupos (los módulos de calidad y documental). Los trece grupos del módulo de calibración —clientes, cotizaciones, órdenes de trabajo, certificados, plantillas, muestras, visitas— no están documentados ahí; la referencia vigente son los archivos en `backend/src/routes/`.

---

## Roles

La autorización se aplica por ruta con `authorizeRole`. Patrón general:

| Rol | Alcance |
|---|---|
| `administrador` | Todo, incluida gestión de usuarios |
| `jefe_laboratorio` | Operación completa + emisión y envío de certificados |
| `supervisor` | Gestión operativa y de calidad, sin emisión |
| `personal_calidad` | Gestión de calidad y operación, sin emisión |
| `signatario_inn` | Único autorizado a firmar certificados **acreditados** |
| `usuario_lectura` | Consulta |

La consulta de órdenes de trabajo y la descarga de certificados están abiertas a cualquier usuario autenticado; la emisión y el envío quedan restringidos a administración y jefatura.

---

## Seguridad

- Contraseñas con bcrypt; JWT con refresh token; SSO Microsoft vía MSAL.
- Rate limiting, CORS y Helmet.
- SHA-256 en todo archivo que constituya evidencia (plantillas, raw data, PDF firmado).
- Audit log encadenado por hash e inmutable a nivel de base de datos.
- Certificados emitidos bloqueados contra edición y borrado.

---

## Estado y pendientes

El desarrollo sigue `docs/PLAN_DESARROLLO.md`, organizado en cinco etapas. Las etapas 0 a 3 están cerradas y la etapa 4 está en curso.

**Pendiente en etapa 4:**

- **4.2** — Extender el motor GUM más allá de Pie de Metros al resto de magnitudes.
- **4.3** — Firma Electrónica Avanzada: falta elegir proveedor acreditado (E-Sign, Acepta/Sovos, IDOK) e integrar PAdES.
- **4.6** — Endurecimiento de producción: definir despliegue, respaldos automatizados con prueba de restauración, HTTPS y rotación de secretos.

**Deuda técnica conocida:**

- Seeder `20260616000001-seed-roles-and-admin.js` roto (ver arriba); bloquea `npm run seed`.
- `users.auth_provider` divergió: migración y modelo lo declaran `STRING` con default `local`, pero en la base de desarrollo es un `ENUM` con default `microsoft`.
- `NonConformity.generarCodigo` e `InternalAudit.generarCodigo` siguen usando `COUNT(*)`, el patrón con condición de carrera que ya se corrigió en certificados, OT y cotizaciones.
- `.env.example` no incluye las variables de SSO que el código sí usa: `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`, `AZURE_REDIRECT_URI`, `FRONTEND_URL`, `JWT_REFRESH_SECRET`, `SMTP_SECURE`.

**Decisiones abiertas:** despliegue local vs. nube, proveedor de FEA, y número de casos de validación numérica por magnitud.

---

## Licencia

MIT — ver `LICENSE`.

**Autor:** Braulio Gutiérrez
