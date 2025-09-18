// API Client - Railway Production Backend
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://brandflow-backend-production-99ae.up.railway.app'
  : 'https://brandflow-backend-production-99ae.up.railway.app';
const API_TIMEOUT = 30000;

console.log('🔧 API Client 초기화:', API_BASE_URL);

// Simple API client
const createRequest = async (method, url, data = null, config = {}) => {
  // Build final URL with trailing slash for work-types
  let finalUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
  
  // Fix trailing slash for API endpoints that require it
  const endpointsNeedingSlash = ['/api/work-types', '/api/products', '/api/users'];
  endpointsNeedingSlash.forEach(endpoint => {
    if (finalUrl.includes(endpoint) && !finalUrl.includes(endpoint + '/') && finalUrl.split('?')[0].endsWith(endpoint)) {
      finalUrl = finalUrl.replace(endpoint, endpoint + '/');
    }
  });
  
  // Headers
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
  
  // Build query parameters
  let requestUrl = finalUrl;
  if (config.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    });
    requestUrl += (requestUrl.includes('?') ? '&' : '?') + searchParams.toString();
  }
  
  console.log(`🌐 API 요청: ${method} ${requestUrl}`);
  
  try {
    const response = await fetch(requestUrl, {
      method: method.toUpperCase(),
      headers,
      body: data ? JSON.stringify(data) : null,
      signal: AbortSignal.timeout(API_TIMEOUT),
      mode: 'cors',
      credentials: 'include'
    });
    
    console.log(`📡 API 응답: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      console.error('❌ API 오류:', errorData);
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = { data: errorData, status: response.status };
      throw error;
    }
    
    // 204 No Content는 body가 없으므로 JSON 파싱 건너뛰기
    if (response.status === 204) {
      console.log('✅ API 성공: 204 No Content (빈 응답)');
      return { data: null, status: response.status, headers: response.headers };
    }

    const responseData = await response.json();
    console.log('✅ API 성공:', responseData);
    return { data: responseData, status: response.status, headers: response.headers };
    
  } catch (error) {
    console.error('💥 API 요청 실패:', error);
    if (error.name === 'AbortError') {
      throw new Error('요청 시간 초과');
    }
    throw error;
  }
};

// API methods
const api = {
  get: (url, config = {}) => createRequest('GET', url, null, config),
  post: (url, data, config = {}) => createRequest('POST', url, data, config),
  put: (url, data, config = {}) => createRequest('PUT', url, data, config),
  delete: (url, config = {}) => createRequest('DELETE', url, null, config),
  patch: (url, data, config = {}) => createRequest('PATCH', url, data, config)
};

// Legacy API endpoints for backward compatibility
export const apiEndpoints = {
  campaigns: {
    list: (params = {}) => api.get('/api/campaigns', { params }),
    financialSummary: (campaignId) => api.get(`/api/campaigns/${campaignId}/financial-summary`)
  },
  purchaseRequests: {
    list: (params = {}) => api.get('/api/purchase-requests', { params })
  },
  users: {
    list: (params = {}) => api.get('/api/users', { params }),
    create: (userData, config = {}) => api.post('/api/users', userData, config),
    update: (userId, userData, config = {}) => api.put(`/api/users/${userId}`, userData, config),
    delete: (userId, config = {}) => api.delete(`/api/users/${userId}`, config)
  },
  products: {
    list: (params = {}) => api.get('/api/products', { params }),
    create: (productData, config = {}) => api.post('/api/products', productData, config),
    update: (productId, productData, config = {}) => api.put(`/api/products/${productId}`, productData, config),
    delete: (productId, config = {}) => api.delete(`/api/products/${productId}`, config)
  }
};

// Approval API for ApprovalButtons component
export const approvalAPI = {
  approvePost: (postId, status, reason = '') => 
    api.put(`/api/campaigns/posts/${postId}/approve`, { status, reason }),
  approvePurchaseRequest: (requestId, status, adjustmentAmount = 0, adjustmentReason = '', paymentMemo = '') =>
    api.put(`/api/purchase-requests/${requestId}/approve`, { 
      status, 
      adjustmentAmount, 
      adjustmentReason, 
      paymentMemo 
    }),
  approveIncentive: (incentiveId, status, adjustmentAmount = 0, adjustmentReason = '', paymentMemo = '') =>
    api.put(`/api/incentives/${incentiveId}/approve`, { 
      status, 
      adjustmentAmount, 
      adjustmentReason, 
      paymentMemo 
    })
};

export default api;