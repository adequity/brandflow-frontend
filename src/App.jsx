import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import { OrderProvider } from './contexts/OrderContext';

// 각 UI 레이아웃과 로그인 페이지를 import 합니다.
import LazyRoutes from './components/LazyRoutes';
import Login from './pages/Login';

export default function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // 앱 시작 시, localStorage에서 사용자 정보를 읽어와 로그인 상태를 복원합니다.
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("사용자 정보 파싱 오류:", error);
            localStorage.removeItem('user');
        }
        setIsLoading(false);
    }, []);

    // 로그인 처리 함수
    const handleLogin = (loggedInUser) => {
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        // 로그인 성공 후, 역할에 따라 적절한 대시보드로 이동시킵니다.
        if (loggedInUser.role === '클라이언트') {
            navigate('/client/dashboard');
        } else {
            navigate('/admin/dashboard');
        }
    };

    // 로그아웃 처리 함수
    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login'); // 로그아웃 후 로그인 페이지로 이동
    };

    // 사용자 정보를 읽어오는 동안 로딩 화면을 보여줍니다.
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">세션 확인 중...</div>;
    }

    return (
        <NotificationProvider>
            <ToastProvider>
                <OrderProvider>
                <Routes>
                {/* 로그인 페이지 경로 */}
                <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />

                {/* 관리자 페이지 경로 */}
                <Route 
                    path="/admin/*" 
                    element={user && user.role !== '클라이언트' ? <LazyRoutes.AdminUI user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
                />

                {/* 클라이언트 페이지 경로 */}
                <Route 
                    path="/client/*" 
                    element={user && user.role === '클라이언트' ? <LazyRoutes.ClientUI user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
                />

                {/* 루트 경로 처리 */}
                <Route 
                    path="/" 
                    element={
                        !user ? <Navigate to="/login" /> : 
                        user.role === '클라이언트' ? <Navigate to="/client/dashboard" /> : 
                        <Navigate to="/admin/dashboard" />
                    } 
                />
                </Routes>
                </OrderProvider>
            </ToastProvider>
        </NotificationProvider>
    );
}
