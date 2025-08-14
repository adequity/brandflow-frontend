// netlify/functions/api.js
const serverless = require('serverless-http');

// 간단한 API 핸들러
const express = require('express');
const cors = require('cors');

const app = express();

// CORS 설정
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// 기본 응답
app.get('/api', (req, res) => {
  res.json({ 
    message: 'BrandFlow API on Netlify Functions',
    timestamp: new Date().toISOString()
  });
});

// 로그인 API (임시)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // 하드코딩된 로그인 (테스트용)
  if (email === 'sjim@sh-system.co.kr' && password === 'tjdgus66!') {
    res.json({
      id: 1,
      name: '슈퍼 어드민',
      email: 'sjim@sh-system.co.kr',
      role: '슈퍼 어드민',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } else {
    res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
});

// 캠페인 목록 API (임시)
app.get('/api/campaigns', (req, res) => {
  res.json([
    {
      id: 1,
      name: '테스트 캠페인',
      User: { name: '슈퍼 어드민' },
      posts: []
    }
  ]);
});

// 사용자 목록 API (임시)
app.get('/api/users', (req, res) => {
  res.json([
    {
      id: 1,
      name: '슈퍼 어드민',
      email: 'sjim@sh-system.co.kr',
      role: '슈퍼 어드민'
    }
  ]);
});

// 404 처리
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

module.exports.handler = serverless(app);