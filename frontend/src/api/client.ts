import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Auth ---

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// --- Work Items ---

export interface WorkItemFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  type?: string;
  team_id?: string;
  assignee_id?: string;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

export const workItemsApi = {
  list: (filters: WorkItemFilters = {}) =>
    api.get('/work-items', { params: filters }).then((r) => r.data),

  getById: (id: string) =>
    api.get(`/work-items/${id}`).then((r) => r.data),

  create: (data: any, idempotencyKey?: string) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return api.post('/work-items', data, { headers }).then((r) => r.data);
  },

  update: (id: string, data: any) =>
    api.patch(`/work-items/${id}`, data).then((r) => r.data),

  assign: (id: string, data: any, idempotencyKey?: string) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return api.post(`/work-items/${id}/assign`, data, { headers }).then((r) => r.data);
  },

  approve: (id: string, data: any, idempotencyKey?: string) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return api.post(`/work-items/${id}/approve`, data, { headers }).then((r) => r.data);
  },

  resolve: (id: string, data: any, idempotencyKey?: string) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return api.post(`/work-items/${id}/resolve`, data, { headers }).then((r) => r.data);
  },

  reopen: (id: string, data: any, idempotencyKey?: string) => {
    const headers: Record<string, string> = {};
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return api.post(`/work-items/${id}/reopen`, data, { headers }).then((r) => r.data);
  },

  addComment: (id: string, body: string) =>
    api.post(`/work-items/${id}/comments`, { body }).then((r) => r.data),

  getActivity: (id: string, page = 1, pageSize = 25) =>
    api.get(`/work-items/${id}/activity`, { params: { page, pageSize } }).then((r) => r.data),
};

// --- Dashboard ---

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
  myWork: () => api.get('/dashboard/my-work').then((r) => r.data),
  critical: () => api.get('/dashboard/critical').then((r) => r.data),
  approvals: () => api.get('/dashboard/approvals').then((r) => r.data),
  recent: () => api.get('/dashboard/recent').then((r) => r.data),
};

// --- Users & Teams ---

export const usersApi = {
  listAll: () => api.get('/users/all').then((r) => r.data),
};

export const teamsApi = {
  list: () => api.get('/teams').then((r) => r.data),
  members: (teamId: string) => api.get(`/teams/${teamId}/members`).then((r) => r.data),
};

export default api;
