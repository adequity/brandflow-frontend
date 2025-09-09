// API Client - Clean implementation without hardcoding
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

// Simple fetch wrapper
const createRequest = async (method, url, data = null, config = {}) => {
  const finalUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...config.headers
  };
  
  // Add auth token
  const token = localStorage.getItem('authToken');
  if (token && !finalUrl.includes('/auth/login')) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Add query parameters
  let requestUrl = finalUrl;
  if (config.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    requestUrl += (requestUrl.includes('?') ? '&' : '?') + searchParams.toString();
  }
  
  // Add user context for authorization
  const userData = localStorage.getItem('user');
  if (userData && !requestUrl.includes('/auth/login')) {
    const user = JSON.parse(userData);
    const separator = requestUrl.includes('?') ? '&' : '?';
    requestUrl += `${separator}viewerId=${user.id}&viewerRole=${encodeURIComponent(user.role)}`;
  }
  
  if (DEBUG_MODE) {
    console.log(`API Request: ${method} ${requestUrl}`);
  }
  
  try {
    const response = await fetch(requestUrl, {
      method: method.toUpperCase(),
      headers,
      body: data ? JSON.stringify(data) : null,
      signal: AbortSignal.timeout(API_TIMEOUT)
    });
    
    if (DEBUG_MODE) {
      console.log(`API Response: ${response.status} ${response.statusText}`);
    }
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = { data: errorData, status: response.status };
      throw error;
    }
    
    const responseData = await response.json();
    return { data: responseData, status: response.status, headers: response.headers };
    
  } catch (error) {
    if (DEBUG_MODE) {
      console.error('API Request Failed:', error.message);
    }
    throw error;
  }
};

// Base API methods
const api = {
  get: (url, config = {}) => createRequest('GET', url, null, config),
  post: (url, data, config = {}) => createRequest('POST', url, data, config),
  put: (url, data, config = {}) => createRequest('PUT', url, data, config),
  patch: (url, data, config = {}) => createRequest('PATCH', url, data, config),
  delete: (url, config = {}) => createRequest('DELETE', url, null, config)
};

// API endpoints
export const apiEndpoints = {
  // Authentication
  auth: {
    login: (credentials) => api.post('/api/auth/login/', credentials),
    logout: () => api.post('/api/auth/logout/'),
    refresh: () => api.post('/api/auth/refresh/')
  },
  
  // Users
  users: {
    list: (config = {}) => api.get('/api/users/', config),
    create: (userData) => api.post('/api/users/', userData),
    get: (id) => api.get(`/api/users/${id}/`),
    update: (id, userData) => api.put(`/api/users/${id}/`, userData),
    delete: (id) => api.delete(`/api/users/${id}/`),
    clients: (config = {}) => api.get('/api/users/clients/', config)
  },
  
  // Campaigns
  campaigns: {
    list: () => api.get('/api/campaigns/'),
    create: (campaignData) => api.post('/api/campaigns/', campaignData),
    get: (id) => api.get(`/api/campaigns/${id}/`),
    update: (id, campaignData) => api.put(`/api/campaigns/${id}/`, campaignData),
    delete: (id) => api.delete(`/api/campaigns/${id}/`),
    posts: (id) => api.get(`/api/campaigns/${id}/posts/`),
    financialSummary: (id) => api.get(`/api/campaigns/${id}/financial_summary/`)
  },
  
  // Purchase Requests
  purchaseRequests: {
    list: () => api.get('/api/purchase-requests/'),
    create: (requestData) => api.post('/api/purchase-requests/', requestData),
    get: (id) => api.get(`/api/purchase-requests/${id}/`),
    approve: (id, approvalData) => api.put(`/api/purchase-requests/${id}/approve/`, approvalData)
  },
  
  // Notifications
  notifications: {
    list: () => api.get('/api/notifications/'),
    unreadCount: () => api.get('/api/notifications/unread-count/'),
    markRead: (id) => api.put(`/api/notifications/${id}/read/`),
    create: (notificationData) => api.post('/api/notifications/', notificationData)
  },
  
  // Dashboard
  dashboard: {
    main: () => api.get('/api/dashboard/'),
    simple: () => api.get('/api/dashboard-simple/')
  }
};

export default api;