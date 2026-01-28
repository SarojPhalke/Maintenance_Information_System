// API Service Layer - Mock implementation for frontend-only
import type {
  Asset,
  PreventiveMaintenance,
  Breakdown,
  SparePart,
  SpareTransaction,
  UtilityLog,
  DashboardStats,
  User,
  ApiResponse,
} from '@/types';

const API_BASE = '/api';

// Helper to simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Get token from localStorage
const getAuthHeader = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    await delay();
    // In real implementation, this would be:
    // const response = await fetch(`${API_BASE}${endpoint}`, {
    //   ...options,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     ...getAuthHeader(),
    //     ...options.headers,
    //   },
    // });
    // return response.json();
    
    // For now, return mock success
    return { data: {} as T, success: true };
  } catch (error) {
    console.error('API Error:', error);
    return { data: {} as T, success: false, message: 'An error occurred' };
  }
}

// Auth APIs
export const authApi = {
  login: async (email: string, password: string) => 
    fetchApi<{ user: User; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  register: async (data: Partial<User> & { password: string }) =>
    fetchApi<{ user: User; token: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Asset APIs
export const assetApi = {
  getAll: () => fetchApi<Asset[]>('/assets'),
  getById: (id: string) => fetchApi<Asset>(`/assets/${id}`),
  getByQR: (qrCode: string) => fetchApi<Asset>(`/qr/${qrCode}`),
  create: (data: Partial<Asset>) => 
    fetchApi<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Asset>) =>
    fetchApi<Asset>(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<void>(`/assets/${id}`, { method: 'DELETE' }),
};

// PM APIs
export const pmApi = {
  getAll: () => fetchApi<PreventiveMaintenance[]>('/pm'),
  getById: (id: string) => fetchApi<PreventiveMaintenance>(`/pm/${id}`),
  create: (data: Partial<PreventiveMaintenance>) =>
    fetchApi<PreventiveMaintenance>('/pm', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<PreventiveMaintenance>) =>
    fetchApi<PreventiveMaintenance>(`/pm/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<void>(`/pm/${id}`, { method: 'DELETE' }),
};

// Breakdown APIs
export const breakdownApi = {
  getAll: () => fetchApi<Breakdown[]>('/breakdowns'),
  getById: (id: string) => fetchApi<Breakdown>(`/breakdowns/${id}`),
  create: (data: Partial<Breakdown>) =>
    fetchApi<Breakdown>('/breakdowns', { method: 'POST', body: JSON.stringify(data) }),
  updateOperator: (id: string, data: Partial<Breakdown>) =>
    fetchApi<Breakdown>(`/breakdowns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateEngineer: (id: string, data: Partial<Breakdown>) =>
    fetchApi<Breakdown>(`/breakdowns/${id}/engineer`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Spares APIs
export const sparesApi = {
  getAll: () => fetchApi<SparePart[]>('/spares'),
  getById: (id: string) => fetchApi<SparePart>(`/spares/${id}`),
  create: (data: Partial<SparePart>) =>
    fetchApi<SparePart>('/spares', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<SparePart>) =>
    fetchApi<SparePart>(`/spares/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<void>(`/spares/${id}`, { method: 'DELETE' }),
  transaction: (data: Partial<SpareTransaction>) =>
    fetchApi<SpareTransaction>('/spares/transaction', { method: 'POST', body: JSON.stringify(data) }),
};

// Utility APIs
export const utilityApi = {
  getAll: () => fetchApi<UtilityLog[]>('/utilities'),
  create: (data: Partial<UtilityLog>) =>
    fetchApi<UtilityLog>('/utilities', { method: 'POST', body: JSON.stringify(data) }),
};

// Dashboard APIs
export const dashboardApi = {
  getStats: () => fetchApi<DashboardStats>('/dashboard/stats'),
};

// User Management APIs
export const userApi = {
  getAll: () => fetchApi<User[]>('/users'),
};
