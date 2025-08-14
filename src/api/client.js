// src/api/client.js
import axios from 'axios';

// Render 백엔드 URL
const RENDER_BACKEND_URL = 'https://brandflow-backend.onrender.com';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:5002' // 개발환경
  : RENDER_BACKEND_URL; // 프로덕션에서는 Render 백엔드 사용

// 확인용 로그(옵션)
console.log('[API_BASE]', API_BASE);

const api = axios.create({
  baseURL: API_BASE || undefined,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// 요청 인터셉터: 모든 API 호출에 사용자 권한 정보 자동 추가
api.interceptors.request.use(
  (config) => {
    try {
      // localStorage에서 사용자 정보 가져오기
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        
        // 쿼리 파라미터에 권한 정보 추가
        if (config.method === 'get' || config.method === 'delete') {
          config.params = {
            ...config.params,
            viewerId: user.id,
            viewerRole: user.role
          };
        }
        
        // POST/PUT 요청의 경우 쿼리 파라미터로 추가
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

export default api;