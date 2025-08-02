import React, { useState, useEffect } from 'react';

// 분리된 UI 컴포넌트와 로그인 페이지를 import 합니다.
import AdminUI from './pages/AdminUI';
import ClientUI from './pages/ClientUI';
import Login from './pages/Login';

export default function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
        // 로그인 시 서버에서 받아온 사용자 정보(role 포함)를 그대로 사용합니다.
        // 임시 등급 부여 로직을 제거하여, 실제 DB의 role 값을 신뢰합니다.
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
    };

    // 로그아웃 처리 함수
    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    // 사용자 정보를 읽어오는 동안 로딩 화면을 보여줍니다.
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">세션 확인 중...</div>;
    }

    // 로그인하지 않은 경우, 로그인 페이지를 보여줍니다.
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    // 로그인한 사용자의 실제 role에 따라 다른 UI를 보여줍니다.
    if (user.role === '클라이언트') {
        return <ClientUI user={user} onLogout={handleLogout} />;
    } else {
        // '슈퍼 어드민' 또는 '대행사 어드민'인 경우
        return <AdminUI user={user} onLogout={handleLogout} />;
    }
}
