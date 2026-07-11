import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (fullName: string, email: string, password: string) =>
    api.post('/auth/register', { full_name: fullName, email, password }), 
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'), 
  guestLogin: () => api.post('/auth/guest'), 
};

export const propertiesApi = {
  getAll: () => api.get('/properties'),
  getById: (id: number) => api.get(`/properties/${id}`),
  search: (query: string) => api.get('/properties', { params: { q: query } }), 
};

export const documentsApi = {
  getRequired: () => api.get('/documents'), 
  toggleDocument: (documentId: string) => 
    api.post(`/documents/${documentId}/toggle`),
};

export const algorithmsApi = {
  getAll: () => api.get('/algorithms'),
  getOne: (algorithmId: string) => 
    api.get(`/algorithms/${algorithmId}`),
  toggleStep: (stepId: string) => 
    api.post(`/algorithms/steps/${stepId}/toggle`),
};

export const helpfulApi = {
  getAll: (params?: { q?: string; category?: string }) => 
    api.get('/materials', { params }),
  getById: (id: string) => 
    api.get(`/materials/${id}`),
};

export const mfcApi = {

  getPropertyMarkers: (propertyId: number) => 
    api.get(`/map/property/${propertyId}/markers`),
  getDocumentPoints: () => 
    api.get('/map/document-points'), 
};

export const surveyApi = {
  getSteps: () => api.get('/questionnaire'),
  submit: (formData: Record<string, string>) => 
    api.put('/questionnaire', formData), 
  getData: () => api.get('/questionnaire'), 
};

export default api;