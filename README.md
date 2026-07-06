# 🏥 Sistema de Gestión Documental y Calidad para Laboratorios

Sistema integral de gestión documental y control de calidad para laboratorios que cumple con estándares **ISO/IEC 17025** e **ISO 10720**.

## 📋 Descripción

Este proyecto proporciona una solución completa para:
- **Gestión de documentos** con versionado y control de cambios
- **Registro de indicadores de calidad** con validación automática
- **Auditoría completa** de todas las acciones del sistema
- **Control de acceso** basado en roles y permisos
- **Cumplimiento normativo** con trazabilidad total

## 🚀 Características Principales

✅ **Autenticación segura** - JWT con refresh tokens  
✅ **Gestión de documentos** - Crear, editar, versionar, publicar  
✅ **Control de calidad** - Registrar indicadores con límites automáticos  
✅ **Auditoría completa** - Trazabilidad de todas las acciones  
✅ **Roles y permisos** - Administrador, Jefe, Supervisor, Personal de Calidad  
✅ **Exportación de reportes** - JSON, CSV, PDF  
✅ **API REST documentada** - OpenAPI ready  
✅ **Docker Compose** - Ambiente de desarrollo y producción  
✅ **Responsive UI** - Frontend moderno con React  

## 🛠 Stack Tecnológico

### Backend
- **Node.js 18** con Express.js
- **PostgreSQL 15** para persistencia
- **Sequelize ORM** para gestión de datos
- **JWT** para autenticación
- **bcryptjs** para encriptación de contraseñas

### Frontend
- **React 18** con React Router
- **Axios** para llamadas HTTP
- **CSS3** para estilos responsivos
- **React Icons** para iconografía

### DevOps
- **Docker & Docker Compose** para containerización
- **PostgreSQL Alpine** para optimización
- **Morgan** para logging HTTP

## 📦 Estructura del Proyecto

```
sistema-gestion-laboratorio/
├── backend/                          # API REST Node.js
│   ├── src/
│   │   ├── config/                  # Configuración (env, logger, db)
│   │   ├── models/                  # Modelos Sequelize
│   │   ├── controllers/             # Lógica de negocio
│   │   ├── routes/                  # Definición de rutas
│   │   ├── middleware/              # Middleware (auth, audit, errors)
│   │   ├── migrations/              # Migraciones de BD
│   │   ├── seeders/                 # Datos iniciales
│   │   ├── app.js                   # Configuración Express
│   │   └── server.js                # Punto de entrada
│   ├── scripts/
│   │   └── init-db.sql              # Script de inicialización
│   ├── Dockerfile
│   ├── package.json
│   └── .sequelizerc
│
├── frontend/                         # Cliente React
│   ├── src/
│   │   ├── components/              # Componentes reutilizables
│   │   ├── pages/                   # Páginas principales
│   │   ├── services/                # Cliente API
│   │   ├── context/                 # Context de autenticación
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile
│   ├── package.json
│   └── .env.local
│
├── docs/                             # Documentación
│   └── API.md                        # Especificación API
│
├── docker-compose.yml                # Orquestación de contenedores
├── .env.example                      # Variables de ejemplo
└── README.md                         # Este archivo
```

## ⚡ Inicio Rápido

### Requisitos Previos
- Docker 20.10+
- Docker Compose 2.0+
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/braulioko619/sistema-gestion-laboratorio.git
cd sistema-gestion-laboratorio
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Edita .env si necesitas cambiar valores (opcional para desarrollo)
```

### 3. Ejecutar con Docker Compose
```bash
docker-compose up
```

El sistema estará disponible en:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **API Health:** http://localhost:3001/api/health

### 4. Inicia sesión con credenciales de prueba

**Predeterminadas en login (auto-completadas):**
- Email: `admin@laboratorio.com`
- Contraseña: `Admin@123`

**Otros usuarios:**
| Usuario | Email | Contraseña | Rol |
|---------|-------|-----------|-----|
| Jefe | jefe@laboratorio.com | Jefe@123 | jefe_laboratorio |
| Supervisor | supervisor@laboratorio.com | Super@123 | supervisor |
| Calidad | calidad@laboratorio.com | Calidad@123 | personal_calidad |

## 📖 Documentación

### API REST
La documentación completa de la API está en [`docs/API.md`](docs/API.md)

**Ejemplos de endpoints principales:**
```bash
# Autenticación
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh

# Documentos
GET /api/documents?page=1&limit=10
POST /api/documents
PUT /api/documents/:id
POST /api/documents/:id/publish
GET /api/documents/:id/versions

# Calidad
GET /api/quality/records
POST /api/quality/records
GET /api/quality/indicators

# Auditoría
GET /api/audit/logs?accion=crear&entidad=document
GET /api/audit/report?formato=pdf&fecha_desde=2026-06-01

# Usuarios
GET /api/users
```

### Guías
- [Guía de Configuración](docs/SETUP.md) - Cómo ejecutar en desarrollo/producción
- [Guía de Desarrollo](docs/DEVELOPMENT.md) - Cómo trabajar con el código
- [Especificación API](docs/API.md) - Referencia completa de endpoints

## 👥 Roles y Permisos

| Rol | Documentos | Calidad | Auditoría | Usuarios |
|-----|-----------|---------|-----------|----------|
| **administrador** | CRUD + Publicar | Lectura | Lectura | Gestión |
| **jefe_laboratorio** | CRUD + Publicar | CRUD | Lectura | Lectura |
| **supervisor** | CRUD | CRUD | Lectura | - |
| **personal_calidad** | Lectura | CRUD | - | - |

## 🔐 Seguridad

✅ Contraseñas encriptadas con bcrypt (10 rounds)  
✅ JWT con expiración de 7 días  
✅ Refresh tokens para renovación segura  
✅ Rate limiting en todos los endpoints  
✅ CORS configurado  
✅ Helmet para headers de seguridad  
✅ Auditoría completa de cambios  
✅ Validación de entrada en todos los endpoints  

## 🗄️ Base de Datos

**Modelos principales:**
- `User` - Usuarios del sistema
- `Role` - Roles y permisos
- `Document` - Documentos
- `DocumentVersion` - Historial de versiones
- `QualityRecord` - Registros de calidad
- `AuditLog` - Log de auditoría

**Migraciones automáticas** al iniciar el backend

## 🐛 Troubleshooting

### Puerto ya en uso
```bash
# Cambiar puerto en .env
PORT=3002
REACT_APP_API_URL=http://localhost:3002
```

### Error de conexión a BD
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose logs postgres

# Reiniciar contenedores
docker-compose down
docker-compose up --build
```

### Limpiar todo
```bash
docker-compose down -v
docker system prune
docker-compose up
```

## 📝 Variables de Entorno

Ver `.env.example` para la lista completa.

**Principales:**
```env
# Base de datos
DB_HOST=postgres
DB_PORT=5432
DB_NAME=laboratorio_db
DB_USER=lab_user
DB_PASSWORD=lab_password

# Servidor
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=tu_secret_jwt_muy_largo_y_aleatorio_minimo_32_caracteres
JWT_EXPIRE=7d

# Frontend
REACT_APP_API_URL=http://localhost:3001
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Para cambios mayores:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/mejora`)
3. Commit tus cambios (`git commit -am 'Agrega mejora'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver `LICENSE` para detalles

## 📧 Soporte

Para preguntas o problemas, abre un [issue en GitHub](https://github.com/braulioko619/sistema-gestion-laboratorio/issues)

## 🎯 Roadmap Futuro

- [ ] Exportación de documentos en PDF
- [ ] Integración con LDAP/Active Directory
- [ ] Gráficas de control de calidad
- [ ] Alertas automáticas de cumplimiento
- [ ] Gestión de calibración de equipos
- [ ] Informes ISO 17025 automatizados
- [ ] Aplicación móvil nativa
- [ ] Integración con sistemas LIMS

---

**Última actualización:** Junio 2026  
**Versión:** 1.0.0  
**Autor:** Braulio Gutierrez
