import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: parseInt(process.env.REACT_APP_TIMEOUT || 30000),
});

// Interceptor para agregar token a cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  profile: () => api.get('/auth/profile'),
};

export const MICROSOFT_LOGIN_URL = `${API_BASE_URL}/api/auth/microsoft/login`;

// DOCUMENTS
export const documentsAPI = {
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  publish: (id, data) => api.post(`/documents/${id}/publish`, data),
  versions: (id) => api.get(`/documents/${id}/versions`),
  authorizations: (id) => api.get(`/documents/${id}/authorizations`),
  grantAuthorization: (id, data) => api.post(`/documents/${id}/authorizations`, data),
  revokeAuthorization: (id, authorizationId, data) => api.patch(`/documents/${id}/authorizations/${authorizationId}/revoke`, data),
  downloadAttachment: (documentId, attachmentId) => api.get(
    `/documents/${documentId}/attachments/${attachmentId}/download`,
    { responseType: 'blob' }
  ),
};

// QUALITY
export const qualityAPI = {
  records: (params) => api.get('/quality/records', { params }),
  createRecord: (data) => api.post('/quality/records', data),
  downloadAttachment: (recordId, attachmentId) => api.get(
    `/quality/records/${recordId}/attachments/${attachmentId}/download`,
    { responseType: 'blob' }
  ),
  indicators: () => api.get('/quality/indicators'),
};

// NO CONFORMIDADES
export const nonConformitiesAPI = {
  list: (params) => api.get('/nonconformities', { params }),
  get: (id) => api.get(`/nonconformities/${id}`),
  summary: () => api.get('/nonconformities/summary'),
  create: (data) => api.post('/nonconformities', data),
  update: (id, data) => api.put(`/nonconformities/${id}`, data),
  verify: (id, data) => api.post(`/nonconformities/${id}/verify`, data),
};

// EQUIPOS
export const equipmentAPI = {
  list: (params) => api.get('/equipment', { params }),
  get: (id) => api.get(`/equipment/${id}`),
  alerts: (params) => api.get('/equipment/alerts', { params }),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  createEvent: (id, data) => api.post(`/equipment/${id}/events`, data),
  driftAnalysis: (id, params) => api.get(`/equipment/${id}/drift-analysis`, { params }),
  controlChart: (id, params) => api.get(`/equipment/${id}/control-chart`, { params }),
  stabilityAlerts: (params) => api.get('/equipment/stability-alerts', { params }),
  runStabilityAlertsJob: () => api.post('/equipment/stability-alerts/run'),

  // Historial de calibración (StandardCalibrationHistory): puntos medidos +
  // certificado opcional. Genérico por equipment_id, reutilizado tanto para
  // patrones de calibración como para equipos de Control Metrológico.
  registerCalibrationHistory: (id, formData) => api.post(`/equipment/${id}/calibration-history`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  calibrationHistory: (id, params) => api.get(`/equipment/${id}/calibration-history`, { params }),
  downloadCertificate: (historyId) => api.get(`/equipment/calibration-history/${historyId}/certificado`, { responseType: 'blob' }),

  // Imágenes referenciales
  uploadImages: (id, formData) => api.post(`/equipment/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listImages: (id) => api.get(`/equipment/${id}/images`),
  imageBlob: (imageId) => api.get(`/equipment/images/${imageId}/file`, { responseType: 'blob' }),
  setPrincipalImage: (imageId) => api.put(`/equipment/images/${imageId}/principal`),
  deleteImage: (imageId) => api.delete(`/equipment/images/${imageId}`),

  // Documentos (manuales, protocolos, fichas técnicas, otros)
  uploadDocuments: (id, formData) => api.post(`/equipment/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  listDocuments: (id, params) => api.get(`/equipment/${id}/documents`, { params }),
  downloadDocument: (documentId) => api.get(`/equipment/documents/${documentId}/download`, { responseType: 'blob' }),

  // Bitácora del instrumento con control de cambio
  createLogEntry: (id, data) => api.post(`/equipment/${id}/log`, data),
  listLogEntries: (id) => api.get(`/equipment/${id}/log`),
};

// PERSONAL
export const personnelAPI = {
  list: () => api.get('/personnel'),
  get: (userId) => api.get(`/personnel/${userId}`),
  alerts: (params) => api.get('/personnel/alerts', { params }),
  createRecord: (userId, data) => api.post(`/personnel/${userId}/records`, data),
  createAuthorization: (userId, data) => api.post(`/personnel/${userId}/authorizations`, data),
  revokeAuthorization: (id, data) => api.put(`/personnel/authorizations/${id}/revoke`, data),
};

// AUDITORÍAS INTERNAS
export const internalAuditsAPI = {
  list: (params) => api.get('/internal-audits', { params }),
  get: (id) => api.get(`/internal-audits/${id}`),
  summary: (params) => api.get('/internal-audits/summary', { params }),
  create: (data) => api.post('/internal-audits', data),
  update: (id, data) => api.put(`/internal-audits/${id}`, data),
  updateChecklist: (id, data) => api.put(`/internal-audits/${id}/checklist`, data),
  createFinding: (id, data) => api.post(`/internal-audits/${id}/findings`, data),
  downloadPdf: (id) => api.get(`/internal-audits/${id}/pdf`, { responseType: 'blob' }),
};

// PLANTILLA DEL CHECKLIST DE AUDITORÍAS (ISO/IEC 17025)
export const checklistTemplateAPI = {
  list: (params) => api.get('/checklist-template', { params }),
  create: (data) => api.post('/checklist-template', data),
  update: (id, data) => api.put(`/checklist-template/${id}`, data),
};

// AUDIT
export const auditAPI = {
  logs: (params) => api.get('/audit/logs', { params }),
  report: (params) => api.get('/audit/report', { params }),
};

// USERS
export const usersAPI = {
  list: () => api.get('/users'),
  changeState: (id, estado) => api.patch(`/users/${id}/state`, { estado }),
};

// CLIENTES (Laboratorio de Calibraciones)
export const clientsAPI = {
  list: (params) => api.get('/clients', { params }),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
};

// INSTRUMENTOS DE CLIENTE (Laboratorio de Calibraciones)
export const clientInstrumentsAPI = {
  list: (clientId, params) => api.get(`/clients/${clientId}/instruments`, { params }),
  get: (clientId, id) => api.get(`/clients/${clientId}/instruments/${id}`),
  alerts: (params) => api.get('/clients/instruments/alerts', { params }),
  create: (clientId, data) => api.post(`/clients/${clientId}/instruments`, data),
  update: (id, data) => api.put(`/clients/instruments/${id}`, data),
};

// ÓRDENES DE TRABAJO (Laboratorio de Calibraciones)
export const workOrdersAPI = {
  list: (params) => api.get('/work-orders', { params }),
  get: (id) => api.get(`/work-orders/${id}`),
  create: (data) => api.post('/work-orders', data),
  updateEstado: (id, data) => api.put(`/work-orders/${id}/estado`, data),
  addItem: (id, data) => api.post(`/work-orders/${id}/items`, data),
  updateItem: (itemId, data) => api.put(`/work-orders/items/${itemId}`, data),
  billingQueue: (params) => api.get('/work-orders/billing-queue', { params }),
  exportBillingQueueCsv: (params) => api.get('/work-orders/billing-queue/export', { params, responseType: 'blob' }),
  markFacturada: (id) => api.patch(`/work-orders/${id}/facturada-externamente`),
  addPatron: (itemId, equipment_id) => api.post(`/work-orders/items/${itemId}/patrones`, { equipment_id }),
  removePatron: (itemId, equipmentId) => api.delete(`/work-orders/items/${itemId}/patrones/${equipmentId}`),
};

// DASHBOARD (Laboratorio de Calibraciones)
export const dashboardAPI = {
  calibraciones: () => api.get('/dashboard/calibraciones'),
};

// CALENDARIZACIÓN DE SERVICIOS (Laboratorio de Calibraciones)
export const serviceVisitsAPI = {
  list: (params) => api.get('/service-visits', { params }),
  get: (id) => api.get(`/service-visits/${id}`),
  create: (data) => api.post('/service-visits', data),
  update: (id, data) => api.put(`/service-visits/${id}`, data),
};

// RECEPCIÓN DE MUESTRAS (Laboratorio de Calibraciones)
export const samplesAPI = {
  list: (params) => api.get('/samples', { params }),
  get: (id) => api.get(`/samples/${id}`),
  create: (data) => api.post('/samples', data),
  update: (id, data) => api.put(`/samples/${id}`, data),
  assign: (id, work_order_id) => api.post(`/samples/${id}/assign`, { work_order_id }),
  createWorkOrder: (id, data) => api.post(`/samples/${id}/create-work-order`, data),
};

// CERTIFICADOS DE CALIBRACIÓN (Laboratorio de Calibraciones)
export const certificatesAPI = {
  // Repositorio: listado transversal de certificados con cliente y OT asociada
  list: (params) => api.get('/work-orders/certificates', { params }),
  upload: (itemId, formData) => api.post(`/work-orders/items/${itemId}/certificate`, formData),
  generate: (itemId, data) => api.post(`/work-orders/items/${itemId}/certificate/generate`, data),
  issuanceCheck: (id) => api.get(`/work-orders/certificates/${id}/issuance-check`),
  sign: (id) => api.post(`/work-orders/certificates/${id}/sign`),
  updateEstado: (id, data) => api.put(`/work-orders/certificates/${id}/estado`, data),
  send: (id, data) => api.post(`/work-orders/certificates/${id}/send`, data),
  amend: (id, data) => api.post(`/work-orders/certificates/${id}/amend`, data),
  download: (id) => api.get(`/work-orders/certificates/${id}/download`, { responseType: 'blob' }),
};

// PLANTILLAS EXCEL (Laboratorio de Calibraciones)
export const excelTemplatesAPI = {
  list: (params) => api.get('/excel-templates', { params }),
  download: (id) => api.get(`/excel-templates/${id}/download`, { responseType: 'blob' }),
};

// RAW DATA DE CALIBRACIÓN (Laboratorio de Calibraciones)
export const calibrationDataFilesAPI = {
  upload: (itemId, formData) => api.post(`/work-orders/items/${itemId}/data-files`, formData),
  download: (id) => api.get(`/work-orders/data-files/${id}/download`, { responseType: 'blob' }),
  verify: (id) => api.post(`/work-orders/data-files/${id}/verify`),
};

// DIRECCIONES DE CLIENTE (Laboratorio de Calibraciones)
export const clientAddressesAPI = {
  create: (clientId, data) => api.post(`/clients/${clientId}/addresses`, data),
  update: (id, data) => api.put(`/clients/addresses/${id}`, data),
  remove: (id) => api.delete(`/clients/addresses/${id}`),
};

// CONTACTOS DE CLIENTE (Laboratorio de Calibraciones)
export const clientContactsAPI = {
  create: (clientId, data) => api.post(`/clients/${clientId}/contacts`, data),
  update: (id, data) => api.put(`/clients/contacts/${id}`, data),
  remove: (id) => api.delete(`/clients/contacts/${id}`),
};

// DOCUMENTOS COMERCIALES: órdenes de compra, facturas y notas de crédito
export const commercialDocumentsAPI = {
  list: (params) => api.get('/commercial-documents', { params }),
  get: (id) => api.get(`/commercial-documents/${id}`),
  create: (formData) => api.post('/commercial-documents', formData),
  update: (id, data) => api.put(`/commercial-documents/${id}`, data),
  download: (id) => api.get(`/commercial-documents/${id}/download`, { responseType: 'blob' }),
};

// TARIFARIO (Laboratorio de Calibraciones)
export const priceListAPI = {
  list: (params) => api.get('/price-list', { params }),
  create: (data) => api.post('/price-list', data),
  update: (id, data) => api.put(`/price-list/${id}`, data),
};

// COTIZACIONES (Laboratorio de Calibraciones)
export const quotesAPI = {
  list: (params) => api.get('/quotes', { params }),
  get: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  updateEstado: (id, data) => api.put(`/quotes/${id}/estado`, data),
  history: (id) => api.get(`/quotes/${id}/history`),
  downloadPdf: (id) => api.get(`/quotes/${id}/pdf`, { responseType: 'blob' }),
};

export default api;
