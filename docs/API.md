# Documentación de API REST

## 📌 Base URL

```
Desarrollo: http://localhost:3001/api
Producción: https://api.laboratorio.com/api
```

## 🔐 Autenticación

Todos los endpoints (excepto login y signup) requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

Ejemplo:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  http://localhost:3001/api/documents
```

---

## 👤 Autenticación - Authentication

### POST /auth/login
**Descripción:** Autenticar usuario

```json
// Request
{
  "email": "admin@laboratorio.com",
  "password": "Admin@123"
}

// Response (200)
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@laboratorio.com",
    "nombre": "Admin",
    "role": "administrador"
  }
}
```

**Códigos:**
- `200` - Autenticación exitosa
- `401` - Credenciales inválidas
- `400` - Datos incompletos

---

### POST /auth/register
**Descripción:** Registrar nuevo usuario (solo administrador)

**Permisos requeridos:** administrador

```json
// Request
{
  "email": "supervisor@laboratorio.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "roleId": "550e8400-e29b-41d4-a716-446655440001"
}

// Response (201)
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "email": "supervisor@laboratorio.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "role": "supervisor"
  }
}
```

---

### POST /auth/refresh
**Descripción:** Renovar token de acceso

```json
// Request
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

// Response (200)
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## 📄 Documentos - Documents

### GET /documents
**Descripción:** Listar documentos

**Parámetros query:**
- `page` - Número de página (default: 1)
- `limit` - Resultados por página (default: 10, max: 100)
- `estado` - Filtrar por estado (borrador, publicado, archivado)
- `tipo` - Filtrar por tipo de documento
- `search` - Búsqueda en título y descripción

**Permisos:** Todos pueden ver documentos asignados a su rol

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/documents?page=1&limit=10&estado=publicado"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "titulo": "Procedimiento Control de Calidad",
      "descripcion": "Procedimiento estándar de QC",
      "tipo": "procedimiento",
      "estado": "publicado",
      "version_actual": 3,
      "creado_por": "550e8400-e29b-41d4-a716-446655440001",
      "created_at": "2026-06-16T10:30:00Z",
      "updated_at": "2026-06-16T14:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### POST /documents
**Descripción:** Crear nuevo documento

**Permisos:** jefe_laboratorio, supervisor, personal_calidad

```json
// Request
{
  "titulo": "Procedimiento Nueva Técnica",
  "descripcion": "Procedimiento para la nueva técnica de análisis",
  "tipo": "procedimiento",
  "contenido": "Contenido del documento en HTML o texto"
}

// Response (201)
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "titulo": "Procedimiento Nueva Técnica",
    "estado": "borrador",
    "version_actual": 1,
    "creado_por": "550e8400-e29b-41d4-a716-446655440002",
    "created_at": "2026-06-16T15:00:00Z"
  }
}
```

---

### GET /documents/:id
**Descripción:** Obtener detalles de un documento

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/documents/550e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "Procedimiento Control de Calidad",
    "descripcion": "Procedimiento estándar de QC",
    "tipo": "procedimiento",
    "estado": "publicado",
    "version_actual": 3,
    "contenido": "...",
    "creado_por": "550e8400-e29b-41d4-a716-446655440001",
    "modificado_por": "550e8400-e29b-41d4-a716-446655440002",
    "created_at": "2026-06-16T10:30:00Z",
    "updated_at": "2026-06-16T14:15:00Z"
  }
}
```

---

### PUT /documents/:id
**Descripción:** Actualizar documento

**Permisos:** creador del documento, jefe_laboratorio

```json
// Request
{
  "titulo": "Procedimiento Control de Calidad v2",
  "descripcion": "Actualizado con nuevos parámetros",
  "contenido": "Contenido actualizado"
}

// Response (200)
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "Procedimiento Control de Calidad v2",
    "estado": "borrador",
    "version_actual": 4,
    "updated_at": "2026-06-16T16:00:00Z"
  }
}
```

---

### POST /documents/:id/publish
**Descripción:** Cambiar estado a "publicado"

**Permisos:** jefe_laboratorio

```json
// Request
{
  "comentario": "Aprobado para publicación"
}

// Response (200)
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "estado": "publicado",
    "published_at": "2026-06-16T16:30:00Z"
  }
}
```

---

### GET /documents/:id/versions
**Descripción:** Obtener historial de versiones

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/documents/550e8400-e29b-41d4-a716-446655440000/versions
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "version": 4,
      "cambios": "Se actualizaron parámetros de QC",
      "autor": "550e8400-e29b-41d4-a716-446655440002",
      "created_at": "2026-06-16T16:00:00Z"
    },
    {
      "version": 3,
      "cambios": "Se agregaron nuevos procedimientos",
      "autor": "550e8400-e29b-41d4-a716-446655440001",
      "created_at": "2026-06-16T14:15:00Z"
    }
  ]
}
```

---

## 📊 Calidad - Quality

### POST /quality/records
**Descripción:** Registrar indicador de calidad

**Permisos:** personal_calidad, supervisor

```json
// Request
{
  "tipo_indicador": "ph_agua",
  "valor": 7.2,
  "notas": "Medición diaria de agua destilada"
}

// Response (201)
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tipo_indicador": "ph_agua",
    "valor": 7.2,
    "estado_cumplimiento": "conforme",
    "registrado_por": "550e8400-e29b-41d4-a716-446655440002",
    "created_at": "2026-06-16T09:30:00Z"
  }
}
```

---

### GET /quality/records
**Descripción:** Listar registros de calidad

**Parámetros query:**
- `tipo_indicador` - Filtrar por tipo
- `fecha_desde` - Filtrar desde fecha (ISO 8601)
- `fecha_hasta` - Filtrar hasta fecha (ISO 8601)
- `estado` - Filtrar por cumplimiento

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/quality/records?tipo_indicador=ph_agua&fecha_desde=2026-06-01"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "tipo_indicador": "ph_agua",
      "valor": 7.2,
      "estado_cumplimiento": "conforme",
      "limites": {
        "minimo": 6.5,
        "maximo": 7.5
      },
      "registrado_por": "550e8400-e29b-41d4-a716-446655440002",
      "created_at": "2026-06-16T09:30:00Z"
    }
  ]
}
```

---

### GET /quality/indicators
**Descripción:** Obtener definiciones de indicadores

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/quality/indicators
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ph_agua",
      "nombre": "pH del Agua Destilada",
      "unidad": "pH",
      "limites": {
        "minimo": 6.5,
        "maximo": 7.5
      },
      "tipo": "numerico"
    },
    {
      "id": "temperatura_ambiente",
      "nombre": "Temperatura Ambiente",
      "unidad": "°C",
      "limites": {
        "minimo": 18,
        "maximo": 25
      },
      "tipo": "numerico"
    }
  ]
}
```

---

## 🔍 Auditoría - Audit

### GET /audit/logs
**Descripción:** Obtener registros de auditoría

**Parámetros query:**
- `usuario_id` - Filtrar por usuario
- `accion` - Filtrar por tipo de acción
- `entidad` - Filtrar por entidad (document, quality_record, user)
- `fecha_desde` - Filtrar desde fecha
- `fecha_hasta` - Filtrar hasta fecha
- `page` - Página (default: 1)
- `limit` - Por página (default: 50)

**Permisos:** jefe_laboratorio, supervisor

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/audit/logs?accion=crear&entidad=document&page=1"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "usuario_id": "550e8400-e29b-41d4-a716-446655440001",
      "usuario": {
        "nombre": "Juan Pérez",
        "email": "juan@laboratorio.com"
      },
      "accion": "crear",
      "entidad": "document",
      "entidad_id": "550e8400-e29b-41d4-a716-446655440002",
      "cambios_anteriores": null,
      "cambios_nuevos": {
        "titulo": "Procedimiento Nueva",
        "tipo": "procedimiento"
      },
      "ip_address": "192.168.1.100",
      "timestamp": "2026-06-16T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "pages": 25
  }
}
```

---

### GET /audit/report
**Descripción:** Generar reporte de auditoría

**Parámetros query:**
- `fecha_desde` - Fecha de inicio (ISO 8601)
- `fecha_hasta` - Fecha de fin (ISO 8601)
- `formato` - Formato salida (json, pdf, csv)

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/audit/report?fecha_desde=2026-06-01&fecha_hasta=2026-06-30&formato=pdf" \
  -o reporte_auditoria.pdf
```

---

## 👥 Usuarios - Users

### GET /users
**Descripción:** Listar usuarios

**Permisos:** administrador, jefe_laboratorio

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/users
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "email": "admin@laboratorio.com",
      "nombre": "Admin",
      "apellido": "Sistema",
      "role": "administrador",
      "estado": "activo",
      "ultimo_acceso": "2026-06-16T16:30:00Z",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## ❌ Códigos de Error

| Código | Descripción |
|--------|------------|
| `200` | OK - Solicitud exitosa |
| `201` | Created - Recurso creado |
| `400` | Bad Request - Datos inválidos |
| `401` | Unauthorized - Token inválido o expirado |
| `403` | Forbidden - Permisos insuficientes |
| `404` | Not Found - Recurso no encontrado |
| `409` | Conflict - Recurso ya existe |
| `422` | Unprocessable Entity - Validación fallida |
| `429` | Too Many Requests - Rate limit excedido |
| `500` | Internal Server Error - Error del servidor |

**Formato de error:**
```json
{
  "success": false,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "El documento no existe",
    "details": "Document with id 550e8400... not found"
  }
}
```

---

## 🔄 Paginación

Endpoints que devuelven listas incluyen información de paginación:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "pages": 25,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 📝 Notas

- Todos los timestamps están en UTC (ISO 8601)
- Los tokens JWT expiran en 7 días por defecto
- Usar refresh token para obtener nuevo token de acceso
- La auditoría registra todos los cambios automáticamente
- Los documentos no pueden ser eliminados, solo archivados (cumplimiento normativo)

---

**Versión API:** 1.0  
**Última actualización:** Junio 2026
