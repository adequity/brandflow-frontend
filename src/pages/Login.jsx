// src/pages/Login.jsx
import React, { useState } from 'react';
import api from '../api/client'; // ✅ VITE_API_URL이 설정된 공통 axios 인스턴스

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
      // 서버가 { user, token } 을 주든, user만 주든 모두 대응
      const { data } = await api.post('/api/auth/login', { email, password });
      const token = data?.token;
      const user  = data?.user ?? data;

      if (token) {
        localStorage.setItem('authToken', token);
        // 선택: 이후 요청에 자동으로 토큰 붙이기
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      if (user?.id) {
        localStorage.setItem('user', JSON.stringify(user));
        onLogin?.(user);
      } else {
        setError(data?.message || '로그인 응답에 사용자 정보가 없습니다.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">BrandFlow</h1>
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
