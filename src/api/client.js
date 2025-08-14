// src/api/client.js
import axios from 'axios';

// API 베이스 URL 설정
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:5002' // 개발환경
  : ''; // 프로덕션에서는 상대 경로 사용 (Netlify Functions)

// 확인용 로그(옵션)
console.log('[API_BASE]', API_BASE);

const api = axios.create({
  // API_BASE가 빈 문자열이면 undefined로 두는 게 안전
  baseURL: API_BASE || undefined,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // 필요 시 유지
});

export default api;