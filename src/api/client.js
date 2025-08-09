// src/api/client.js
import axios from 'axios';

// Netlify 환경변수 (마지막 슬래시 제거)
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE,            // 예: https://brandflow-backend.onrender.com
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },console.log('[API_BASE]', import.meta.env.VITE_API_URL);
});

export default api;
