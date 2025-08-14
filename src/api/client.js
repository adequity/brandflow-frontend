// src/api/client.js
import axios from 'axios';

// Mock API 모드 (프로덕션에서 백엔드 없이 테스트)
const MOCK_MODE = !import.meta.env.DEV && true; // 프로덕션에서 Mock 사용

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:5002' // 개발환경
  : ''; // 프로덕션에서는 상대 경로 사용

// 확인용 로그(옵션)
console.log('[API_BASE]', API_BASE);

const api = axios.create({
  baseURL: API_BASE || undefined,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Mock 데이터
const mockData = {
  user: {
    id: 1,
    name: '슈퍼 어드민',
    email: 'sjim@sh-system.co.kr',
    role: '슈퍼 어드민',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  campaigns: [
    {
      id: 1,
      name: '테스트 캠페인',
      User: { name: '슈퍼 어드민' },
      posts: [
        {
          id: 1,
          title: '샘플 포스트',
          topicStatus: '주제 승인 대기',
          outlineStatus: null,
          publishedUrl: null
        }
      ]
    }
  ],
  users: [
    {
      id: 1,
      name: '슈퍼 어드민',
      email: 'sjim@sh-system.co.kr',
      role: '슈퍼 어드민'
    }
  ]
};

// Mock API 응답 생성
const mockResponse = (data) => Promise.resolve({ data });

// API 인터셉터 추가 (Mock 모드일 때)
if (MOCK_MODE) {
  api.interceptors.request.use(
    (config) => {
      console.log('[MOCK MODE] API 요청:', config.method?.toUpperCase(), config.url);
      
      // 로그인 API
      if (config.method === 'post' && config.url?.includes('/auth/login')) {
        const { email, password } = JSON.parse(config.data || '{}');
        if (email === 'sjim@sh-system.co.kr' && password === 'tjdgus66!') {
          return Promise.reject({ 
            response: { data: mockData.user, status: 200 },
            mockSuccess: true 
          });
        } else {
          return Promise.reject({ 
            response: { data: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, status: 401 }
          });
        }
      }
      
      // 캠페인 API
      if (config.method === 'get' && config.url?.includes('/campaigns')) {
        return Promise.reject({ 
          response: { data: mockData.campaigns, status: 200 },
          mockSuccess: true 
        });
      }
      
      // 사용자 API
      if (config.method === 'get' && config.url?.includes('/users')) {
        return Promise.reject({ 
          response: { data: mockData.users, status: 200 },
          mockSuccess: true 
        });
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.mockSuccess) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );
}

export default api;