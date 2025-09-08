// src/api/client.js
// 🚨 목데이터 완전 제거 - 실제 백엔드 연결만 사용

// 🚨 domains.js 의존성 완전 제거 - Railway HTTPS 하드코딩만 사용

// 🚨 HTTP 완전 차단: 모든 HTTP URL을 HTTPS로 강제 변환하는 함수
const forceHTTPS = (url) => {
  if (typeof url !== 'string') return url;
  
  // HTTP 프로토콜을 HTTPS로 강제 변환
  if (url.startsWith('http://')) {
    const httpsUrl = url.replace('http://', 'https://');
    console.error('🚨 HTTP URL 발견 → HTTPS 강제 변환:', url, '→', httpsUrl);
    return httpsUrl;
  }
  
  // brandflow-backend가 포함된 모든 URL을 Railway HTTPS로 통일
  if (url.includes('brandflow-backend') && !url.includes('https://brandflow-backend-production-99ae.up.railway.app')) {
    const railwayUrl = url.replace(/https?:\/\/[^\/]*brandflow-backend[^\/]*/, 'https://brandflow-backend-production-99ae.up.railway.app');
    console.error('🚨 brandflow-backend URL 발견 → Railway HTTPS로 강제 변환:', url, '→', railwayUrl);
    return railwayUrl;
  }
  
  // 🚨 Railway 307 리다이렉트 우회 적용
  return fixRailwayUrl(url);
};

// 🚨 완전한 HTTP 차단: 모든 HTTP URL을 HTTPS로 강제 변환
const RAILWAY_HTTPS_URL = 'https://brandflow-backend-production-99ae.up.railway.app';

// 🚨 환경변수 기반 백엔드 URL 설정
const getBackendURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  console.log('🔍 환경변수 VITE_API_BASE_URL:', envUrl);
  console.log('🔍 모든 환경변수:', import.meta.env);
  
  if (envUrl) {
    console.log('✅ 환경변수에서 백엔드 URL 로드:', envUrl);
    // 🚨 환경변수에서도 HTTP 체크
    if (envUrl.startsWith('http://')) {
      const httpsUrl = envUrl.replace('http://', 'https://');
      console.error('🚨 환경변수에서 HTTP 발견, HTTPS로 변환:', envUrl, '→', httpsUrl);
      return httpsUrl;
    }
    return envUrl;
  }
  
  // 환경변수가 없으면 기본값 (Railway)
  const defaultUrl = 'https://brandflow-backend-production-99ae.up.railway.app';
  console.log('⚠️ 환경변수 없음, 기본값 사용:', defaultUrl);
  return defaultUrl;
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
      '/users/',  // 🚨 PUT /api/users/1/ → /api/users/1 (trailing slash 제거)
      '/work-types'  // 🚨 GET /api/work-types → trailing slash 없이 사용
    ];
    
    // 🚨 숫자 ID가 포함된 users API도 trailing slash 제거 (PUT /api/users/1/ 방지)
    const hasUserIdPattern = /\/users\/\d+\/?$/.test(baseUrl);
    const shouldRemoveSlash = noTrailingSlashAPIs.some(api => baseUrl.includes(api)) || hasUserIdPattern;
    
    const needsTrailingSlash = !shouldRemoveSlash;
    
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

// 🚨 환경변수 기반 API 베이스 URL 설정
const API_BASE_URL = (() => {
  const baseUrl = getBackendURL();
  // 🚨 API_BASE_URL에서 강제 HTTPS 변환
  if (baseUrl && baseUrl.startsWith('http://')) {
    const httpsUrl = baseUrl.replace('http://', 'https://');
    console.error('🚨 API_BASE_URL HTTP → HTTPS 강제 변환:', baseUrl, '→', httpsUrl);
    return httpsUrl;
  }
  console.log('✅ API_BASE_URL 설정:', baseUrl);
  return baseUrl;
})();

// Mixed Content 완전 방지: HTTPS 강제 검증
if (!API_BASE_URL.startsWith('https://')) {
  console.error('🚨 HTTP URL 감지, HTTPS 강제 변환:', API_BASE_URL);
}

const API_BASE = API_BASE_URL;

// 확인용 로그
console.log('[API_BASE_URL]', API_BASE_URL);

// 백엔드 URL 확인 및 무조건 HTTPS 강제 변환
let backendUrl = API_BASE_URL; // 🚨 환경변수 기반 URL 사용
console.log('🔍 환경변수 기반 백엔드 URL 사용:', backendUrl);
// 🚨 추가 안전장치: HTTPS 강제 변환
if (backendUrl) {
  backendUrl = forceHTTPS(backendUrl);
  console.log('🔒 최종 HTTPS 강제 변환 적용:', backendUrl);
}

// 🚨 Fetch API로 모든 요청 처리 (목데이터 완전 제거)
const createFetchRequest = async (method, url, data = null, config = {}) => {
  // 무조건 HTTPS URL로 강제 변환 - 모든 경우 처리
  let finalUrl = url;
  
  // 🚨 완전한 HTTPS 강제 변환 로직 - 최고 강화 + Railway 307 우회 + 브라우저 캐시 우회
  if (url?.startsWith('/')) {
    // 상대 경로는 무조건 강제 HTTPS 베이스 사용 + trailing slash 자동 추가
    finalUrl = fixRailwayUrl(API_BASE_URL + url); // 🚨 환경변수 기반 URL 사용
    console.error('🚨 상대 경로 → Railway HTTPS 직접 변환:', url, '→', finalUrl);
    console.error('🔍 API_BASE_URL 값:', API_BASE_URL);
    console.error('🔍 최종 URL 확인:', finalUrl);
  } else {
    // 모든 절대 경로 URL에 대해 강제 Railway HTTPS 변환
    if (url?.includes('brandflow-backend') || url?.includes('localhost') || url?.includes('127.0.0.1')) {
      finalUrl = API_BASE_URL + (url.includes('/api/') ? url.substring(url.indexOf('/api/')) : '/api/users');
      finalUrl = fixRailwayUrl(finalUrl);
      console.error('🚨 brandflow-backend/localhost → Railway HTTPS 강제 변환:', url, '→', finalUrl);
    } else {
      // 그 외의 경우 forceHTTPS 적용
      finalUrl = forceHTTPS(url);
    }
  }
  
  // 🚨 쿼리 파라미터 처리 - HTTP 차단 강화 + Railway 307 우회
  if (config.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    const paramsString = searchParams.toString();
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + paramsString;
    console.log('🔒 쿼리 파라미터 추가:', config.params, '→', paramsString);
    
    // 파라미터 추가 후 HTTP 차단 + Railway 307 우회
    finalUrl = forceHTTPS(finalUrl);
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
        
        // 파라미터 추가 후 즉시 HTTPS 검증 및 Railway URL 강제 적용
        if (finalUrl.includes('http://') || !finalUrl.includes('https://')) {
          // HTTP 발견 시 즉시 Railway HTTPS로 교체
          const apiPath = finalUrl.includes('/api/') ? finalUrl.substring(finalUrl.indexOf('/api/')) : '/api/notifications/unread-count';
          finalUrl = API_BASE_URL + apiPath;
          console.error('🚨 파라미터 추가 후 HTTP/비정상 URL 발견, Railway HTTPS로 강제 교체:', finalUrl);
        }
      }
    }
  }
  
  // 🚨 파라미터 추가 후 HTTPS 강제 변환 + Railway 307 우회 - 모든 경우 처리
  finalUrl = forceHTTPS(finalUrl);
  console.log('🔒 파라미터 추가 후 HTTPS + Railway 307 우회 변환:', finalUrl);
  
  // 🚨 추가 안전장치: URL에서 모든 HTTP를 HTTPS로 강제 교체
  if (finalUrl.includes('http://')) {
    finalUrl = finalUrl.replace(/http:\/\//g, 'https://');
    console.error('🚨 HTTP 발견 및 HTTPS 강제 교체:', finalUrl);
  }
  
  // 🚨 최종 보안 검증 - HTTP 완전 차단
  if (finalUrl.includes('http://')) {
    const error = `🚨 보안 위반: HTTP URL 사용 금지 - ${method} ${finalUrl}`;
    console.error(error);
    throw new Error(error);
  }
  
  console.log(`🚨 FETCH ${method} 강제 HTTPS 검증 완료:`, finalUrl);
  
  // 🚨 한글 UTF-8 인코딩 처리 + 백엔드 JSON 파싱 오류 해결
  let requestBody = null;
  if (data) {
    try {
      requestBody = JSON.stringify(data, null, 0); // 압축된 JSON
      console.log('🚨 JSON 직렬화 성공, 길이:', requestBody.length);
      
      // UTF-8 바이트 검증
      const encoder = new TextEncoder();
      const bytes = encoder.encode(requestBody);
      console.log('🚨 UTF-8 바이트 길이:', bytes.length);
      
    } catch (jsonError) {
      console.error('🚨 JSON 직렬화 실패:', jsonError);
      throw new Error(`JSON 직렬화 오류: ${jsonError.message}`);
    }
  }
  
  const response = await fetch(finalUrl, {
    method: method.toUpperCase(),
    headers,
    body: requestBody,
    redirect: 'manual'  // 🚨 Railway 리디렉트 차단
  }).then(async (response) => {
    // 🚨 307 리디렉트 감지 및 HTTPS 강제 재요청
    if (response.status === 307 && response.headers.get('location')) {
      const redirectUrl = response.headers.get('location');
      console.error('🚨 307 리디렉트 감지:', redirectUrl);
      
      let httpsUrl = redirectUrl;
      // HTTP → HTTPS 강제 변환
      if (redirectUrl.startsWith('http://')) {
        httpsUrl = redirectUrl.replace('http://', 'https://');
        console.error('🚨 Railway HTTP 리디렉트 → HTTPS 강제 변환:', redirectUrl, '→', httpsUrl);
      }
      
      // Railway URL로 강제 변환 (추가 안전장치)
      if (httpsUrl.includes('brandflow-backend') && !httpsUrl.includes('https://brandflow-backend-production-99ae.up.railway.app')) {
        httpsUrl = httpsUrl.replace(/https?:\/\/[^\/]*brandflow-backend[^\/]*/, 'https://brandflow-backend-production-99ae.up.railway.app');
        console.error('🚨 Railway URL 강제 변환:', httpsUrl);
      }
      
      console.log('🔒 HTTPS 재요청 실행:', httpsUrl);
      return fetch(httpsUrl, { 
        method: method.toUpperCase(),
        headers,
        body: requestBody,
        redirect: 'manual'  // 재요청에서도 수동 리다이렉트 처리
      });
    }
    return response;
  }).catch(async (fetchError) => {
    // CORS 또는 네트워크 오류 감지 및 처리
    console.error('🚨 Fetch 오류 발생:', fetchError.message);
    console.error('🚨 Fetch 오류 타입:', fetchError.name);
    
    // CORS 오류 특별 처리
    if (fetchError.message?.includes('CORS') || 
        fetchError.message?.includes('Access-Control') ||
        fetchError.name === 'TypeError' && fetchError.message?.includes('Failed to fetch')) {
      const corsError = new Error('CORS 오류가 발생했습니다. 백엔드 서버 CORS 설정을 확인해주세요.');
      corsError.name = 'CORSError';
      corsError.isCORSError = true;
      throw corsError;
    }
    
    // 307 리다이렉트 또는 일반 네트워크 오류 시 HTTPS 재시도
    if (finalUrl.includes('brandflow-backend')) {
      const railwayUrl = 'https://brandflow-backend-production-99ae.up.railway.app' + 
                          (finalUrl.includes('/api/') ? finalUrl.substring(finalUrl.indexOf('/api/')) : '/api/users');
      console.error('🚨 Railway HTTPS URL로 재시도:', railwayUrl);
      
      try {
        return await fetch(railwayUrl, {
          method: method.toUpperCase(),
          headers,
          body: requestBody,
          redirect: 'manual'
        });
      } catch (retryError) {
        console.error('🚨 재시도도 실패:', retryError.message);
        // 재시도도 실패하면 원본 오류를 던짐
        throw fetchError;
      }
    }
    throw fetchError;
  });
  
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
    delete: (id) => api.delete(`/api/users/${id}/`)
  },
  
  // 캠페인 관리
  campaigns: {
    list: () => api.get('/api/campaigns/'),
    create: (campaignData) => api.post('/api/campaigns/', campaignData),
    get: (id) => api.get(`/api/campaigns/${id}/`),
    update: (id, campaignData) => api.put(`/api/campaigns/${id}/`, campaignData),
    delete: (id) => api.delete(`/api/campaigns/${id}/`)
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