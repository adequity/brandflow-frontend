// src/pages/AdminUI.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { extractArrayFromResponse, validateCampaignData } from '../utils/dataUtils';

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
// 모든 페이지를 지연 로딩으로 변경하여 번들 크기 최적화
import LazyRoutes from '../components/LazyRoutes';

export default function AdminUI({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 실제 API 데이터 사용 (더미 fallback 포함)
  const fetchAdminData = useCallback(async (page = 1) => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log('AdminUI: 토큰 상태:', token ? '존재' : '없음');
      
      if (token) {
        try {
          // JWT 인증을 통한 실제 API 호출
          const [campaignsResponse, usersResponse] = await Promise.all([
            api.get('/api/campaigns/', {
              params: {
                page: page,
                size: 10  // 페이지당 10개씩 로드
              }
            }),
            api.get('/api/users')
          ]);
          
          // 백엔드 응답이 페이지네이션 형식일 경우를 처리 - 안전한 데이터 추출
          const campaignData = extractArrayFromResponse(campaignsResponse);
          const userData = extractArrayFromResponse(usersResponse);
          
          setCampaigns(validateCampaignData(campaignData));
          setUsers(userData);
          
          // 페이지네이션 정보 저장
          if (campaignsResponse.data.pagination) {
            setPagination(campaignsResponse.data.pagination);
          }
          
          console.log('AdminUI: 실제 API 데이터 로드 성공');
          console.log('캠페인:', campaignData.length, '개');
          console.log('페이지네이션:', campaignsResponse.data.pagination);
          console.log('사용자:', userData.length, '개');
          
        } catch (apiError) {
          console.error('AdminUI: API 호출 실패:', apiError);
          console.error('Error details:', {
            message: apiError.message,
            status: apiError.response?.status,
            data: apiError.response?.data
          });
          
          // 고정된 해결책: 실제 데이터 직접 로드 (Mixed Content 우회)
          try {
            console.log('AdminUI: Railway API 직접 호출 시도...');
            // JWT 기반 API 호출로 수정하여 budget 필드 포함된 최신 응답 받기
            const token = localStorage.getItem('authToken');
            const apiUrl = `https://brandflow-backend-production-99ae.up.railway.app/api/campaigns/?page=${page}&size=10`;
            console.log('API URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': token ? `Bearer ${token}` : undefined
              }
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
              const campaignApiData = await response.json();
              console.log('API 응답 데이터:', campaignApiData);
              
              // 안전한 데이터 추출 사용
              const realCampaigns = extractArrayFromResponse({ data: campaignApiData });
              
              if (realCampaigns && realCampaigns.length > 0) {
                console.log('AdminUI: 실제 캠페인 데이터 로드 성공!', realCampaigns.length, '개');
                setCampaigns(validateCampaignData(realCampaigns));
                
                // 페이지네이션 정보 처리
                if (campaignApiData.pagination) {
                  setPagination(campaignApiData.pagination);
                } else if (campaignApiData.meta) {
                  setPagination(campaignApiData.meta);
                }
                
                // JWT 인증을 통한 사용자 데이터 로드 시도
                try {
                  const usersResponse = await api.get('/api/users');
                  const realUsers = extractArrayFromResponse(usersResponse);
                  setUsers(realUsers);
                  console.log('AdminUI: 실제 사용자 데이터 로드 성공:', realUsers.length, '개');
                } catch (usersError) {
                  console.warn('사용자 데이터 로드 실패:', usersError);
                  setUsers([{id: 1, name: '시스템 관리자', role: 'SUPER_ADMIN'}]);
                }
                
                setIsLoading(false);
                return;
              }
            }
          } catch (fetchError) {
            console.error('AdminUI: Railway API 직접 호출 실패:', fetchError.message);
          }
          
          // 실제 데이터 로드 실패 시 빈 상태로 설정
          console.warn('실제 데이터 로드 실패 - 빈 상태로 설정');
          setCampaigns([]);
          setUsers([]);
        }
      } else {
        console.warn('AdminUI: 인증 토큰이 없어 실제 데이터 직접 로드 시도');
        // 토큰이 없으면 로그인 필요 안내
        console.warn('인증 토큰이 없습니다. 로그인이 필요합니다.');
        setCampaigns([]);
        setUsers([]);
        return;
        
        // JWT 인증을 통한 사용자 데이터 로드 시도
        try {
          const usersResponse = await api.get('/api/users');
          const realUsers = extractArrayFromResponse(usersResponse);
          setUsers(realUsers);
          console.log('AdminUI: 사용자 데이터 로드 성공:', realUsers.length, '개');
        } catch (error) {
          console.error('사용자 데이터 로드 실패:', error);
          setUsers([]);
        }
      }
      
      // 실제 데이터 기반 활동 로그 생성
      const generateRealActivities = () => {
        if (!campaigns || campaigns.length === 0) {
          console.log('캠페인 데이터가 없어 활동 로그를 생성할 수 없습니다');
          return [];
        }
        
        const activities = [];
        const now = new Date();
        
        // 실제 캠페인 데이터에서 활동 추출
        campaigns.forEach(campaign => {
          if (campaign.createdAt) {
            const campaignCreated = new Date(campaign.createdAt);
            const timeDiff = Math.floor((now - campaignCreated) / (1000 * 60));
            
            let timeText = '';
            if (timeDiff < 60) {
              timeText = `${timeDiff}분 전`;
            } else if (timeDiff < 1440) {
              timeText = `${Math.floor(timeDiff / 60)}시간 전`;
            } else {
              timeText = `${Math.floor(timeDiff / 1440)}일 전`;
            }
            
            activities.push({
              user: campaign.User?.name || campaign.staff_name || '관리자',
              action: `'${campaign.name}' 캠페인을 생성했습니다.`,
              time: timeText,
              type: 'action'
            });
          }
          
          // 실제 포스트 데이터가 있다면 처리
          if (campaign.posts && Array.isArray(campaign.posts)) {
            campaign.posts.forEach(post => {
              if (post.createdAt) {
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
                  user: campaign.User?.name || campaign.staff_name || '관리자',
                  action: `'${post.title}' 주제를 등록했습니다.`,
                  time: postTimeText,
                  type: post.topicStatus === '대기' ? 'action' : 
                        post.topicStatus === '거절' ? 'reject' : 'approve'
                });
              }
            });
          }
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
      
      setActivities(generateRealActivities());
    } catch (err) {
      console.error('어드민 데이터 로딩 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.role]);

  useEffect(() => { 
    fetchAdminData(currentPage); 
  }, [fetchAdminData, currentPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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
    if (path.startsWith('/admin/monthly-incentives')) return 'monthly-incentives';
    if (path.startsWith('/admin/board')) return 'board';
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
      case 'monthly-incentives': return '월간 인센티브 관리';
      case 'board': return '게시판';
      case 'calendar': return '일정 관리';
      case 'system-settings': return '시스템 설정';
      case 'users':     return '고객사/사용자 관리';
      default:          return '대시보드';
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex font-sans">
      <Sidebar activePage={activePage} setActivePage={handleNavigate} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header title={getPageTitle()} onLogout={onLogout} user={user} />
        <div className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="dashboard" element={<LazyRoutes.Dashboard campaigns={campaigns} activities={activities} user={user} onSeeAll={() => navigate('/admin/campaigns')} />} />
            <Route
              path="campaigns"
              element={
                <LazyRoutes.CampaignListPage
                  campaigns={campaigns}
                  setCampaigns={setCampaigns}
                  users={users}
                  loggedInUser={user}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              }
            />
            <Route
              path="campaigns/:campaignId"
              element={<LazyRoutes.CampaignDetailPage campaigns={campaigns} setCampaigns={setCampaigns} />}
            />
            <Route path="purchase-requests" element={<LazyRoutes.PurchaseRequestsPage loggedInUser={user} />} />
            <Route path="order-management" element={<LazyRoutes.OrderManagement loggedInUser={user} />} />
            <Route path="products" element={<LazyRoutes.ProductManagement loggedInUser={user} />} />
            <Route path="monthly-incentives" element={<LazyRoutes.MonthlyIncentives loggedInUser={user} />} />
            <Route path="board" element={<LazyRoutes.BoardPage loggedInUser={user} />} />
            <Route path="calendar" element={<LazyRoutes.CalendarPage user={user} />} />
            <Route path="system-settings" element={<LazyRoutes.SystemSettings loggedInUser={user} />} />
            <Route path="users" element={<LazyRoutes.UserManagement loggedInUser={user} />} />
            <Route path="*" element={<LazyRoutes.Dashboard campaigns={campaigns} activities={activities} user={user} onSeeAll={() => navigate('/admin/campaigns')} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
