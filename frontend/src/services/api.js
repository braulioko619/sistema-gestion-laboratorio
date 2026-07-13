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
};

// DOCUMENTS
export const documentsAPI = {
  list: (params) => api.get('/documents', { params }),
  get: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  publish: (id, data) => api.post(`/documents/${id}/publish`, data),
  versions: (id) => api.get(`/documents/${id}/versions`),
};

// QUALITY
export const qualityAPI = {
  records: (params) => api.get('/quality/records', { params }),
  createRecord: (data) => api.post('/quality/records', data),
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
  createFinding: (id, data) => api.post(`/internal-audits/${id}/findings`, data),
};

// AUDIT
export const auditAPI = {
  logs: (params) => api.get('/audit/logs', { params }),
  report: (params) => api.get('/audit/report', { params }),
};

// USERS
export const usersAPI = {
  list: () => api.get('/users'),
};

export default api;
