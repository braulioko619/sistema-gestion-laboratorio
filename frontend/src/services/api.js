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
