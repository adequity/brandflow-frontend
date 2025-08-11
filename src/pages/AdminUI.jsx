// src/pages/AdminUI.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Dashboard from './Dashboard';
import CampaignListPage from './CampaignListPage';
import CampaignDetailPage from './CampaignDetailPage';
import UserManagement from './UserManagement';

export default function AdminUI({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 대행사/슈퍼/클라 권한 분리용 viewer 파라미터 포함
  const fetchAdminData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [{ data: campaignsData }, { data: usersData }] = await Promise.all([
        api.get('/api/campaigns', { params: { viewerId: user.id, viewerRole: user.role } }),
        api.get('/api/users', { params: { viewerId: user.id, viewerRole: user.role } }),
      ]);
      setCampaigns(campaignsData || []);
      setUsers(usersData || []);
      setActivities([
        { user: '박클라이언트', action: "'B2B 솔루션' 주제를 반려했습니다.", time: '10분 전', type: 'reject' },
        { user: '이서연', action: "'여름 시즌 음료' 캠페인의 목차를 등록했습니다.", time: '1시간 전', type: 'action' },
      ]);
    } catch (err) {
      console.error('어드민 데이터 로딩 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => { fetchAdminData(); }, [fetchAdminData]);

  // /admin 진입 시 대시보드로 리다이렉트
  useEffect(() => {
    if (location.pathname === '/admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const getActivePageFromPath = (path) => {
    if (path.startsWith('/admin/campaigns')) return 'campaigns';
    if (path.startsWith('/admin/users')) return 'users';
    return 'dashboard';
  };
  const [activePage, setActivePage] = useState(getActivePageFromPath(location.pathname));
  useEffect(() => { setActivePage(getActivePageFromPath(location.pathname)); }, [location.pathname]);

  const handleNavigate = (pageId) => navigate(`/admin/${pageId}`);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">관리자 데이터를 불러오는 중...</div>;
  }

  const getPageTitle = () => {
    if (location.pathname.includes('/admin/campaigns/')) return '캠페인 상세';
    switch (activePage) {
      case 'campaigns': return '캠페인 관리';
      case 'users':     return '고객사/사용자 관리';
      default:          return '대시보드';
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans">
      <Sidebar activePage={activePage} setActivePage={handleNavigate} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={getPageTitle()} onLogout={onLogout} user={user} />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="dashboard" element={<Dashboard campaigns={campaigns} activities={activities} />} />
            <Route
              path="campaigns"
              element={
                <CampaignListPage
                  campaigns={campaigns}
                  setCampaigns={setCampaigns}
                  users={users}
                  loggedInUser={user}  // ✅ 여기서 전달
                />
              }
            />
            <Route
              path="campaigns/:campaignId"
              element={<CampaignDetailPage campaigns={campaigns} setCampaigns={setCampaigns} />}
            />
            <Route path="users" element={<UserManagement loggedInUser={user} />} />
            <Route path="*" element={<Dashboard campaigns={campaigns} activities={activities} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
