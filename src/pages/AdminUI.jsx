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
      
      // 실제 활동 로그 생성
      const generateActivities = () => {
        const activities = [];
        const now = new Date();
        
        // 캠페인 및 주제 등록 활동 추출
        (campaignsData || []).forEach(campaign => {
          // 캠페인 생성 활동
          const campaignCreated = new Date(campaign.createdAt);
          const timeDiff = Math.floor((now - campaignCreated) / (1000 * 60)); // 분 단위
          
          let timeText = '';
          if (timeDiff < 60) {
            timeText = `${timeDiff}분 전`;
          } else if (timeDiff < 1440) {
            timeText = `${Math.floor(timeDiff / 60)}시간 전`;
          } else {
            timeText = `${Math.floor(timeDiff / 1440)}일 전`;
          }
          
          activities.push({
            user: campaign.User?.name || '관리자',
            action: `'${campaign.name}' 캠페인을 생성했습니다.`,
            time: timeText,
            type: 'action'
          });
          
          // 주제 등록 활동
          (campaign.posts || []).forEach(post => {
            const postCreated = new Date(post.createdAt);
            const postTimeDiff = Math.floor((now - postCreated) / (1000 * 60));
            
            let postTimeText = '';
            if (postTimeDiff < 60) {
              postTimeText = `${postTimeDiff}분 전`;
            } else if (postTimeDiff < 1440) {
              postTimeText = `${Math.floor(postTimeDiff / 60)}시간 전`;
            } else {
              postTimeText = `${Math.floor(postTimeDiff / 1440)}일 전`;
            }
            
            activities.push({
              user: campaign.User?.name || '관리자',
              action: `'${post.title}' 주제를 등록했습니다.`,
              time: postTimeText,
              type: post.topicStatus === '주제 승인 대기' ? 'action' : 
                    post.topicStatus?.includes('반려') ? 'reject' : 'approve'
            });
          });
        });
        
        // 최신순으로 정렬하고 최대 10개만
        return activities.sort((a, b) => {
          const getMinutes = (timeStr) => {
            const num = parseInt(timeStr);
            if (timeStr.includes('분')) return num;
            if (timeStr.includes('시간')) return num * 60;
            if (timeStr.includes('일')) return num * 1440;
            return 0;
          };
          return getMinutes(a.time) - getMinutes(b.time);
        }).slice(0, 10);
      };
      
      setActivities(generateActivities());
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
