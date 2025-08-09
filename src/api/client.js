// src/api/client.js
import axios from 'axios';

// Netlify 환경변수(마지막 / 제거)
const API_BASE =
  (import.meta.env.VITE_API_URL || '')
    .replace(/\/$/, '')                                   // 끝 슬래시 제거
  || (import.meta.env.DEV ? 'http://localhost:5000' : ''); // 로컬 개발용 fallback

// 확인용 로그(옵션)
console.log('[API_BASE]', API_BASE);

const api = axios.create({
  // API_BASE가 빈 문자열이면 undefined로 두는 게 안전
  baseURL: API_BASE || undefined,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // 필요 시 유지
});

export default api;