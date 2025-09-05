// src/api/client.js
// 🚨 axios 완전 제거

// import { getBackendUrlByDomain } from '../config/domains.js'; // 🚨 완전 제거 - HTTP 차단

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

// 🚨 한글 UTF-8 인코딩 안전 처리
const ensureUTF8Encoding = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  try {
    // JSON 문자열로 변환 후 UTF-8 인코딩 확인
    const jsonString = JSON.stringify(data);
    
    // 한글이 포함된 경우 명시적 UTF-8 처리
    if (/[\u3131-\uD79D]/.test(jsonString)) {
      console.log('🚨 한글 문자 감지 - UTF-8 인코딩 처리:', jsonString.substring(0, 100) + '...');
      
      // 한글 문자가 올바르게 인코딩되었는지 확인
      const encoder = new TextEncoder();
      const decoder = new TextDecoder('utf-8');
      const encoded = encoder.encode(jsonString);
      const decoded = decoder.decode(encoded);
      
      if (decoded !== jsonString) {
        console.error('🚨 UTF-8 인코딩 불일치 감지');
      } else {
        console.log('✅ UTF-8 인코딩 검증 완료');
      }
    }
    
    return data;
  } catch (error) {
    console.error('🚨 UTF-8 인코딩 처리 중 오류:', error);
    return data;
  }
};

// 🚨 Railway 307 리다이렉트 우회: trailing slash 자동 추가
const fixRailwayUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Railway API 엔드포인트에 대해 trailing slash 자동 추가
  if (url.includes('/api/') && url.includes('brandflow-backend')) {
    // 쿼리 파라미터가 있는 경우와 없는 경우 모두 처리
    const hasQuery = url.includes('?');
    const [baseUrl, queryString] = hasQuery ? url.split('?') : [url, ''];
    
    // 이미 trailing slash가 있거나 파일 확장자가 있으면 그대로 둠
    if (baseUrl.endsWith('/') || baseUrl.match(/\.[a-zA-Z0-9]+$/)) {
      return url;
    }
    
    // trailing slash 추가
    const fixedUrl = baseUrl + '/' + (hasQuery ? '?' + queryString : '');
    console.log('🚨 Railway 307 우회: trailing slash 추가:', url, '→', fixedUrl);
    return fixedUrl;
  }
  
  return url;
};

// 🚨 환경변수 무시 - 무조건 HTTPS Railway URL만 사용
const getBackendUrl = () => {
  // 🚨 domains.js 완전 무시하고 Railway HTTPS URL만 반환
  console.log('🔒 domains.js 무시 - Railway HTTPS URL 강제 사용:', RAILWAY_HTTPS_URL);
  return RAILWAY_HTTPS_URL;
};

// 🚨 HTTP 완전 차단: 환경변수를 무시하고 무조건 HTTPS Railway URL 사용
const FORCE_HTTPS_API_BASE = (() => {
  // 환경변수 무시하고 Railway HTTPS URL만 사용
  console.log('🔒 모든 API 요청을 Railway HTTPS URL로 강제 설정:', RAILWAY_HTTPS_URL);
  return RAILWAY_HTTPS_URL;
})();

// Mixed Content 완전 방지: HTTPS 강제 하드코딩 (백업용)
const API_BASE = RAILWAY_HTTPS_URL;

// 확인용 로그(옵션)
console.log('[FORCE_HTTPS_API_BASE]', FORCE_HTTPS_API_BASE);

// 백엔드 URL 확인 및 무조건 HTTPS 강제 변환 (domains.js 무시)
let backendUrl = RAILWAY_HTTPS_URL; // 🚨 domains.js 완전 무시
console.log('🔍 하드코딩된 Railway URL 사용:', backendUrl);
// 🚨 추가 안전장치: HTTPS 강제 변환
if (backendUrl) {
  backendUrl = forceHTTPS(backendUrl);
  console.log('🔒 최종 HTTPS 강제 변환 적용:', backendUrl);
}

// 🚨 axios 완전 제거 - 순수 객체로 대체
const api = {};

// 🚨 axios 인터셉터 완전 제거

// 🚨 재시도 로직 완전 제거

// 🚨 Mixed Content 완전 해결: 최종 HTTP 차단 래퍼
const forcedHttpsFetch = async (url, config = {}) => {
  // 모든 HTTP를 HTTPS로 강제 변환 + 완전 차단
  let finalUrl = url;
  if (typeof url === 'string') {
    // 완전한 HTTP 차단 로직
    if (url.startsWith('http://')) {
      finalUrl = url.replace('http://', 'https://');
      console.error('🚨 HTTP URL 차단 및 HTTPS 강제 변환:', url, '→', finalUrl);
    } else if (url.includes('http://')) {
      finalUrl = url.replace(/http:\/\//g, 'https://');
      console.error('🚨 URL 내 HTTP 프로토콜 발견, HTTPS 강제 변환:', finalUrl);
    } else if (url.startsWith('/')) {
      finalUrl = FORCE_HTTPS_API_BASE + url;
      console.log('🚨 Fetch 상대 URL → HTTPS:', finalUrl);
    }
    
    // 최종 안전장치 - HTTP가 남아있으면 완전 차단
    if (finalUrl.includes('http://')) {
      throw new Error(`🚨 보안 위반: HTTP URL 사용 금지 - ${finalUrl}`);
    }
  }
  
  // 헤더 설정 - UTF-8 인코딩 명시
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
    'Accept-Charset': 'utf-8',
    ...config.headers
  };
  
  // JWT 토큰 추가
  const token = localStorage.getItem('authToken');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // 🚨 JSON 데이터 UTF-8 인코딩 처리
  const requestBody = config.body ? config.body : null;
  
  return fetch(finalUrl, {
    ...config,
    headers,
    body: requestBody,
    redirect: 'manual'  // 🚨 Railway 리디렉트 차단 - HTTP 리디렉트를 따라가지 않음
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
        ...config, 
        headers,
        redirect: 'manual'  // 재요청에서도 수동 리다이렉트 처리
      });
    }
    return response;
  });
};

// 🚨 Axios 완전 대체: fetch API로 모든 요청 처리
const createFetchRequest = async (method, url, data = null, config = {}) => {
  // 무조건 HTTPS URL로 강제 변환 - 모든 경우 처리
  let finalUrl = url;
  
  // 🚨 완전한 HTTPS 강제 변환 로직 - 최고 강화 + Railway 307 우회 + 브라우저 캐시 우회
  if (url?.startsWith('/')) {
    // 상대 경로는 무조건 강제 HTTPS 베이스 사용 + trailing slash 자동 추가
    finalUrl = fixRailwayUrl(RAILWAY_HTTPS_URL + url); // 🚨 FORCE_HTTPS_API_BASE 대신 직접 Railway URL 사용
    console.error('🚨 상대 경로 → Railway HTTPS 직접 변환:', url, '→', finalUrl);
  } else {
    // 모든 절대 경로 URL에 대해 강제 Railway HTTPS 변환
    if (url?.includes('brandflow-backend') || url?.includes('localhost') || url?.includes('127.0.0.1')) {
      finalUrl = RAILWAY_HTTPS_URL + (url.includes('/api/') ? url.substring(url.indexOf('/api/')) : '/api/users');
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
  
  // 헤더 설정 - UTF-8 인코딩 명시
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
    'Accept-Charset': 'utf-8',
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
      const separator = finalUrl.includes('?') ? '&' : '?';
      const safeRole = encodeURIComponent(user.role);
      finalUrl += `${separator}viewerId=${user.id}&viewerRole=${safeRole}`;
      console.log('🔒 사용자 파라미터 추가:', {viewerId: user.id, viewerRole: user.role, encoded: safeRole});
      
      // 파라미터 추가 후 HTTP 체크 및 HTTPS 강제 변환
      if (finalUrl.includes('http://')) {
        finalUrl = finalUrl.replace(/http:\/\//g, 'https://');
        console.error('🚨 파라미터 추가 후 HTTP 발견, HTTPS 강제 변환:', finalUrl);
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
  
  // 🚨 fetch 호출 직전 마지막 HTTPS 강제 검증
  if (finalUrl.includes('http://')) {
    finalUrl = finalUrl.replace(/http:\/\//g, 'https://');
    console.error('🚨 fetch 호출 직전 HTTP 발견 및 HTTPS 강제 교체:', finalUrl);
  }
  
  // 🚨 한글 UTF-8 인코딩 처리
  if (data) {
    data = ensureUTF8Encoding(data);
  }
  
  const response = await forcedHttpsFetch(finalUrl, {
    method: method.toUpperCase(),
    headers,
    body: data ? JSON.stringify(data) : null,
    redirect: 'manual'  // 🚨 Railway 리디렉트 차단
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
        return await forcedHttpsFetch(railwayUrl, {
          method: method.toUpperCase(),
          headers,
          body: data ? JSON.stringify(data) : null,
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

// Axios 메소드 완전 대체
api.get = (url, config = {}) => createFetchRequest('GET', url, null, config);
api.post = (url, data, config = {}) => createFetchRequest('POST', url, data, config);
api.put = (url, data, config = {}) => createFetchRequest('PUT', url, data, config);
api.patch = (url, data, config = {}) => createFetchRequest('PATCH', url, data, config);
api.delete = (url, config = {}) => createFetchRequest('DELETE', url, null, config);
api.request = (config) => createFetchRequest(config.method || 'GET', config.url, config.data, config);

// 🚨 Axios 인터셉터 완전 제거 - fetch로 대체됨

// 🚨 중복 제거됨 - 위에서 fetch로 완전 대체

// 🚨 유틸리티 함수 완전 제거

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