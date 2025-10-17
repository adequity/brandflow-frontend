// frontend/src/pages/Dashboard.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  XCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  DollarSign
} from 'lucide-react';
import api, { apiEndpoints } from '../api/client';

const colorStyles = {
  primary:   { bg: 'bg-primary-100',   text: 'text-primary-600'   },
  success:   { bg: 'bg-green-100',     text: 'text-green-600'    },
  warning:   { bg: 'bg-amber-100',     text: 'text-amber-600'    },
  danger:    { bg: 'bg-red-100',       text: 'text-red-600'      },
  neutral:   { bg: 'bg-neutral-100',   text: 'text-neutral-600'  },
};

export default function Dashboard({ campaigns = [], activities = [], onSeeAll, user }) {
  const navigate = useNavigate();

  // 월간 필터 상태
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // 안전한 데이터 확인
  if (!user) {
    return (
      <div className="p-6 bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200 shadow-card">
          <p className="text-neutral-700">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }
  const [purchaseStats, setPurchaseStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalAmount: 0,
    thisMonthAmount: 0
  });

  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalMargin: 0,
    totalIncentives: 0,
    thisMonthRevenue: 0,
    thisMonthMargin: 0
  });

  const [financialOverview, setFinancialOverview] = useState({
    totalRevenue: 0,           // 매출 (Sales에서)
    totalExpenses: 0,          // 매입/지출 (PurchaseRequests에서)
    netProfit: 0,              // 순이익 (매출 - 매입)
    totalIncentives: 0,        // 총 인센티브 지출 예정
    finalNetProfit: 0          // 최종 순이익 (매출 - 매입 - 인센티브)
  });

  const [employeeStats, setEmployeeStats] = useState({
    thisMonthRevenue: 0,       // 이번달 총 매출 (담당 캠페인 기준)
    thisMonthIncentive: 0,     // 이번달 인센티브 금액
    pendingInvoices: 0,        // 미발행 계산서 캠페인 수
    pendingPayments: 0         // 미입금 캠페인 수
  });

  const [receivablesStatus, setReceivablesStatus] = useState({
    pending_invoices: { count: 0, total_amount: 0, campaigns: [] },
    pending_payments: { count: 0, total_amount: 0, campaigns: [] }
  });

  useEffect(() => {
    const fetchAllStats = async () => {
      if (!user?.id) return;
      
      try {
        // 월간 캠페인 통계 데이터 가져오기
        let campaignTotalRevenue = 0;
        let campaignTotalCost = 0;
        let completedCampaigns = 0;
        let pendingInvoices = 0;
        let pendingPayments = 0;

        try {
          console.log('[DASHBOARD] 월간 캠페인 통계 로딩 시작... (month:', selectedMonth, ')');
          // "전체" 선택 시 month 파라미터를 전달하지 않음
          const monthParam = selectedMonth === 'all' ? '' : `?month=${selectedMonth}`;
          const monthlyStatsResponse = await api.get(`/api/campaigns/monthly-stats${monthParam}`);
          const monthlyStats = monthlyStatsResponse.data;

          campaignTotalRevenue = monthlyStats.totalRevenue || 0;
          campaignTotalCost = monthlyStats.totalCost || 0;
          completedCampaigns = monthlyStats.completedCampaigns || 0;
          pendingInvoices = monthlyStats.pendingInvoices || 0;
          pendingPayments = monthlyStats.pendingPayments || 0;

          console.log('[DASHBOARD] 월간 캠페인 통계 로드 완료:', monthlyStats);
        } catch (error) {
          console.error('월간 캠페인 통계 로딩 실패:', error);
        }

        // 최신 캠페인 데이터 다시 로드 (posts는 대시보드에서 불필요하므로 제거)
        let latestCampaigns = campaigns;
        if (!campaigns || campaigns.length === 0) {
          try {
            const campaignsResponse = await api.get('/api/campaigns');
            latestCampaigns = campaignsResponse.data || [];
            console.log('[DASHBOARD] 캠페인 목록 로드 완료:', latestCampaigns.length, '개');
          } catch (error) {
            console.error('캠페인 데이터 재로딩 실패:', error);
          }
        }
        
        // 기존 order_requests cost_price 업데이트 (1회만 실행)
        try {
          console.log('[UPDATE] order_requests cost_price 업데이트 시작...');
          const updateResponse = await api.post('/api/campaigns/update-order-cost-prices');
          console.log('[UPDATE] cost_price 업데이트 결과:', updateResponse.data);
        } catch (error) {
          console.log('[UPDATE] cost_price 업데이트 실패:', error);
        }

        // 실제 구매요청 및 발주 데이터 가져오기
        let realPurchaseStats = {
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          totalAmount: 0,
          thisMonthAmount: 0
        };
        
        try {
          // 발주 요청 데이터 조회 (order-requests API 사용, 월간 필터 적용)
          console.log('[DASHBOARD] 발주 요청 데이터 로딩 시작... (month:', selectedMonth, ')');
          // "전체" 선택 시 month 파라미터를 전달하지 않음
          const orderMonthParam = selectedMonth === 'all' ? '' : `?month=${selectedMonth}`;
          const orderRequestsResponse = await api.get(`/api/campaigns/order-requests${orderMonthParam}`);
          const orderRequests = orderRequestsResponse.data;

          console.log('[DASHBOARD] 발주 요청 전체 데이터:', orderRequests);

          // 상태별로 분류
          const totalRequests = orderRequests.length;
          const pendingRequests = orderRequests.filter(req => req.status === '대기').length;
          const approvedRequests = orderRequests.filter(req => req.status === '승인').length;
          const rejectedRequests = orderRequests.filter(req => req.status === '거부').length;

          // 승인된 발주의 cost_price 합계
          const approvedOrderList = orderRequests.filter(req => req.status === '승인');
          const totalAmount = approvedOrderList.reduce((sum, req) => sum + (req.cost_price || 0), 0);

          // 백엔드에서 이미 선택된 월로 필터링된 데이터를 받으므로, 클라이언트 사이드 필터링 불필요
          const thisMonthAmount = totalAmount;

          realPurchaseStats = {
            totalRequests,
            pendingRequests,
            approvedRequests,
            rejectedRequests,
            totalAmount,
            thisMonthAmount
          };

          console.log('[DASHBOARD] 새로운 발주 관리 통계 (order-requests 기반):', realPurchaseStats);
          console.log('[DASHBOARD] 승인된 발주 목록:', approvedOrderList.map(req => ({id: req.id, title: req.title, cost_price: req.cost_price})));
          
        } catch (error) {
          console.error('구매요청/발주 데이터 로딩 실패:', error);
          // 오류 시 기본값 유지
        }
        
        setPurchaseStats(realPurchaseStats);
        console.log('[DASHBOARD] 구매요청 통계:', realPurchaseStats);

        // 간단한 인센티브 계산 (성능 최적화를 위해 API 호출 최소화)
        let totalIncentives = 0;
        try {
          console.log('[DASHBOARD] 인센티브 계산 시작...');
          
          // 전체 매출의 평균 인센티브율로 추정 계산 (실제 정확한 계산이 필요하면 별도 API 구현)
          const averageIncentiveRate = 0.05; // 5%
          totalIncentives = campaignTotalRevenue * averageIncentiveRate;
          
          console.log('[DASHBOARD] 인센티브 계산 완료 - 총 인센티브:', totalIncentives);
        } catch (error) {
          console.error('인센티브 계산 실패:', error);
          totalIncentives = campaignTotalRevenue * 0.05;
        }

        // 실제 캠페인 데이터 기반 매출 통계 (인센티브 계산 후)
        const realSalesStats = {
          totalSales: latestCampaigns.length,
          totalRevenue: campaignTotalRevenue,
          totalMargin: campaignTotalRevenue - campaignTotalCost,
          totalIncentives: totalIncentives,
          thisMonthRevenue: campaignTotalRevenue * 0.3, // 이번달 추정치
          thisMonthMargin: (campaignTotalRevenue - campaignTotalCost) * 0.3
        };
        setSalesStats(realSalesStats);

        // 먼저 인증 테스트
        try {
          console.log('[DEBUG] 인증 테스트 시작...');
          const authTestResponse = await api.get('/api/campaigns/test-auth');
          console.log('[DEBUG] 인증 테스트 성공:', authTestResponse.data);
        } catch (authError) {
          console.error('[DEBUG] 인증 테스트 실패:', authError);
          console.error('[DEBUG] 인증 오류 세부사항:', {
            status: authError.response?.status,
            data: authError.response?.data
          });
        }

        // 발주 승인된 posts의 지출 계산 (product.cost * quantity)
        let approvedPostsExpense = 0;
        try {
          console.log('[DEBUG] 발주 승인 지출 API 호출 시작...');
          const approvedExpenseResponse = await api.get('/api/campaigns/approved-posts-expense');
          approvedPostsExpense = approvedExpenseResponse.data.total_expense || 0;
          console.log('[DASHBOARD] 발주 승인 지출:', approvedPostsExpense, '원');
        } catch (error) {
          console.error('발주 승인 지출 조회 실패:', error);
          console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            url: error.config?.url
          });

          // detail 배열 내용 확인
          if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
            console.error('Validation errors:', error.response.data.detail);
          }
        }

        // 종합 재무 현황 계산 (실제 데이터 기반 + 발주 승인 지출 포함)
        const totalRevenue = campaignTotalRevenue;
        const totalExpenses = realPurchaseStats.totalAmount + campaignTotalCost + approvedPostsExpense;
        const netProfit = totalRevenue - totalExpenses;
        const finalNetProfit = netProfit - totalIncentives;

        console.log('[DASHBOARD] 지출 계산 상세:');
        console.log('- 구매요청 총액 (realPurchaseStats.totalAmount):', realPurchaseStats.totalAmount);
        console.log('- 캠페인 비용 (campaignTotalCost):', campaignTotalCost);
        console.log('- 발주 승인 지출 (approvedPostsExpense):', approvedPostsExpense);
        console.log('- 총 지출 (totalExpenses):', totalExpenses);

        setFinancialOverview({
          totalRevenue: totalRevenue,
          totalExpenses: totalExpenses,
          netProfit: netProfit,
          totalIncentives: totalIncentives,
          finalNetProfit: finalNetProfit,
          campaignRevenue: campaignTotalRevenue,
          campaignCost: campaignTotalCost,
          salesRevenue: campaignTotalRevenue
        });

        // 직원인 경우 실제 데이터 기반 개별 통계
        if (user.role === 'STAFF') {
          // 직원이 담당하는 캠페인들만 필터링 (백엔드 필드명 사용: creator_id, staff_id)
          const employeeCampaigns = latestCampaigns.filter(c =>
            c.creator_id === user.id || c.staff_id === user.id
          );

          // 담당 캠페인의 budget 합계 계산
          const employeeRevenue = employeeCampaigns.reduce((sum, campaign) => {
            return sum + (campaign.budget || 0);
          }, 0);

          // 담당 캠페인의 계산서/입금 상태 계산 (false만 카운트)
          // 백엔드는 camelCase로 반환: invoiceIssued, paymentCompleted
          const employeePendingInvoices = employeeCampaigns.filter(c =>
            c.invoiceIssued === false
          ).length;

          const employeePendingPayments = employeeCampaigns.filter(c =>
            c.paymentCompleted === false
          ).length;

          console.log('[STAFF-DASHBOARD] 담당 캠페인 통계:', {
            userId: user.id,
            totalCampaigns: latestCampaigns.length,
            employeeCampaigns: employeeCampaigns.length,
            totalRevenue: employeeRevenue,
            pendingInvoices: employeePendingInvoices,
            pendingPayments: employeePendingPayments,
            campaigns: employeeCampaigns.map(c => ({
              id: c.id,
              name: c.name,
              creator_id: c.creator_id,
              staff_id: c.staff_id,
              budget: c.budget,
              invoiceIssued: c.invoiceIssued,
              paymentCompleted: c.paymentCompleted
            }))
          });

          // 사용자 인센티브율 가져오기
          const userIncentiveRate = user.incentive_rate ? parseFloat(user.incentive_rate) / 100 : 0.1;

          setEmployeeStats({
            thisMonthRevenue: employeeRevenue,
            thisMonthIncentive: employeeRevenue * userIncentiveRate,
            pendingInvoices: employeePendingInvoices,
            pendingPayments: employeePendingPayments
          });
        }

        // 미수금 현황 데이터 가져오기
        try {
          console.log('[DASHBOARD] 미수금 현황 로딩 시작...');
          const receivablesResponse = await api.get('/api/campaigns/receivables-status');
          setReceivablesStatus(receivablesResponse.data);
          console.log('[DASHBOARD] 미수금 현황 로드 완료:', receivablesResponse.data);
        } catch (error) {
          console.error('미수금 현황 로딩 실패:', error);
        }

      } catch (error) {
        console.error('통계 데이터 로딩 실패:', error);
      }
    };

    fetchAllStats();
  }, [user?.id, user?.role, selectedMonth, campaigns]);
  const {
    allPosts,
    inProgressCount,
    rejectedCount,
    publishReadyCount,
    publishedThisMonthCount,
    pendingReviewCount,
    avgCompletionTime,
    campaignPerformance,
    previewInProgress,
    previewRejected,
    previewPublishReady,
    urgentTasks,
  } = useMemo(() => {
    // 안전한 데이터 처리
    if (!Array.isArray(campaigns)) {
      return {
        allPosts: [],
        inProgressCount: 0,
        rejectedCount: 0,
        publishReadyCount: 0,
        publishedThisMonthCount: 0,
        pendingReviewCount: 0,
        avgCompletionTime: 0,
        campaignPerformance: [],
        previewInProgress: [],
        previewRejected: [],
        previewPublishReady: [],
        urgentTasks: [],
      };
    }
    
    // 안전한 posts 추출: flatMap 대신 호환성이 좋은 방법 사용
    const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
    const posts = safeCampaigns.reduce((acc, c) => {
      // c가 객체이고 posts가 배열인지 확인
      if (c && Array.isArray(c.posts)) {
        return acc.concat(c.posts);
      }
      return acc; // posts가 없거나 배열이 아니면 현재 누적값 반환
    }, []);

    const isRejected = (p) =>
      (p.topicStatus && p.topicStatus.includes('반려')) ||
      (p.outlineStatus && p.outlineStatus.includes('반려'));

    const isPublishReady = (p) =>
      p.topicStatus === '주제 승인' &&
      p.outlineStatus === '목차 승인' &&
      !p.publishedUrl;

    const isPendingReview = (p) =>
      (p.topicStatus && p.topicStatus.includes('대기')) ||
      (p.outlineStatus && p.outlineStatus.includes('대기'));

    const isPublishedThisMonth = (p) => {
      if (!p.publishedUrl) return false;
      const d = new Date(p.updatedAt || p.createdAt);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };

    // 긴급 업무 (3일 이상 대기 중인 업무)
    const urgentTasks = posts.filter(p => {
      if (!isPendingReview(p)) return false;
      const createdDate = new Date(p.createdAt || p.creationTime);
      const daysPassed = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
      return daysPassed > 3;
    });

    // 평균 완료 시간 계산 (완료된 업무 기준)
    const completedPosts = posts.filter(p => p.publishedUrl);
    const avgCompletionTime = completedPosts.length > 0 
      ? Math.round(completedPosts.reduce((acc, p) => {
          const created = new Date(p.createdAt || p.creationTime);
          const updated = new Date(p.updatedAt || p.createdAt);
          return acc + (updated - created) / (1000 * 60 * 60 * 24);
        }, 0) / completedPosts.length)
      : 0;


    // 캠페인 성과 분석
    const campaignPerformance = campaigns.filter(c => c && c.id).map(c => {
      const posts = Array.isArray(c.posts) ? c.posts : [];
      const total = posts.length;
      const completed = posts.filter(p => p && p.publishedUrl).length;
      const pending = posts.filter(p => p && isPendingReview(p)).length;
      const rejected = posts.filter(p => p && isRejected(p)).length;
      
      return {
        id: c.id,
        name: c.name || 'Unknown Campaign',
        clientName: c.client || c.Client?.name || 'Unknown',
        total,
        completed,
        pending,
        rejected,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        efficiency: total > 0 ? Math.round(((completed + pending) / total) * 100) : 0
      };
    }).sort((a, b) => b.efficiency - a.efficiency);

    const inProgressCount = campaigns.length;
    const rejectedCount = posts.filter(isRejected).length;
    const publishReadyCount = posts.filter(isPublishReady).length;
    const publishedThisMonthCount = posts.filter(isPublishedThisMonth).length;
    const pendingReviewCount = posts.filter(isPendingReview).length;

    const sorted = [...posts].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );

    const previewInProgress   = sorted.filter(p => !p.publishedUrl).slice(0, 5);
    const previewRejected     = sorted.filter(isRejected).slice(0, 5);
    const previewPublishReady = sorted.filter(isPublishReady).slice(0, 5);

    return {
      allPosts: posts,
      inProgressCount,
      rejectedCount,
      publishReadyCount,
      publishedThisMonthCount,
      pendingReviewCount,
      avgCompletionTime,
      campaignPerformance,
      previewInProgress,
      previewRejected,
      previewPublishReady,
      urgentTasks,
    };
  }, [campaigns]);

  const stats = [
    { title: '진행 중인 캠페인', value: inProgressCount, Icon: FileText, color: 'primary', description: '전체 활성 캠페인' },
    { title: '검토 대기 중', value: pendingReviewCount, Icon: Clock, color: 'warning', description: '승인/반려 검토 필요' },
    { title: '반려된 콘텐츠', value: rejectedCount, Icon: XCircle, color: 'danger', description: '확인 및 수정 필요' },
    { title: '이번 달 완료', value: publishedThisMonthCount, Icon: CheckCircle, color: 'success', description: `총 ${allPosts.length}건 중` },
  ];

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({ title, value, description, Icon, color }) => {
    const c = colorStyles[color] || colorStyles.primary;
    return (
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200 shadow-card hover:shadow-elegant transition-all duration-200 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <p className="text-3xl font-bold text-neutral-800 mt-2">{value}</p>
          <p className="text-xs text-neutral-500 mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-xl ${c.bg} shadow-sm`}>
          <Icon size={20} className={c.text} />
        </div>
      </div>
    );
  };

  const MiniTable = ({ title, rows }) => (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          className="text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1 rounded-lg transition-all duration-200 flex items-center"
          onClick={onSeeAll || (() => {})}
          type="button"
        >
          전체보기 <ArrowRight size={14} className="ml-1" />
        </button>
      </div>
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-200 shadow-card">
        <table className="w-full text-sm text-left text-neutral-600">
          <thead className="bg-neutral-50/80 text-xs text-neutral-700 uppercase">
            <tr>
              <th className="px-4 py-3">주제</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">업데이트</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-500" colSpan={3}>
                  표시할 항목이 없습니다.
                </td>
              </tr>
            ) : rows.map(p => {
              const status = p.outlineStatus || p.topicStatus || '-';
              return (
                <tr key={p.id} className="border-b">
                  <td className="px-4 py-3 font-medium text-neutral-800 truncate">{p.title}</td>
                  <td className="px-4 py-3">{status}</td>
                  <td className="px-4 py-3">
                    {new Date(p.updatedAt || p.createdAt).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ActivityItem = ({ a }) => {
    // type별 아이콘/색상
    let Icon = MessageSquare;
    let color = colorStyles.neutral;
    if (a.type === 'reject') { Icon = XCircle; color = colorStyles.danger; }
    else if (a.type === 'approve') { Icon = CheckCircle; color = colorStyles.success; }
    else if (a.type === 'action') { Icon = AlertCircle; color = colorStyles.warning; }

    return (
      <li className="flex items-start space-x-3 py-3 border-b border-neutral-100 last:border-b-0">
        <div className={`mt-0.5 p-1.5 rounded-lg ${color.bg}`}>
          <Icon size={16} className={color.text} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-neutral-800">
            <span className="font-semibold">{a.user}</span>{' '}
            <span className="text-neutral-700">{a.action}</span>
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">{a.time}</p>
        </div>
      </li>
    );
  };

  // 월 목록 생성 (전체 + 최근 12개월)
  const generateMonthOptions = () => {
    const months = [{ value: 'all', label: '전체' }]; // 전체 옵션 추가
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
      months.push({ value, label });
    }
    return months;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 space-y-6">
      {/* 환영 메시지 및 주요 알림 */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-2xl shadow-elegant">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">
              {user?.role === 'STAFF' ? `직원 ${user?.name || '사용자'}님의 대시보드 👨‍💼` : '본사 관리자 대시보드 📊'}
            </h2>
            <p className="mt-2 opacity-90">
              {user?.role === 'STAFF'
                ? `안녕하세요! 오늘도 화이팅입니다! 💪`
                : urgentTasks.length > 0
                  ? `⚠️ 긴급 처리가 필요한 업무가 ${urgentTasks.length}건 있습니다!`
                  : `모든 업무가 원활하게 진행되고 있습니다. 👍`
              }
            </p>
            {user?.role !== 'STAFF' && avgCompletionTime > 0 && (
              <div className="mt-3 text-sm opacity-90">
                평균 업무 완료 시간: <span className="font-bold">{avgCompletionTime}일</span>
              </div>
            )}
          </div>
          {/* 월간 필터 */}
          <div className="ml-4">
            <label className="block text-sm font-medium text-white/80 mb-1">기준 월</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
            >
              {generateMonthOptions().map(option => (
                <option key={option.value} value={option.value} className="text-neutral-800">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 직원용 매출 데이터 또는 관리자용 재무 현황 */}
      {user?.role === 'STAFF' ? (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200 shadow-card">
          <h3 className="text-xl font-bold text-neutral-800 mb-6 flex items-center">
            📊 내 매출 데이터
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-primary-50 rounded-xl border border-primary-200">
              <div className="text-4xl font-bold text-primary-600">{formatAmount(employeeStats.thisMonthRevenue)}</div>
              <div className="text-lg text-primary-700 mt-2">이번달 총 매출</div>
              <div className="text-sm text-neutral-600 mt-1">담당 캠페인 기준</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
              <div className="text-4xl font-bold text-green-600">{formatAmount(employeeStats.thisMonthIncentive)}</div>
              <div className="text-lg text-green-700 mt-2">이번달 인센티브 금액</div>
              <div className="text-sm text-neutral-600 mt-1">
                {employeeStats.thisMonthIncentive > 0 ? '승인/지급 예정액' : '계산 대기 중'}
              </div>
            </div>
            <div className="text-center p-6 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300">
              <div className="text-4xl font-bold text-neutral-600">🗓️</div>
              <div className="text-lg text-neutral-700 mt-2">업무 캘린더</div>
              <div className="text-sm text-neutral-600 mt-1">추후 개발 예정</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="text-2xl font-bold text-red-600">{employeeStats.pendingInvoices}</div>
              <div className="text-sm text-red-700 mt-1">미발행 계산서</div>
              <div className="text-xs text-neutral-600 mt-1">발행 필요한 캠페인</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-2xl font-bold text-amber-600">{employeeStats.pendingPayments}</div>
              <div className="text-sm text-amber-700 mt-1">미입금 캠페인</div>
              <div className="text-xs text-neutral-600 mt-1">입금 대기 중</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200 shadow-card">
          <h3 className="text-xl font-bold text-neutral-800 mb-6 flex items-center">
            💰 재무 현황 (원장 데이터)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-xl border border-primary-200">
              <div className="text-3xl font-bold text-primary-600">{formatAmount(financialOverview.totalRevenue)}</div>
              <div className="text-sm text-primary-700 mt-1">총 매출</div>
              <div className="text-xs text-neutral-600 mt-1">Sales + Campaigns</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="text-3xl font-bold text-red-600">{formatAmount(financialOverview.totalExpenses)}</div>
              <div className="text-sm text-red-700 mt-1">총 매입/지출</div>
              <div className="text-xs text-neutral-600 mt-1">Purchase + Cost</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-600">{formatAmount(financialOverview.netProfit)}</div>
              <div className="text-sm text-green-700 mt-1">순이익</div>
              <div className="text-xs text-neutral-600 mt-1">Revenue - Expenses</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-3xl font-bold text-amber-600">{formatAmount(financialOverview.totalIncentives)}</div>
              <div className="text-sm text-amber-700 mt-1">인센티브 지출</div>
              <div className="text-xs text-neutral-600 mt-1">Staff Incentives</div>
            </div>
            <div className="text-center p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className={`text-3xl font-bold ${financialOverview.finalNetProfit >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                {formatAmount(financialOverview.finalNetProfit)}
              </div>
              <div className="text-sm text-neutral-700 mt-1">최종 순이익</div>
              <div className="text-xs text-neutral-600 mt-1">Final Net Profit</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-sm text-neutral-700">
              <span className="font-medium">공식:</span> 순이익 = 매출 - 매입 | 최종 순이익 = 순이익 - 인센티브 지출
            </div>
            <div className="text-xs text-neutral-600 mt-1">
              인센티브는 승인완료/지급완료 상태의 금액만 포함됩니다
            </div>
            {financialOverview.totalIncentives > financialOverview.netProfit && financialOverview.totalIncentives > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 rounded text-sm text-yellow-800">
                ⚠️ 인센티브 지출({formatAmount(financialOverview.totalIncentives)})이 순이익({formatAmount(financialOverview.netProfit)})을 초과했습니다! 검토가 필요합니다.
              </div>
            )}
            {financialOverview.totalIncentives > 0 && financialOverview.netProfit > 0 && (
              <div className="mt-2 text-xs text-primary-600">
                💡 인센티브 비율: {((financialOverview.totalIncentives / financialOverview.netProfit) * 100).toFixed(1)}% (순이익 대비)
              </div>
            )}
          </div>
        </div>
      )}

      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* 긴급 업무 섹션 - 관리자만 */}
      {user?.role !== 'STAFF' && urgentTasks.length > 0 && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200 rounded-2xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-red-800 mb-4">🚨 긴급 처리 필요 (3일 이상 대기)</h3>
          <div className="space-y-3">
            {urgentTasks.slice(0, 5).map(task => (
              <div key={task.id} className="bg-white/80 backdrop-blur-md p-3 rounded-xl border border-red-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-neutral-800">{task.title}</div>
                    <div className="text-sm text-neutral-600">
                      상태: {task.topicStatus || task.outlineStatus}
                    </div>
                  </div>
                  <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                    {Math.floor((new Date() - new Date(task.createdAt || task.creationTime)) / (1000 * 60 * 60 * 24))}일 경과
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 매입/지출 상세 현황 - 관리자만 */}
      {user?.role !== 'STAFF' && (
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200 shadow-card">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">💸 구매요청 및 발주승인 현황</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-primary-50 rounded-xl border border-primary-200">
            <div className="text-2xl font-bold text-primary-600">{purchaseStats.totalRequests}</div>
            <div className="text-sm text-primary-700 mt-1">총 발주</div>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="text-2xl font-bold text-amber-600">{purchaseStats.pendingRequests}</div>
            <div className="text-sm text-amber-700 mt-1">대기중</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="text-2xl font-bold text-green-600">{purchaseStats.approvedRequests}</div>
            <div className="text-sm text-green-700 mt-1">승인됨</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-xl border border-red-200">
            <div className="text-2xl font-bold text-red-600">{purchaseStats.rejectedRequests || 0}</div>
            <div className="text-sm text-red-700 mt-1">거절됨</div>
          </div>
          <div className="text-center p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-2xl font-bold text-neutral-700">{formatAmount(purchaseStats.totalAmount)}</div>
            <div className="text-sm text-neutral-600 mt-1">총 금액</div>
            <div className="text-xs text-neutral-500 mt-1">승인된 발주 cost_price</div>
          </div>
        </div>
      </div>
      )}

      {/* 캠페인 성과 분석 */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200 shadow-card">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">📈 캠페인 성과 분석</h3>
        {campaignPerformance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignPerformance.slice(0, 8).map((campaign, index) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-primary-500 text-white' :
                    index === 1 ? 'bg-primary-400 text-white' :
                    index === 2 ? 'bg-primary-300 text-white' :
                    'bg-neutral-300 text-neutral-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-neutral-800">{campaign.name}</div>
                    <div className="text-sm text-neutral-600">{campaign.clientName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-neutral-800">{campaign.completionRate}%</div>
                  <div className="text-xs text-neutral-600">{campaign.completed}/{campaign.total} 완료</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <div className="text-4xl mb-3">📊</div>
            <p>분석할 캠페인 데이터가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 업무 상태별 미리보기 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MiniTable title="⏳ 진행 중" rows={previewInProgress} />
        <MiniTable title="❌ 반려" rows={previewRejected} />
        <MiniTable title="✅ 발행 대기" rows={previewPublishReady} />
      </div>

      {/* 미수금 현황 알림 */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-neutral-200 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-800">💰 미수금 현황 알림</h3>
          <div className="flex items-center space-x-2 text-sm text-neutral-600">
            <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full font-medium">
              총 {receivablesStatus.pending_invoices.count + receivablesStatus.pending_payments.count}건
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 미발행 계산서 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
              <div>
                <h4 className="text-base font-semibold text-red-800">🧾 미발행 계산서</h4>
                <p className="text-sm text-red-600 mt-1">{receivablesStatus.pending_invoices.count}건 대기 중</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {formatAmount(receivablesStatus.pending_invoices.total_amount)}
                </div>
                <p className="text-xs text-neutral-600 mt-1">합계 금액</p>
              </div>
            </div>

            <div className="space-y-2">
              {receivablesStatus.pending_invoices.campaigns && receivablesStatus.pending_invoices.campaigns.length > 0 ? (
                receivablesStatus.pending_invoices.campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors cursor-pointer hover:shadow-md"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-800 truncate">{campaign.name}</div>
                        <div className="text-sm text-neutral-600 mt-1">
                          <span className="text-xs bg-neutral-200 px-2 py-0.5 rounded">{campaign.client}</span>
                          <span className="ml-2 text-xs text-neutral-500">담당: {campaign.staff_name || '-'}</span>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="font-bold text-red-600">{formatAmount(campaign.budget)}</div>
                        <div className="text-xs text-red-500 mt-1">{campaign.days_overdue}일 경과</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-neutral-500">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm">모든 계산서가 발행되었습니다!</p>
                </div>
              )}
            </div>
          </div>

          {/* 미입금 캠페인 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div>
                <h4 className="text-base font-semibold text-amber-800">💸 미입금 캠페인</h4>
                <p className="text-sm text-amber-600 mt-1">{receivablesStatus.pending_payments.count}건 대기 중</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-600">
                  {formatAmount(receivablesStatus.pending_payments.total_amount)}
                </div>
                <p className="text-xs text-neutral-600 mt-1">합계 금액</p>
              </div>
            </div>

            <div className="space-y-2">
              {receivablesStatus.pending_payments.campaigns && receivablesStatus.pending_payments.campaigns.length > 0 ? (
                receivablesStatus.pending_payments.campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors cursor-pointer hover:shadow-md"
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-800 truncate">{campaign.name}</div>
                        <div className="text-sm text-neutral-600 mt-1">
                          <span className="text-xs bg-neutral-200 px-2 py-0.5 rounded">{campaign.client}</span>
                          <span className="ml-2 text-xs text-neutral-500">담당: {campaign.staff_name || '-'}</span>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <div className="font-bold text-amber-600">{formatAmount(campaign.budget)}</div>
                        <div className="text-xs text-amber-500 mt-1">{campaign.days_overdue}일 경과</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-neutral-500">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-sm">모든 입금이 완료되었습니다!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
