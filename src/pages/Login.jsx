// src/pages/Login.jsx
import React, { useState } from 'react';
import api from '../api/client'; // ✅ VITE_API_URL이 설정된 공통 axios 인스턴스
import LogoDisplay from '../components/LogoDisplay';

const Login = ({ onLogin, userType = 'admin' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setLoading(true);

    try {
      // Express API 로그인
      console.log('로그인 시도:', { email, password });
      console.log('API Base URL:', api.defaults.baseURL);
      
      const { data } = await api.post('/api/auth/login', { email, password });
      console.log('로그인 응답:', data);
      
      // Express API는 사용자 정보를 직접 반환
      if (data?.id) {
        // 간단한 토큰 생성 (Express 백엔드가 JWT를 사용하지 않으므로)
        const simpleToken = btoa(`${data.id}:${data.email}:${Date.now()}`);
        localStorage.setItem('authToken', simpleToken);
        
        // 사용자 정보 저장 (Express API 구조에 맞게)
        const userInfo = {
          id: data.id,
          name: data.name || data.username || '',
          email: data.email,
          role: data.role || '클라이언트',
          company: data.company || '',
          contact: data.contact || '',
          incentiveRate: data.incentiveRate || 0
        };
        
        localStorage.setItem('user', JSON.stringify(userInfo));
        console.log('사용자 정보 저장 완료:', userInfo);
        
        onLogin?.(userInfo);
      } else {
        setError('로그인 응답에 필요한 정보가 없습니다.');
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      console.error('응답 데이터:', err?.response?.data);
      console.error('상태 코드:', err?.response?.status);
      
      let errorMessage = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
      
      if (err?.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.non_field_errors) {
          errorMessage = err.response.data.non_field_errors[0];
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <LogoDisplay size="large" />
          </div>
          <p className="mt-2 text-gray-500">
            {userType === 'admin' ? '관리자' : '클라이언트'} 로그인
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="아이디 (이메일)"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? '로그인 중…' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
