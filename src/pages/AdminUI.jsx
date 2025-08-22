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
import PurchaseRequestsPage from './PurchaseRequestsPage';
import ProductManagement from './ProductManagement';
import SalesRegistration from './SalesRegistration';
import SystemSettings from './SystemSettings';
import MonthlyIncentives from './MonthlyIncentives';
import OrderManagement from './OrderManagement';
import LazyRoutes from '../components/LazyRoutes';

export default function AdminUI({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 실제 API 데이터 사용 (더미 fallback 포함)
  const fetchAdminData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log('AdminUI: 토큰 상태:', token ? '존재' : '없음');
      
      if (token) {
        try {
          // 실제 API 호출
          const [campaignsResponse, usersResponse] = await Promise.all([
            api.get('/api/campaigns/'),
            api.get('/api/users/')
          ]);
          
          setCampaigns(campaignsResponse.data.results || campaignsResponse.data);
          setUsers(usersResponse.data.results || usersResponse.data);
          
          console.log('AdminUI: 실제 API 데이터 로드 성공');
          console.log('캠페인:', (campaignsResponse.data.results || campaignsResponse.data).length, '개');
          console.log('사용자:', (usersResponse.data.results || usersResponse.data).length, '개');
          
        } catch (apiError) {
          console.warn('AdminUI: API 호출 실패, 더미 데이터 사용', apiError);
          // API 실패시 더미 데이터 사용
          const dummyCampaigns = [
        {
          id: 1,
          name: '테스트 캠페인 - 상품 매핑 테스트',
          client: '테스트 클라이언트',
          manager: 1,
          manager_name: '슈퍼 관리자',
          post_count: 3,
          createdAt: new Date().toISOString(),
          invoiceIssued: false,
          paymentCompleted: false,
          invoiceDueDate: null,
          paymentDueDate: null,
          revenue: 500000,
          User: { 
            id: 1, 
            name: '슈퍼 관리자'
          },
          posts: [
            {
              id: 1,
              title: '블로그 포스트 테스트',
              workType: '블로그',
              topicStatus: '대기',
              createdAt: new Date().toISOString(),
              productId: 1,
              quantity: 1
            },
            {
              id: 2,
              title: '인스타그램 포스트 테스트',
              workType: '인스타그램',
              topicStatus: '승인',
              createdAt: new Date().toISOString(),
              productId: 2,
              quantity: 2
            },
            {
              id: 3,
              title: '유튜브 영상 테스트',
              workType: '유튜브',
              topicStatus: '승인',
              createdAt: new Date().toISOString(),
              productId: 4,
              quantity: 1
            },
            {
              id: 4,
              title: '페이스북 광고 테스트',
              workType: '페이스북',
              topicStatus: '거절',
              createdAt: new Date().toISOString(),
              productId: 3,
              quantity: 1
            }
          ]
        }
      ];
      
      setCampaigns(dummyCampaigns);
      
      // 더미 사용자 데이터
      const dummyUsers = [
        {
          id: 1,
          name: '슈퍼 관리자',
          email: 'admin@brandflow.com',
          role: '슈퍼 어드민',
          company: 'BrandFlow'
        },
        {
          id: 2,
          name: '테스트 직원',
          email: 'staff@brandflow.com',
          role: '직원',
          company: 'BrandFlow'
        }
      ];
      setUsers(dummyUsers);
        }
      } else {
        console.warn('AdminUI: 인증 토큰이 없어 더미 데이터 사용');
        // 토큰이 없으면 더미 데이터 사용
        const dummyCampaigns = [
        {
          id: 1,
          name: '테스트 캠페인 - 상품 매핑 테스트',
          client: '테스트 클라이언트',
          manager: 1,
          manager_name: '슈퍼 관리자',
          post_count: 3,
          createdAt: new Date().toISOString(),
          invoiceIssued: false,
          paymentCompleted: false,
          invoiceDueDate: null,
          paymentDueDate: null,
          revenue: 500000,
          User: { 
            id: 1, 
            name: '슈퍼 관리자'
          },
          posts: []
        }
      ];
      
      setCampaigns(dummyCampaigns);
      
      // 더미 사용자 데이터
      const dummyUsers = [
        {
          id: 1,
          name: '슈퍼 관리자',
          email: 'admin@brandflow.com',
          role: '슈퍼 어드민',
          company: 'BrandFlow'
        },
        {
          id: 2,
          name: '테스트 직원',
          email: 'staff@brandflow.com',
          role: '직원',
          company: 'BrandFlow'
        }
      ];
      setUsers(dummyUsers);
      }
      
      // 더미 활동 로그 생성
      const generateActivities = () => {
        const activities = [];
        const now = new Date();
        
        // 캠페인 및 주제 등록 활동 추출
        campaigns.forEach(campaign => {
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
              type: post.topicStatus === '대기' ? 'action' : 
                    post.topicStatus === '거절' ? 'reject' : 'approve'
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
    if (path.startsWith('/admin/purchase-requests')) return 'purchase-requests';
    if (path.startsWith('/admin/order-management')) return 'order-management';
    if (path.startsWith('/admin/products')) return 'products';
    if (path.startsWith('/admin/sales')) return 'sales';
    if (path.startsWith('/admin/monthly-incentives')) return 'monthly-incentives';
    if (path.startsWith('/admin/calendar')) return 'calendar';
    if (path.startsWith('/admin/system-settings')) return 'system-settings';
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
    if (location.pathname.includes('/admin/calendar')) return '일정 관리';
    switch (activePage) {
      case 'campaigns': return '캠페인 관리';
      case 'purchase-requests': return '구매요청 관리';
      case 'order-management': return '발주 관리';
      case 'products': return '상품 관리';
      case 'sales': return '매출 관리';
      case 'monthly-incentives': return '월간 인센티브 관리';
      case 'calendar': return '일정 관리';
      case 'system-settings': return '시스템 설정';
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
            <Route path="dashboard" element={<Dashboard campaigns={campaigns} activities={activities} user={user} onSeeAll={() => navigate('/admin/campaigns')} />} />
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
            <Route path="purchase-requests" element={<PurchaseRequestsPage loggedInUser={user} />} />
            <Route path="order-management" element={<OrderManagement loggedInUser={user} />} />
            <Route path="products" element={<ProductManagement loggedInUser={user} />} />
            <Route path="sales" element={<SalesRegistration loggedInUser={user} />} />
            <Route path="monthly-incentives" element={<MonthlyIncentives loggedInUser={user} />} />
            <Route path="calendar" element={<LazyRoutes.CalendarPage user={user} />} />
            <Route path="system-settings" element={<SystemSettings loggedInUser={user} />} />
            <Route path="users" element={<UserManagement loggedInUser={user} />} />
            <Route path="*" element={<Dashboard campaigns={campaigns} activities={activities} user={user} onSeeAll={() => navigate('/admin/campaigns')} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
