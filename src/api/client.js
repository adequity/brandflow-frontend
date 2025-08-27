// src/api/client.js
import axios from 'axios';

// API 백엔드 URL (실사용 Railway 서버)
const DEV_BACKEND_URL = ''; // Vite 프록시 사용 - 빈 문자열
const PROD_BACKEND_URL = 'https://brandflow-backend-production.up.railway.app';

const API_BASE = PROD_BACKEND_URL; // 실사용 Railway 백엔드 사용

// 확인용 로그(옵션)
console.log('[API_BASE]', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  headers: { 
    'Content-Type': 'application/json',
    'User-Agent': 'BrandFlow-Frontend/1.0'
  },
  timeout: 30000, // 30초 타임아웃
});

// 요청 인터셉터: JWT 토큰 및 사용자 권한 정보 자동 추가
api.interceptors.request.use(
  (config) => {
    try {
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

// 응답 인터셉터: 자동 재시도 및 에러 처리
api.interceptors.response.use(
  (response) => {
    // 성공 응답은 그대로 반환
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // 재시도 카운트 초기화
    if (!config.__retryCount) {
      config.__retryCount = 0;
    }
    
    // 재시도 가능한 에러이고 최대 재시도 횟수를 초과하지 않았으면 재시도
    if (
      isRetryableError(error) && 
      config.__retryCount < MAX_RETRIES &&
      !config._noRetry // 재시도 비활성화 플래그
    ) {
      config.__retryCount++;
      
      // 지연 시간 계산 (지수 백오프)
      const delayTime = RETRY_DELAY * Math.pow(2, config.__retryCount - 1);
      
      console.warn(
        `API 요청 실패 (${config.__retryCount}/${MAX_RETRIES}): ${config.url}`,
        `${delayTime}ms 후 재시도...`
      );
      
      await delay(delayTime);
      return api(config);
    }
    
    // 에러 로깅
    if (error.response) {
      // 404 알림 관련 에러는 조용히 처리
      const isNotificationAPI = error.config?.url?.includes('/notifications');
      const is404Error = error.response.status === 404;
      
      if (!(isNotificationAPI && is404Error)) {
        console.error('API 응답 에러:', {
          url: error.config?.url,
          status: error.response.status,
          data: error.response.data,
          retries: config.__retryCount || 0
        });
      }
    } else if (error.request) {
      console.error('API 요청 에러 (응답 없음):', {
        url: error.config?.url,
        message: error.message,
        retries: config.__retryCount || 0
      });
    } else {
      console.error('API 설정 에러:', {
        url: error.config?.url,
        message: error.message
      });
    }
    
    return Promise.reject(error);
  }
);

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