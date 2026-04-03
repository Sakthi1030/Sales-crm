/**
 * utils/api.js
 * Centralised API service. All components call these functions
 * rather than using axios directly — makes endpoint changes easy.
 */

import axios from 'axios';

// ── Auth ───────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => axios.post('/api/auth/login', data),
  register: (data) => axios.post('/api/auth/register', data),
  me:       ()     => axios.get('/api/auth/me'),
};

// ── Leads ──────────────────────────────────────────────────
export const leadsAPI = {
  getAll:       (params) => axios.get('/api/leads', { params }),
  getOne:       (id)     => axios.get(`/api/leads/${id}`),
  create:       (data)   => axios.post('/api/leads', data),
  update:       (id, d)  => axios.put(`/api/leads/${id}`, d),
  updateStatus: (id, s)  => axios.patch(`/api/leads/${id}/status`, { status: s }),
  delete:       (id)     => axios.delete(`/api/leads/${id}`),
};

// ── Customers ──────────────────────────────────────────────
export const customersAPI = {
  getAll:          (params) => axios.get('/api/customers', { params }),
  getOne:          (id)     => axios.get(`/api/customers/${id}`),
  create:          (data)   => axios.post('/api/customers', data),
  update:          (id, d)  => axios.put(`/api/customers/${id}`, d),
  delete:          (id)     => axios.delete(`/api/customers/${id}`),
  addInteraction:  (id, d)  => axios.post(`/api/customers/${id}/interactions`, d),
};

// ── Deals ──────────────────────────────────────────────────
export const dealsAPI = {
  getAll:       (params) => axios.get('/api/deals', { params }),
  getOne:       (id)     => axios.get(`/api/deals/${id}`),
  create:       (data)   => axios.post('/api/deals', data),
  update:       (id, d)  => axios.put(`/api/deals/${id}`, d),
  updateStage:  (id, s)  => axios.patch(`/api/deals/${id}/stage`, { stage: s }),
  delete:       (id)     => axios.delete(`/api/deals/${id}`),
  summary:      ()       => axios.get('/api/deals/pipeline/summary'),
};

// ── Tasks ──────────────────────────────────────────────────
export const tasksAPI = {
  getAll:  (params) => axios.get('/api/tasks', { params }),
  create:  (data)   => axios.post('/api/tasks', data),
  update:  (id, d)  => axios.put(`/api/tasks/${id}`, d),
  toggle:  (id)     => axios.patch(`/api/tasks/${id}/toggle`),
  delete:  (id)     => axios.delete(`/api/tasks/${id}`),
};

// ── Reports ────────────────────────────────────────────────
export const reportsAPI = {
  overview:       () => axios.get('/api/reports/overview'),
  monthlyRevenue: () => axios.get('/api/reports/monthly-revenue'),
  leadSources:    () => axios.get('/api/reports/lead-sources'),
  repPerformance: () => axios.get('/api/reports/rep-performance'),
  winRate:        () => axios.get('/api/reports/win-rate'),
  conversion:     () => axios.get('/api/reports/conversion'),
};

// ── Team ───────────────────────────────────────────────────
export const teamAPI = {
  getAll:  ()       => axios.get('/api/team'),
  getOne:  (id)     => axios.get(`/api/team/${id}`),
  update:  (id, d)  => axios.put(`/api/team/${id}`, d),
  delete:  (id)     => axios.delete(`/api/team/${id}`),
};

// ── Global error interceptor ───────────────────────────────
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Let AuthContext handle token removal on 401
      localStorage.removeItem('nexus_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
