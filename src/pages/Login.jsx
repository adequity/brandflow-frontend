// src/pages/Login.jsx
import React, { useState } from 'react';
import api from '../api/client'; // ✅ fetch API 기반 공통 클라이언트
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
      // FastAPI 로그인 - JSON 형태로 전송
      console.log('로그인 시도:', { email, password: '***' });
      console.log('API Base URL: HTTPS만 사용');
      
      const { data } = await api.post('/api/auth/login-json', { email, password });
      console.log('로그인 응답:', data);
      
      // FastAPI는 access_token과 user 정보를 함께 반환
      if (data && data.access_token && data.user) {
        // JWT 토큰 저장
        localStorage.setItem('authToken', data.access_token);
        // 사용자 정보 저장
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('로그인 성공:', { token: data.access_token.substring(0, 20) + '...', user: data.user });
        
        onLogin?.(data.user);
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-neutral-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main login card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-elegant border border-white/20 p-8 space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <LogoDisplay size="large" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              BrandFlow에 오신 것을 환영합니다
            </h1>
            <p className="mt-3 text-neutral-600 font-medium">
              {userType === 'admin' ? '관리자' : '클라이언트'} 계정으로 로그인하세요
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400 text-neutral-800"
                  placeholder="이메일 주소"
                />
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-neutral-400 text-neutral-800"
                  placeholder="비밀번호"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 text-center font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-xl shadow-elegant hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-neutral-500">
              계정에 문제가 있으신가요?{' '}
              <span className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium">
                관리자에게 문의하세요
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
