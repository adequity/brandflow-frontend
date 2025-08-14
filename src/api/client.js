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

export default api;