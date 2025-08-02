import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// 컴포넌트들을 각 파일에서 불러옵니다.
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Dashboard from './Dashboard';
import CampaignManagement from './CampaignManagement';
import UserManagement from './UserManagement';

// 이 컴포넌트는 어드민/대행사 사용자를 위한 전체 UI 레이아웃을 담당합니다.
export default function AdminUI({ user, onLogout }) {
    const [activePage, setActivePage] = useState('dashboard');
    const [campaigns, setCampaigns] = useState([]);
    const [users, setUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ⭐️ [변경점] 데이터를 불러오는 로직을 별도의 함수로 분리합니다.
    const fetchAdminData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [campaignsRes, usersRes] = await Promise.all([
                axios.get('http://localhost:5000/api/campaigns'),
                axios.get('http://localhost:5000/api/users')
            ]);
            
            setCampaigns(campaignsRes.data);
            setUsers(usersRes.data);
            
            setActivities([
                { user: '박클라이언트', action: "'B2B 솔루션' 주제를 반려했습니다.", time: "10분 전", type: 'reject' },
                { user: '이서연', action: "'여름 시즌 음료' 캠페인의 목차를 등록했습니다.", time: "1시간 전", type: 'action' },
            ]);
        } catch (error) {
            console.error("어드민 데이터 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, []); // useCallback으로 감싸서 함수가 불필요하게 재생성되는 것을 방지합니다.

    // 컴포넌트가 처음 마운트될 때 데이터를 불러옵니다.
    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">로딩 중...</div>
    }

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard setActivePage={setActivePage} campaigns={campaigns} activities={activities} />;
            case 'campaigns': 
                return (
                    <CampaignManagement 
                        users={users} 
                        initialCampaigns={campaigns} 
                        setCampaigns={setCampaigns}
                        // ⭐️ [변경점] 데이터 갱신 함수를 prop으로 전달합니다.
                        onDataChange={fetchAdminData} 
                    />
                );
            case 'users': return <UserManagement initialUsers={users} />;
            default: return <Dashboard setActivePage={setActivePage} campaigns={campaigns} activities={activities} />;
        }
    };
    
    const getPageTitle = () => {
        switch (activePage) {
            case 'dashboard': return '대시보드';
            case 'campaigns': return '캠페인 관리';
            case 'users': return '고객사/사용자 관리';
            default: return '대시보드';
        }
    }

    return (
        <div className="h-screen w-full bg-gray-50 flex font-sans">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title={getPageTitle()} onLogout={onLogout} user={user} />
                <div className="flex-1 overflow-y-auto">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
}
