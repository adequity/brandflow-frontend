import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Dashboard from './Dashboard';
import CampaignManagement from './CampaignManagement';
import UserManagement from './UserManagement';

export default function AdminUI({ user, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      // ✅ localhost 하드코딩 제거 → 공통 api 클라이언트 사용
      const [campaignsRes, usersRes] = await Promise.all([
        api.get('/api/campaigns'),
        api.get('/api/users'),
      ]);

      setCampaigns(campaignsRes.data);
      setUsers(usersRes.data);

      setActivities([
        { user: '박클라이언트', action: "'B2B 솔루션' 주제를 반려했습니다.", time: '10분 전', type: 'reject' },
        { user: '이서연', action: "'여름 시즌 음료' 캠페인의 목차를 등록했습니다.", time: '1시간 전', type: 'action' },
      ]);
    } catch (error) {
      console.error('어드민 데이터 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">로딩 중...</div>;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} campaigns={campaigns} activities={activities} />;
      case 'campaigns':
        return (
          <CampaignManagement
            users={users}
            initialCampaigns={campaigns}
            setCampaigns={setCampaigns}
            onDataChange={fetchAdminData}
          />
        );
      case 'users':
        return <UserManagement initialUsers={users} />;
      default:
        return <Dashboard setActivePage={setActivePage} campaigns={campaigns} activities={activities} />;
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard':
        return '대시보드';
      case 'campaigns':
        return '캠페인 관리';
      case 'users':
        return '고객사/사용자 관리';
      default:
        return '대시보드';
    }
  };

  return (
    <div className="h-screen w-full bg-gray-50 flex font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={getPageTitle()} onLogout={onLogout} user={user} />
        <div className="flex-1 overflow-y-auto">{renderPage()}</div>
      </main>
    </div>
  );
}
