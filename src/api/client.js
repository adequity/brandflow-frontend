// src/api/client.js
import axios from 'axios';

import { getBackendUrlByDomain } from '../config/domains.js';

// 환경변수 기반 백엔드 URL 설정 (유연한 배포 대응)
const getBackendUrl = () => {
  // 1순위: 환경변수에서 직접 지정된 URL
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🔧 환경변수에서 백엔드 URL 사용:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2순위: 개발 환경 자동 감지
  if (import.meta.env.DEV) {
    console.log('🔧 개발 환경 감지: Vite 프록시 사용');
    return ''; // Vite 프록시 사용
  }
  
  // 3순위: 도메인 기반 자동 매핑
  const hostname = window.location.hostname;
  return getBackendUrlByDomain(hostname);
};

// Mixed Content 완전 방지: HTTPS 강제 하드코딩
const API_BASE = 'https://brandflow-backend-production-99ae.up.railway.app';

// 확인용 로그(옵션)
console.log('[API_BASE]', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: { 
    'Content-Type': 'application/json',
    'Upgrade-Insecure-Requests': '1', // HTTPS 강제 요청
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // HTTPS 강제
  },
  timeout: 30000, // 30초 타임아웃
  maxRedirects: 0, // 리다이렉트 완전 차단
  validateStatus: function (status) {
    // 3xx 리다이렉트도 에러로 처리하여 HTTPS로 재시도
    return status >= 200 && status < 300;
  },
});

// 요청 인터셉터: JWT 토큰 및 사용자 권한 정보 자동 추가
api.interceptors.request.use(
  (config) => {
    try {
      // 🚨 Mixed Content 완전 차단: 모든 요청 HTTPS 강제 재작성
      
      // 1. baseURL을 무조건 HTTPS로 고정
      config.baseURL = 'https://brandflow-backend-production-99ae.up.railway.app';
      
      // 2. 절대 URL이 있다면 HTTPS로 강제 변환
      if (config.url && config.url.includes('://')) {
        if (config.url.includes('brandflow-backend-production-99ae.up.railway.app')) {
          config.url = config.url.replace('http://', 'https://');
          console.log('🚨 절대 URL 강제 HTTPS:', config.url);
        }
      }
      
      // 3. 최종 안전 체크: 혹시 남은 HTTP가 있다면 모두 HTTPS로
      const currentUrl = config.url || '';
      const currentBase = config.baseURL || '';
      
      if (currentUrl.includes('http://brandflow-backend') || currentBase.includes('http://brandflow-backend')) {
        config.baseURL = config.baseURL?.replace('http://', 'https://') || 'https://brandflow-backend-production-99ae.up.railway.app';
        config.url = config.url?.replace('http://', 'https://');
        console.log('🚨 최종 HTTP 제거:', config.baseURL + (config.url || ''));
      }
      
      // 로그인 요청에는 토큰을 추가하지 않음
      if (config.url?.includes('/auth/login/')) {
        return config;
      }
      
      // localStorage에서 JWT 토큰 가져오기
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // localStorage에서 사용자 정보 가져오기
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        
        // 쿼리 파라미터에 권한 정보 추가 (Korean characters URL encoded)
        if (config.method === 'get' || config.method === 'delete') {
          config.params = {
            ...config.params,
            viewerId: user.id,
            viewerRole: encodeURIComponent(user.role)
          };
        }
        
        // POST/PUT 요청의 경우 쿼리 파라미터로 추가 (Send Korean characters directly)
        if (config.method === 'post' || config.method === 'put') {
          config.params = {
            ...config.params,
            viewerId: user.id,
            viewerRole: user.role
          };
        }
      }
    } catch (error) {
      console.error('권한 정보 추가 중 오류:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 재시도 설정
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

// 재시도 가능한 에러인지 확인
const isRetryableError = (error) => {
  return (
    !error.response || // 네트워크 에러
    error.code === 'ECONNABORTED' || // 타임아웃
    error.response.status >= 500 || // 서버 에러
    error.response.status === 429 // Too Many Requests
  );
};

// 지연 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🚨 Mixed Content 완전 해결: fetch API 래퍼
const forcedHttpsFetch = async (url, config = {}) => {
  // 모든 HTTP를 HTTPS로 강제 변환
  let finalUrl = url;
  if (typeof url === 'string') {
    if (url.startsWith('http://brandflow-backend')) {
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
  // 무조건 HTTPS URL로 강제 변환
  let finalUrl = url;
  if (url?.startsWith('/')) {
    finalUrl = 'https://brandflow-backend-production-99ae.up.railway.app' + url;
  } else if (url?.includes('http://brandflow-backend')) {
    finalUrl = url.replace('http://', 'https://');
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
  
  // 사용자 정보 쿼리 파라미터 추가
  const userData = localStorage.getItem('user');
  if (userData && !finalUrl.includes('/auth/login')) {
    const user = JSON.parse(userData);
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${separator}viewerId=${user.id}&viewerRole=${encodeURIComponent(user.role)}`;
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

// API 유틸리티 함수들
api.withNoRetry = (config) => {
  return api({...config, _noRetry: true});
};

api.withTimeout = (timeout) => {
  return axios.create({
    ...api.defaults,
    timeout
  });
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