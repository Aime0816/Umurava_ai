import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : '/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000,  // 2 min — AI calls can be slow
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token if present
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — normalise errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// ── Typed helpers ─────────────────────────────────────────────

export const candidatesApi = {
  list:   (params?: object) => apiClient.get('/candidates', { params }),
  create: (data: object | object[]) => apiClient.post('/candidates', data),
  get:    (id: string)      => apiClient.get(`/candidates/${id}`),
  update: (id: string, data: object) => apiClient.put(`/candidates/${id}`, data),
  delete: (id: string)      => apiClient.delete(`/candidates/${id}`),
  search: (params: object)  => apiClient.get('/candidates/search', { params }),
};

export const jobsApi = {
  list:   ()                => apiClient.get('/jobs'),
  create: (data: object)    => apiClient.post('/jobs', data),
  get:    (id: string)      => apiClient.get(`/jobs/${id}`),
  update: (id: string, data: object) => apiClient.put(`/jobs/${id}`, data),
  delete: (id: string)      => apiClient.delete(`/jobs/${id}`),
};

export const screeningsApi = {
  run:        (data: object)  => apiClient.post('/screenings', data),
  list:       ()              => apiClient.get('/screenings'),
  get:        (id: string)    => apiClient.get(`/screenings/${id}`),
  rankings:   (id: string)    => apiClient.get(`/screenings/${id}/rankings`),
};

export const uploadApi = {
  files: (formData: FormData) =>
    apiClient.post('/upload/cvs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  json: (data: object | object[]) => apiClient.post('/upload/json', data),
};
