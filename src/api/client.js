// src/api/client.js
// 🚨 axios 완전 제거

import { getBackendUrlByDomain } from '../config/domains.js';

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
  
  return url;
};

// 환경변수 기반 백엔드 URL 설정 (유연한 배포 대응)
const getBackendUrl = () => {
  // 1순위: 환경변수에서 직접 지정된 URL - 무조건 HTTPS 강제
  let backendUrl = import.meta.env.VITE_API_BASE_URL;
  if (backendUrl) {
    console.log('🔧 환경변수에서 백엔드 URL 사용:', backendUrl);
    // 🚨 무조건 HTTPS 강제 변환
    backendUrl = forceHTTPS(backendUrl);
    console.log('🔒 환경변수 URL HTTPS 강제 적용 완료:', backendUrl);
    return backendUrl;
  }
  
  // 2순위: 개발 환경 자동 감지
  if (import.meta.env.DEV) {
    console.log('🔧 개발 환경 감지: Vite 프록시 사용');
    return ''; // Vite 프록시 사용
  }
  
  // 3순위: 도메인 기반 자동 매핑
  const hostname = window.location.hostname;
  const domainUrl = getBackendUrlByDomain(hostname);
  
  // 🚨 도메인 매핑에서도 무조건 HTTPS 강제 변환
  if (domainUrl) {
    const httpsUrl = forceHTTPS(domainUrl);
    console.log('🔒 도메인 매핑 URL HTTPS 강제 적용:', httpsUrl);
    return httpsUrl;
  }
  
  return domainUrl;
};

// Mixed Content 완전 방지: HTTPS 강제 하드코딩
const API_BASE = 'https://brandflow-backend-production-99ae.up.railway.app';

// 🚨 HTTP 완전 차단: 환경변수에서 HTTP URL이 들어와도 HTTPS로 강제 변환
const FORCE_HTTPS_API_BASE = (() => {
  let baseUrl = import.meta.env.VITE_API_BASE_URL || API_BASE;
  if (baseUrl.startsWith('http://')) {
    console.error('🚨 환경변수에서 HTTP URL 발견, HTTPS로 강제 변환:', baseUrl);
    baseUrl = baseUrl.replace('http://', 'https://');
  }
  return baseUrl;
})();

// 확인용 로그(옵션)
console.log('[FORCE_HTTPS_API_BASE]', FORCE_HTTPS_API_BASE);

// 백엔드 URL 확인 및 무조건 HTTPS 강제 변환
let backendUrl = getBackendUrl();
console.log('🔍 getBackendUrl() 결과:', backendUrl);
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
  
  // 헤더 설정
  const headers = {
    'Content-Type': 'application/json',
    ...config.headers
  };
  
  // JWT 토큰 추가
  const token = localStorage.getItem('authToken');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return fetch(finalUrl, {
    ...config,
    headers
  });
};

// 🚨 Axios 완전 대체: fetch API로 모든 요청 처리
const createFetchRequest = async (method, url, data = null, config = {}) => {
  // 무조건 HTTPS URL로 강제 변환 - 모든 경우 처리
  let finalUrl = url;
  
  // 🚨 완전한 HTTPS 강제 변환 로직 - 최고 강화
  if (url?.startsWith('/')) {
    // 상대 경로는 무조건 강제 HTTPS 베이스 사용
    finalUrl = FORCE_HTTPS_API_BASE + url;
  } else {
    // 모든 절대 경로 URL에 대해 forceHTTPS 적용
    finalUrl = forceHTTPS(url);
    // 추가로 FORCE_HTTPS_API_BASE 강제 적용
    if (finalUrl?.includes('brandflow-backend')) {
      finalUrl = finalUrl.replace(/https?:\/\/[^\/]*brandflow-backend[^\/]*/, FORCE_HTTPS_API_BASE);
      console.error('🚨 createFetchRequest: brandflow-backend URL → Railway HTTPS 강제 변환:', finalUrl);
    }
  }
  
  // 🚨 쿼리 파라미터 처리 - HTTP 차단 강화
  if (config.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    const paramsString = searchParams.toString();
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + paramsString;
    console.log('🔒 쿼리 파라미터 추가:', config.params, '→', paramsString);
    
    // 파라미터 추가 후 HTTP 차단
    finalUrl = forceHTTPS(finalUrl);
  }
  
  // 헤더 설정
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'BrandFlow-Frontend/1.0',
    ...config.headers
  };
  
  // JWT 토큰 추가
  const token = localStorage.getItem('authToken');
  if (token && !finalUrl.includes('/auth/login')) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // 사용자 정보 쿼리 파라미터 추가 (중복 방지) - HTTP 차단 강화
  const userData = localStorage.getItem('user');
  if (userData && !finalUrl.includes('/auth/login')) {
    const user = JSON.parse(userData);
    // 이미 viewerId가 있는지 확인하여 중복 방지
    if (!finalUrl.includes('viewerId=')) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      const safeRole = encodeURIComponent(user.role);
      finalUrl += `${separator}viewerId=${user.id}&viewerRole=${safeRole}`;
      console.log('🔒 사용자 파라미터 추가:', {viewerId: user.id, viewerRole: user.role, encoded: safeRole});
    }
  }
  
  // 🚨 파라미터 추가 후 HTTPS 강제 변환 - 모든 경우 처리
  finalUrl = forceHTTPS(finalUrl);
  console.log('🔒 파라미터 추가 후 HTTPS 강제 변환:', finalUrl);
  
  // 🚨 최종 보안 검증 - HTTP 완전 차단
  if (finalUrl.includes('http://')) {
    const error = `🚨 보안 위반: HTTP URL 사용 금지 - ${method} ${finalUrl}`;
    console.error(error);
    throw new Error(error);
  }
  
  console.log(`🚨 FETCH ${method} 강제 HTTPS 검증 완료:`, finalUrl);
  
  const response = await fetch(finalUrl, {
    method: method.toUpperCase(),
    headers,
    body: data ? JSON.stringify(data) : null
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const responseData = await response.json();
  return { data: responseData, status: response.status, headers: response.headers };
};

// Axios 메소드 완전 대체
api.get = (url, config = {}) => createFetchRequest('GET', url, null, config);
api.post = (url, data, config = {}) => createFetchRequest('POST', url, data, config);
api.put = (url, data, config = {}) => createFetchRequest('PUT', url, data, config);
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