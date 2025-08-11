import React, { useState } from 'react';
import api from '../api/client';  // ✅ 공통 클라이언트 (VITE_API_URL 사용)

<<<<<<< HEAD
const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // ⭐️ [디버깅] 보내기 직전의 이메일과 비밀번호를 브라우저 콘솔에 출력합니다.
        console.log('서버로 보내는 데이터:', { email, password });

        try {
            const response = await axios.post(${import.meta.env.VITE_API_URL}/api/auth/login', {
                email,
                password,
            });
            
            onLogin(response.data);

        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('로그인에 실패했습니다. 서버에 문제가 발생했을 수 있습니다.');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-600">BrandFlow</h1>
                    {/* ⭐️ [수정] 혼란을 줄 수 있는 문구를 "로그인"으로 변경합니다. */}
                    <p className="mt-2 text-gray-500">로그인</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="아이디 (이메일)"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="비밀번호"
                            />
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            로그인
                        </button>
                    </div>
                </form>
            </div>
=======
const Login = ({ onLogin, userType }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
     // 1) { user, token } 형태면 user 사용, 2) user 자체를 바로 주면 그대로 사용
       const token = data?.token;
       const user  = data?.user ?? data;   // ✅ 여기!

       if (token) localStorage.setItem('authToken', token);
       if (user?.id) {
         localStorage.setItem('user', JSON.stringify(user));
         onLogin?.(user);
       } else {
         setError(data?.message || '로그인 응답에 사용자 정보가 없습니다.');
       }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.'
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">BrandFlow</h1>
          <p className="mt-2 text-gray-500">{userType === 'admin' ? '관리자' : '클라이언트'} 로그인</p>
>>>>>>> dd5e4b41cd8be695d8646d5ea8a2410254a74641
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="아이디 (admin@test.com)"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="비밀번호 (1234)"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              로그인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;