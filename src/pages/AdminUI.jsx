import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Dashboard from './Dashboard';
import CampaignListPage from './CampaignListPage'; 
import UserManagement from './UserManagement';
import CampaignDetailPage from './CampaignDetailPage';

export default function AdminUI({ user, onLogout }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    const [campaigns, setCampaigns] = useState([]);
    const [users, setUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
    }, []);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);


    const getActivePageFromPath = (path) => {
        if (path.startsWith('/admin/campaigns')) return 'campaigns';
        if (path.startsWith('/admin/users')) return 'users';
        return 'dashboard';
    };
    const [activePage, setActivePage] = useState(getActivePageFromPath(location.pathname));

    useEffect(() => {
        setActivePage(getActivePageFromPath(location.pathname));
    }, [location.pathname]);

    const handleNavigate = (pageId) => navigate(`/admin/${pageId}`);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">관리자 데이터를 불러오는 중...</div>
    }

    const getPageTitle = () => {
        if (location.pathname.includes('/admin/campaigns/')) {
            return '캠페인 상세';
        }
        switch (activePage) {
            case 'campaigns': return '캠페인 관리';
            case 'users': return '고객사/사용자 관리';
            default: return '대시보드';
        }
    }

    return (
        <div className="h-screen w-full bg-gray-50 flex font-sans">
            <Sidebar activePage={activePage} setActivePage={handleNavigate} />
            <main className="flex-1 flex flex-col overflow-hidden">
                <Header title={getPageTitle()} onLogout={onLogout} user={user} />
                <div className="flex-1 overflow-y-auto">
                    <Routes>
                        <Route path="dashboard" element={<Dashboard campaigns={campaigns} activities={activities} />} />
                        {/* ⭐️ [수정] CampaignListPage에 로그인한 사용자 정보(user)를 loggedInUser prop으로 전달합니다. */}
                        <Route path="campaigns" element={<CampaignListPage users={users} loggedInUser={user} />} />
                        <Route path="campaigns/:campaignId" element={<CampaignDetailPage />} />
                        <Route path="users" element={<UserManagement loggedInUser={user} />} />
                        <Route path="*" element={<Dashboard campaigns={campaigns} activities={activities} />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
