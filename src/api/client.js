// src/api/client.js
// 🚨 axios 완전 제거

import { getBackendUrlByDomain } from '../config/domains.js';

// 환경변수 기반 백엔드 URL 설정 (유연한 배포 대응)
const getBackendUrl = () => {
  // 1순위: 환경변수에서 직접 지정된 URL
  let backendUrl = import.meta.env.VITE_API_BASE_URL;
  if (backendUrl) {
    console.log('🔧 환경변수에서 백엔드 URL 사용:', backendUrl);
    // Mixed Content 방지: 강제 HTTPS 변환
    if (backendUrl.startsWith('http://')) {
      backendUrl = backendUrl.replace('http://', 'https://');
      console.log('🔒 환경변수 URL HTTP → HTTPS 강제 변환:', backendUrl);
    }
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
  
  // Mixed Content 방지: 도메인 매핑에서도 강제 HTTPS 변환
  if (domainUrl && domainUrl.startsWith('http://')) {
    const httpsUrl = domainUrl.replace('http://', 'https://');
    console.log('🔒 도메인 매핑 URL HTTP → HTTPS 강제 변환:', httpsUrl);
    return httpsUrl;
  }
  
  return domainUrl;
};

// Mixed Content 완전 방지: HTTPS 강제 하드코딩
const API_BASE = 'https://brandflow-backend-production-99ae.up.railway.app';

// 확인용 로그(옵션)
console.log('[API_BASE]', API_BASE);

// 🚨 axios 완전 제거 - 순수 객체로 대체
const api = {};

// 🚨 axios 인터셉터 완전 제거

// 🚨 재시도 로직 완전 제거

// 🚨 Mixed Content 완전 해결: fetch API 래퍼
const forcedHttpsFetch = async (url, config = {}) => {
  // 모든 HTTP를 HTTPS로 강제 변환
  let finalUrl = url;
  if (typeof url === 'string') {
    if (url.startsWith('http://')) {
      finalUrl = url.replace('http://', 'https://');
      console.log('🚨 Fetch HTTP → HTTPS 강제 변환:', finalUrl);
    } else if (url.startsWith('http://brandflow-backend')) {
      finalUrl = url.replace('http://', 'https://');
      console.log('🚨 Fetch HTTP → HTTPS:', finalUrl);
    } else if (url.startsWith('/')) {
      finalUrl = 'https://brandflow-backend-production-99ae.up.railway.app' + url;
      console.log('🚨 Fetch 상대 URL → HTTPS:', finalUrl);
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
  
  // 모든 HTTP URL을 HTTPS로 강제 변환
  if (url?.startsWith('http://')) {
    finalUrl = url.replace('http://', 'https://');
    console.log('🔒 createFetchRequest HTTP → HTTPS 강제 변환:', finalUrl);
  } else if (url?.startsWith('/')) {
    finalUrl = 'https://brandflow-backend-production-99ae.up.railway.app' + url;
  } else if (url?.includes('brandflow-backend')) {
    // HTTP든 HTTPS든 상관없이 brandflow-backend가 포함된 모든 URL을 HTTPS로 강제
    finalUrl = url.replace(/https?:\/\/brandflow-backend/, 'https://brandflow-backend');
  } else {
    // 완전한 URL이 아닌 경우 HTTPS 베이스 추가
    finalUrl = 'https://brandflow-backend-production-99ae.up.railway.app' + (url.startsWith('/') ? url : '/' + url);
  }
  
  // 쿼리 파라미터 처리
  if (config.params) {
    const searchParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    finalUrl += (finalUrl.includes('?') ? '&' : '?') + searchParams.toString();
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
  
  // 사용자 정보 쿼리 파라미터 추가 (중복 방지)
  const userData = localStorage.getItem('user');
  if (userData && !finalUrl.includes('/auth/login')) {
    const user = JSON.parse(userData);
    // 이미 viewerId가 있는지 확인하여 중복 방지
    if (!finalUrl.includes('viewerId=')) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${separator}viewerId=${user.id}&viewerRole=${encodeURIComponent(user.role)}`;
    }
  }
  
  console.log(`🚨 FETCH ${method} 강제 HTTPS:`, finalUrl);
  
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