// src/api/client.js
// 🚨 목데이터 완전 제거 - 실제 백엔드 연결만 사용

// 🚨 domains.js 의존성 완전 제거 - Railway HTTPS 하드코딩만 사용

// Railway HTTPS URL 상수
const RAILWAY_HTTPS_URL = 'https://brandflow-backend-production-99ae.up.railway.app';

// 🔒 강제 HTTPS 백엔드 URL - 임시 하드코딩으로 HTTP 완전 차단
const getBackendURL = () => {
  // 임시로 하드코딩하여 HTTP 완전 차단
  const httpsUrl = 'https://brandflow-backend-production-99ae.up.railway.app';
  console.log('🔒 강제 HTTPS URL 사용:', httpsUrl);
  return httpsUrl;
};

// 🚨 한글 역할명을 영어로 매핑 (백엔드 호환성)
const mapRoleToEnglish = (koreanRole) => {
  const roleMapping = {
    '슈퍼 어드민': 'super_admin',
    '대행사 어드민': 'agency_admin', 
    '대행사 직원': 'agency_staff',
    '클라이언트': 'client',
    '어드민': 'admin',
    '직원': 'staff',
    '관리자': 'admin'
  };
  
  const englishRole = roleMapping[koreanRole] || koreanRole;
  console.log('🔄 역할명 매핑:', koreanRole, '→', englishRole);
  return englishRole;
};

// 🚨 Railway 307 리다이렉트 우회: 선별적 trailing slash 추가
const fixRailwayUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Railway API 엔드포인트에 대해 선별적 trailing slash 처리
  if (url.includes('/api/') && url.includes('brandflow-backend')) {
    // 쿼리 파라미터가 있는 경우와 없는 경우 모두 처리
    const hasQuery = url.includes('?');
    const [baseUrl, queryString] = hasQuery ? url.split('?') : [url, ''];
    
    // 이미 trailing slash가 있거나 파일 확장자가 있으면 그대로 둠
    if (baseUrl.endsWith('/') || baseUrl.match(/\.[a-zA-Z0-9]+$/)) {
      return url;
    }
    
    // 🚨 특정 API는 trailing slash 없이 사용 (307 방지)
    const noTrailingSlashAPIs = [
      '/unread-count',
      '/login',
      '/approve',
      '/work-types'  // 🚨 GET /api/work-types → trailing slash 없이 사용
    ];
    
    // 🚨 특정 API는 trailing slash 필요 (클라이언트 목록 등)
    const requiresTrailingSlashAPIs = [
      '/users/clients/',
      '/campaigns/',
      '/users/'  // GET /api/users/ 목록
    ];
    
    // 🚨 숫자 ID가 포함된 users API도 trailing slash 제거 (PUT /api/users/1/ 방지)
    const hasUserIdPattern = /\/users\/\d+\/?$/.test(baseUrl);
    const shouldRemoveSlash = noTrailingSlashAPIs.some(api => baseUrl.includes(api)) || hasUserIdPattern;
    
    // 🚨 특정 API는 강제로 trailing slash 필요
    const forceTrailingSlash = requiresTrailingSlashAPIs.some(api => baseUrl.includes(api));
    
    const needsTrailingSlash = forceTrailingSlash || !shouldRemoveSlash;
    
    console.log('🔍 Railway URL 처리:', {
      originalUrl: url,
      baseUrl: baseUrl,
      hasQuery: hasQuery,
      shouldRemoveSlash: shouldRemoveSlash,
      forceTrailingSlash: forceTrailingSlash,
      needsTrailingSlash: needsTrailingSlash
    });
    
    if (needsTrailingSlash) {
      const fixedUrl = baseUrl + '/' + (hasQuery ? '?' + queryString : '');
      console.log('🚨 Railway 307 우회: trailing slash 추가:', url, '→', fixedUrl);
      return fixedUrl;
    } else {
      console.log('✅ trailing slash 생략 (307 방지):', url);
      return url;
    }
  }
  
  return url;
};

// 🚨 환경변수 기반 백엔드 URL (getBackendUrl은 getBackendURL과 동일)
const getBackendUrl = () => {
  return getBackendURL(); // 위에서 정의한 환경변수 기반 함수 사용
};

// 🔒 API 베이스 URL 설정 - getBackendURL()은 이미 HTTPS만 반환
const API_BASE_URL = getBackendURL();
console.log('✅ API_BASE_URL 설정 완료:', API_BASE_URL);

// 🔒 단순한 Fetch API 요청 처리
const createFetchRequest = async (method, url, data = null, config = {}) => {
  // URL 구성: 상대 경로만 API_BASE_URL과 결합
  let finalUrl;
  if (url?.startsWith('/')) {
    // 상대 경로 - API_BASE_URL과 결합
    finalUrl = API_BASE_URL + url;
    console.log('🔍 상대 경로 URL 구성:', url, '→', finalUrl);
  } else {
    // 절대 경로는 그대로 사용 (이미 HTTPS여야 함)
    finalUrl = url;
    console.log('🔍 절대 경로 URL 사용:', finalUrl);
  }
  
  // 쿼리 파라미터 추가
  if (config.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    const paramsString = searchParams.toString();
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + paramsString;
    console.log('🔍 쿼리 파라미터 추가:', paramsString);
  }
  
  // 헤더 설정 - UTF-8 인코딩 명시 (백엔드 JSON 파싱 오류 해결)
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8',
    'Accept-Charset': 'utf-8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'User-Agent': 'BrandFlow-Frontend/1.0',
    ...config.headers
  };
  
  // JWT 토큰 추가
  const token = localStorage.getItem('authToken');
  if (token && !finalUrl.includes('/auth/login')) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // 사용자 정보 쿼리 파라미터 추가 (중복 방지) - HTTP 차단 강화 + Railway 307 우회
  const userData = localStorage.getItem('user');
  if (userData && !finalUrl.includes('/auth/login')) {
    const user = JSON.parse(userData);
    // 이미 viewerId가 있는지 확인하여 중복 방지
    if (!finalUrl.includes('viewerId=')) {
      
      // 🚨 특정 API는 권한 파라미터 추가 시 404 발생으로 임시 제외
      const skipAuthParamsAPIs = [
        '/api/users',
        '/api/purchase-requests'
      ];
      
      const shouldSkipAuthParams = skipAuthParamsAPIs.some(api => finalUrl.includes(api));
      
      if (shouldSkipAuthParams) {
        console.log('🚨 권한 파라미터 스킵 (404 방지):', finalUrl);
      } else {
        const separator = finalUrl.includes('?') ? '&' : '?';
        // 한글 역할명을 영어로 매핑하여 URL 인코딩 문제 해결
        const englishRole = mapRoleToEnglish(user.role);
        const safeRole = encodeURIComponent(englishRole);
        const newParams = `${separator}viewerId=${user.id}&viewerRole=${safeRole}`;
        finalUrl += newParams;
        console.log('🔒 사용자 파라미터 추가:', {viewerId: user.id, originalRole: user.role, mappedRole: englishRole, encoded: safeRole, params: newParams});
        console.log('🔒 파라미터 추가 후 URL:', finalUrl);
        
        // URL 최종 검증 - HTTPS로 시작하는지 확인
        if (!finalUrl.startsWith('https://')) {
          console.error('🚨 비정상 URL 발견, 재구성 필요:', finalUrl);
        }
      }
    }
  }
  
  // 최종 URL 검증 및 로그
  console.log('🔒 최종 요청 URL:', finalUrl);
  
  // 요청 본문 JSON 직렬화
  let requestBody = null;
  if (data) {
    requestBody = JSON.stringify(data);
    console.log('📦 요청 본문 준비 완료, 길이:', requestBody.length);
  }
  
  try {
    const response = await fetch(finalUrl, {
      method: method.toUpperCase(),
      headers,
      body: requestBody
    });

    console.log('📡 응답 상태:', response.status, response.statusText);
  
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
    console.error('🚨 API 요청 실패:', error.message);
    throw error;
  }
};

// 🚨 실제 백엔드 API 메소드들 (목데이터 완전 제거)
const api = {
  get: (url, config = {}) => createFetchRequest('GET', url, null, config),
  post: (url, data, config = {}) => createFetchRequest('POST', url, data, config),
  put: (url, data, config = {}) => createFetchRequest('PUT', url, data, config),
  patch: (url, data, config = {}) => createFetchRequest('PATCH', url, data, config),
  delete: (url, config = {}) => createFetchRequest('DELETE', url, null, config),
  request: (config) => createFetchRequest(config.method || 'GET', config.url, config.data, config)
};

// 🚨 21개 API 엔드포인트 완전 정의 (목데이터 제거)
export const apiEndpoints = {
  // 사용자 관리
  users: {
    list: (config = {}) => api.get('/api/users/', config),
    create: (userData, config = {}) => api.post('/api/users/', userData, config),
    get: (id) => api.get(`/api/users/${id}/`),
    update: (id, userData, config = {}) => api.put(`/api/users/${id}`, userData, config), // trailing slash 제거
    delete: (id) => api.delete(`/api/users/${id}/`),
    clients: (config = {}) => api.get('/api/users/clients/', config)
  },
  
  // 캠페인 관리
  campaigns: {
    list: () => api.get('/api/campaigns/'),
    create: (campaignData) => api.post('/api/campaigns/', campaignData),
    get: (id) => api.get(`/api/campaigns/${id}/`),
    update: (id, campaignData) => api.put(`/api/campaigns/${id}/`, campaignData),
    delete: (id) => api.delete(`/api/campaigns/${id}/`),
    posts: (id) => api.get(`/api/campaigns/${id}/posts/`),
    financialSummary: (id) => api.get(`/api/campaigns/${id}/financial_summary/`)
  },
  
  // 인증
  auth: {
    login: (credentials) => api.post('/api/auth/login/', credentials),
    logout: () => api.post('/api/auth/logout/'),
    refresh: () => api.post('/api/auth/refresh/')
  },
  
  // 구매 요청
  purchaseRequests: {
    list: () => api.get('/api/purchase-requests/'),
    create: (requestData) => api.post('/api/purchase-requests/', requestData),
    get: (id) => api.get(`/api/purchase-requests/${id}/`),
    approve: (id, approvalData) => api.put(`/api/purchase-requests/${id}/approve/`, approvalData)
  },
  
  // 알림
  notifications: {
    list: () => api.get('/api/notifications/'),
    unreadCount: () => api.get('/api/notifications/unread-count'), // trailing slash 없음
    markRead: (id) => api.put(`/api/notifications/${id}/read/`),
    create: (notificationData) => api.post('/api/notifications/', notificationData)
  },
  
  // 대시보드 (새로 추가)
  dashboard: {
    main: () => api.get('/api/dashboard/'),
    simple: () => api.get('/api/dashboard-simple/'),
    performance: () => api.get('/api/performance-dashboard/'),
    security: () => api.get('/api/security-dashboard/')
  },
  
  // 검색 (새로 추가)
  search: {
    all: (query) => api.get('/api/search/', { params: { q: query } }),
    users: (query) => api.get('/api/search/users/', { params: { q: query } }),
    campaigns: (query) => api.get('/api/search/campaigns/', { params: { q: query } })
  },
  
  // 데이터 내보내기 (새로 추가)
  export: {
    campaigns: () => api.get('/api/export/campaigns/'),
    users: () => api.get('/api/export/users/'),
    reports: () => api.get('/api/export/reports/')
  },
  
  // 파일 관리
  files: {
    upload: (fileData) => api.post('/api/files/upload/', fileData),
    get: (id) => api.get(`/api/files/${id}/`)
  },
  
  // 회사 정보
  company: {
    logo: () => api.get('/api/company/logo/'),
    updateLogo: (logoData) => api.post('/api/company/logo/', logoData)
  },
  
  // 상품 관리
  products: {
    list: () => api.get('/api/products/'),
    create: (productData) => api.post('/api/products/', productData),
    get: (id) => api.get(`/api/products/${id}/`)
  },
  
  // 작업 유형
  workTypes: {
    list: () => api.get('/api/work-types'), // trailing slash 없음
    create: (workTypeData) => api.post('/api/work-types/', workTypeData)
  },
  
  // 성능 모니터링
  performance: {
    metrics: () => api.get('/api/performance/metrics/'),
    dashboard: () => api.get('/api/performance/dashboard/')
  },
  
  // 시스템 모니터링
  monitoring: {
    health: () => api.get('/api/monitoring/health/'),
    metrics: () => api.get('/api/monitoring/metrics/')
  },
  
  // 관리자 (새로 추가)
  admin: {
    stats: () => api.get('/api/admin/stats/'),
    users: () => api.get('/api/admin/users/'),
    settings: () => api.get('/api/admin/settings/')
  },
  
  // 캐시 (새로 추가)
  cache: {
    clear: () => api.delete('/api/cache/'),
    stats: () => api.get('/api/cache/stats/')
  },
  
  // 시스템 상태 (새로 추가)
  system: {
    health: () => api.get('/api/system/health/'),
    status: () => api.get('/api/system/status/')
  }
};

// 기존 코드 호환성을 위한 레거시 API
export const legacyAPI = {
  // 사용자
  getUsers: (config = {}) => apiEndpoints.users.list(config),
  createUser: (userData) => apiEndpoints.users.create(userData),
  updateUser: (id, userData) => apiEndpoints.users.update(id, userData),
  deleteUser: (id) => apiEndpoints.users.delete(id),
  
  // 캠페인  
  getCampaigns: () => apiEndpoints.campaigns.list(),
  createCampaign: (campaignData) => apiEndpoints.campaigns.create(campaignData),
  
  // 알림
  getNotifications: () => apiEndpoints.notifications.list(),
  getUnreadCount: () => apiEndpoints.notifications.unreadCount(),
  markAsRead: (id) => apiEndpoints.notifications.markRead(id),
  
  // 구매 요청
  getPurchaseRequests: () => apiEndpoints.purchaseRequests.list(),
  createPurchaseRequest: (requestData) => apiEndpoints.purchaseRequests.create(requestData),
  approvePurchaseRequest: (id, approvalData) => apiEndpoints.purchaseRequests.approve(id, approvalData),
  
  // 대시보드
  getDashboardData: () => apiEndpoints.dashboard.main(),
  
  // 검색
  search: (query) => apiEndpoints.search.all(query)
};

// 승인/반려 관련 API 함수들
export const approvalAPI = {
  // 업무(Post) 승인/반려
  approvePost: (postId, status, reason = '') => {
    return api.put(`/api/posts/${postId}/approve`, { 
      status, 
      rejectionReason: reason 
    });
  },

  // 발주요청 승인/반려
  approvePurchaseRequest: (requestId, status, adjustmentAmount = 0, adjustmentReason = '', paymentMemo = '') => {
    return api.put(`/api/purchase-requests/${requestId}/approve`, {
      status,
      adjustmentAmount,
      adjustmentReason,
      paymentMemo
    });
  },

  // 인센티브 승인/반려
  approveIncentive: (incentiveId, status, adjustmentAmount = 0, adjustmentReason = '', paymentMemo = '') => {
    return api.put(`/api/monthly-incentives/${incentiveId}/approve`, {
      status,
      adjustmentAmount,
      adjustmentReason,
      paymentMemo
    });
  }
};

export default api;