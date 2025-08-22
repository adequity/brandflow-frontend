// 임시 로그인 디버그 컴포넌트
import React, { useState } from 'react';
import api from '../api/client';

const LoginDebug = () => {
  const [result, setResult] = useState('');
  
  const testLogin = async () => {
    try {
      console.log('API Base URL:', api.defaults.baseURL);
      
      const response = await api.post('/api/auth/login/', {
        email: 'admin@brandflow.com',
        password: 'admin123'
      });
      
      setResult(JSON.stringify(response.data, null, 2));
      console.log('로그인 성공:', response.data);
    } catch (error) {
      console.error('로그인 실패:', error);
      setResult('Error: ' + (error.response?.data?.detail || error.message));
    }
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Django API 로그인 테스트</h2>
      <button onClick={testLogin}>로그인 테스트</button>
      <pre style={{ background: '#f5f5f5', padding: '10px', marginTop: '10px' }}>
        {result}
      </pre>
    </div>
  );
};

export default LoginDebug;