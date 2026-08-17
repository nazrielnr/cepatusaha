import { createApiClient } from '@cepatusaha/utils'

// Get Clerk token for authentication
async function getAuthHeaders() {
  // @ts-ignore - Clerk is loaded globally
  if (window.Clerk) {
    try {
      // @ts-ignore
      const token = await window.Clerk.session?.getToken()
      if (token) {
        return { Authorization: `Bearer ${token}` }
      }
    } catch (error) {
      console.error('Failed to get Clerk token:', error)
    }
  }
  return {}
}

const baseClient = createApiClient(import.meta.env.VITE_API_URL || 'http://localhost:8787')

// Wrap API client to add auth headers
const apiClient = {
  get: async (endpoint: string, options?: any) => {
    const headers = await getAuthHeaders()
    return baseClient.get<any>(endpoint, { ...options, headers: { ...options?.headers, ...headers } })
  },
  post: async (endpoint: string, body?: any, options?: any) => {
    const headers = await getAuthHeaders()
    return baseClient.post<any>(endpoint, body, { ...options, headers: { ...options?.headers, ...headers } })
  },
  put: async (endpoint: string, body?: any, options?: any) => {
    const headers = await getAuthHeaders()
    return baseClient.put<any>(endpoint, body, { ...options, headers: { ...options?.headers, ...headers } })
  },
  delete: async (endpoint: string, options?: any) => {
    const headers = await getAuthHeaders()
    return baseClient.delete<any>(endpoint, { ...options, headers: { ...options?.headers, ...headers } })
  },
}

/**
 * Admin API Client
 * 
 * Provides methods to interact with admin-specific API endpoints.
 * All endpoints require super admin authentication.
 */
export const adminApi = {
  // Statistics endpoints
  statistics: {
    getAll: () => apiClient.get('/api/admin/statistics'),
    getUsers: () => apiClient.get('/api/admin/statistics/users'),
    getProjects: () => apiClient.get('/api/admin/statistics/projects'),
  },

  // System health endpoints
  health: {
    getSystemHealth: () => apiClient.get('/api/admin/health'),
    getErrors: (params?: any) => apiClient.get('/api/admin/health/errors', { params }),
  },

  // AI Models endpoints
  models: {
    list: () => apiClient.get('/api/admin/models'),
    get: (id: string) => apiClient.get(`/api/admin/models/${id}`),
    create: (data: any) => apiClient.post('/api/admin/models', data),
    update: (id: string, data: any) => apiClient.put(`/api/admin/models/${id}`, data),
    delete: (id: string) => apiClient.delete(`/api/admin/models/${id}`),
    health: () => apiClient.get('/api/admin/models/health'),
  },

  // Chat monitoring endpoints
  chats: {
    list: (params?: any) => apiClient.get('/api/admin/chats', { params }),
    get: (sessionId: string) => apiClient.get(`/api/admin/chats/${sessionId}`),
    delete: (sessionId: string) => apiClient.delete(`/api/admin/chats/${sessionId}`),
  },

  // User management endpoints
  users: {
    list: (params?: { 
      page?: number
      limit?: number
      search?: string
      sortBy?: string
      sortOrder?: 'asc' | 'desc'
    }) => apiClient.get('/api/admin/users', { params }),
    get: (userId: string) => apiClient.get(`/api/admin/users/${userId}`),
    delete: (userId: string) => apiClient.delete(`/api/admin/users/${userId}`),
  },

  // Token usage endpoints
  tokens: {
    getAll: (params?: any) => apiClient.get('/api/admin/tokens', { params }),
    getByUser: (userId: string) => apiClient.get(`/api/admin/tokens/user/${userId}`),
    getBySession: (sessionId: string) => apiClient.get(`/api/admin/tokens/session/${sessionId}`),
  },

  // Storage management endpoints
  storage: {
    getMetrics: () => apiClient.get('/api/admin/storage'),
    listAssets: (params?: any) => apiClient.get('/api/admin/storage/assets', { params }),
    deleteAssets: (assetIds: string[]) => apiClient.delete('/api/admin/storage/assets', { data: { assetIds } }),
  },

  // Function execution endpoints
  functions: {
    list: (params?: any) => apiClient.get('/api/admin/functions', { params }),
    getStats: () => apiClient.get('/api/admin/functions/stats'),
  },

  // Publication analytics endpoints
  publications: {
    list: (params?: any) => apiClient.get('/api/admin/publications', { params }),
    getStats: () => apiClient.get('/api/admin/publications/stats'),
  },

  // Dependency insights endpoints
  dependencies: {
    list: (params?: any) => apiClient.get('/api/admin/dependencies', { params }),
    getStats: () => apiClient.get('/api/admin/dependencies/stats'),
  },

  // User analytics endpoints
  analytics: {
    getUsers: (params?: any) => apiClient.get('/api/admin/analytics/users', { params }),
    getUserTimeline: (userId: string) => apiClient.get(`/api/admin/analytics/users/${userId}/timeline`),
  },

  // Data export endpoints
  export: {
    statistics: (format: 'csv' | 'json') => apiClient.get(`/api/admin/export/statistics?format=${format}`),
    chats: (format: 'csv' | 'json') => apiClient.get(`/api/admin/export/chats?format=${format}`),
  },

  // Audit logs endpoints
  auditLogs: {
    list: (params?: any) => apiClient.get('/api/admin/audit-logs', { params }),
    getStats: () => apiClient.get('/api/admin/audit-logs/stats'),
  },
}

export default adminApi
