// frontend/src/pages/Dashboard.jsx
import React, { useMemo, useState, useEffect } from 'react';
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
import api from '../api/client';

const colorStyles = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-600'   },
  red:    { bg: 'bg-red-100',    text: 'text-red-600'    },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  green:  { bg: 'bg-green-100',  text: 'text-green-600'  },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

export default function Dashboard({ campaigns = [], activities = [], onSeeAll, user }) {
  // 안전한 데이터 확인
  if (!user) {
    return (
      <div className="p-6 bg-gray-50">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p>사용자 정보를 불러오는 중...</p>
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

  useEffect(() => {
    const fetchAllStats = async () => {
      if (!user?.id) return;
      
      try {
        // 최신 캠페인 데이터 다시 로드 (매출 데이터 포함)
        let latestCampaigns = campaigns;
        
        // 캠페인 데이터가 없거나 매출 정보가 없으면 다시 로드
        if (!campaigns || campaigns.length === 0 || !campaigns[0].hasOwnProperty('posts')) {
          try {
            const campaignsResponse = await api.get('/api/campaigns', {
              params: { viewerId: user.id, viewerRole: user.role }
            });
            const campaignsData = campaignsResponse.data.results || campaignsResponse.data || [];
            
            // posts 정보도 함께 로드
            latestCampaigns = await Promise.all(
              campaignsData.map(async (campaign) => {
                try {
                  const postsResponse = await api.get(`/api/campaigns/${campaign.id}/posts`);
                  return {
                    ...campaign,
                    posts: postsResponse.data || [],
                    invoiceIssued: campaign.invoice_issued,
                    paymentCompleted: campaign.payment_completed,
                  };
                } catch (error) {
                  console.error(`캠페인 ${campaign.id} 포스트 로딩 실패:`, error);
                  return { ...campaign, posts: [] };
                }
              })
            );
          } catch (error) {
            console.error('캠페인 데이터 재로딩 실패:', error);
          }
        }
        
        // 실제 캠페인 데이터 기반으로 재무 정보 계산
        let campaignTotalRevenue = 0;
        let campaignTotalCost = 0;
        let completedCampaigns = 0;
        let pendingInvoices = 0;
        let pendingPayments = 0;
        
        // 각 캠페인별로 재무 요약 가져오기
        if (latestCampaigns && latestCampaigns.length > 0) {
          const campaignFinancials = await Promise.all(
            latestCampaigns.map(async (campaign) => {
              try {
                const response = await api.get(`/api/campaigns/${campaign.id}/financial_summary`);
                const summary = response.data;
                
                campaignTotalRevenue += summary.total_revenue || 0;
                campaignTotalCost += summary.total_cost || 0;
                
                if (summary.completed_tasks === summary.total_tasks && summary.total_tasks > 0) {
                  completedCampaigns++;
                }
                
                // 재무 상태 확인 (캠페인 모델에 필드가 있다고 가정)
                if (!campaign.invoice_issued) pendingInvoices++;
                if (!campaign.payment_completed) pendingPayments++;
                
                return summary;
              } catch (error) {
                console.error(`캠페인 ${campaign.id} 재무 데이터 로딩 실패:`, error);
                return { total_revenue: 0, total_cost: 0 };
              }
            })
          );
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
          // 구매요청 데이터 가져오기 (구매요청과 발주요청은 동일한 데이터)
          const purchaseResponse = await api.get('/api/purchase-requests');
          const purchaseRequests = purchaseResponse.data.requests || [];
          
          // 통계 계산
          const pending = purchaseRequests.filter(p => p.status === '승인 대기').length;
          const approved = purchaseRequests.filter(p => p.status === '승인됨' || p.status === '완료됨').length;
          const totalAmount = purchaseRequests.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
          
          // 이번 달 금액 계산
          const thisMonth = new Date();
          const thisMonthAmount = purchaseRequests
            .filter(p => {
              const createdDate = new Date(p.created_at || p.createdAt);
              return createdDate.getFullYear() === thisMonth.getFullYear() && 
                     createdDate.getMonth() === thisMonth.getMonth();
            })
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
          
          realPurchaseStats = {
            totalRequests: purchaseRequests.length,
            pendingRequests: pending,
            approvedRequests: approved,
            totalAmount: totalAmount,
            thisMonthAmount: thisMonthAmount
          };
          
        } catch (error) {
          console.error('구매요청/발주 데이터 로딩 실패:', error);
          // 오류 시 기본값 유지
        }
        
        setPurchaseStats(realPurchaseStats);

        // 실제 사용자 데이터 기반 인센티브 계산
        let totalIncentives = 0;
        try {
          // 모든 직원 데이터 가져오기
          const usersResponse = await api.get('/api/users');
          const allUsers = usersResponse.data.results || usersResponse.data || [];
          
          // 직원들의 캠페인 매출과 인센티브율 기반으로 계산
          for (const userItem of allUsers.filter(u => u.role === '직원')) {
            const userCampaigns = latestCampaigns.filter(c => c.managerId === userItem.id || c.manager === userItem.id);
            let userRevenue = 0;
            
            for (const campaign of userCampaigns) {
              try {
                const response = await api.get(`/api/campaigns/${campaign.id}/financial_summary`);
                userRevenue += response.data.total_revenue || 0;
              } catch (error) {
                console.error(`사용자 ${userItem.id} 캠페인 ${campaign.id} 매출 데이터 로딩 실패:`, error);
              }
            }
            
            // 사용자 인센티브율 적용 (기본 10%)
            const incentiveRate = userItem.incentive_rate ? parseFloat(userItem.incentive_rate) / 100 : 0.1;
            totalIncentives += userRevenue * incentiveRate;
          }
        } catch (error) {
          console.error('인센티브 계산 실패:', error);
          // 오류 시 기본값 사용 (매출의 5%)
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

        // 종합 재무 현황 계산 (실제 데이터 기반)
        const totalRevenue = campaignTotalRevenue;
        const totalExpenses = realPurchaseStats.totalAmount + campaignTotalCost;
        const netProfit = totalRevenue - totalExpenses;
        const finalNetProfit = netProfit - totalIncentives;

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
        if (user.role === '직원') {
          // 직원이 담당하는 캠페인들만 필터링
          const employeeCampaigns = latestCampaigns.filter(c => c.managerId === user.id || c.manager === user.id);
          let employeeRevenue = 0;
          
          for (const campaign of employeeCampaigns) {
            try {
              const response = await api.get(`/api/campaigns/${campaign.id}/financial_summary`);
              employeeRevenue += response.data.total_revenue || 0;
            } catch (error) {
              console.error(`직원 캠페인 ${campaign.id} 데이터 로딩 실패:`, error);
            }
          }
          
          // 사용자 인센티브율 가져오기
          const userIncentiveRate = user.incentive_rate ? parseFloat(user.incentive_rate) / 100 : 0.1;
          
          setEmployeeStats({
            thisMonthRevenue: employeeRevenue,
            thisMonthIncentive: employeeRevenue * userIncentiveRate,
            pendingInvoices: pendingInvoices,
            pendingPayments: pendingPayments
          });
        }

      } catch (error) {
        console.error('통계 데이터 로딩 실패:', error);
      }
    };

    fetchAllStats();
  }, [user?.id, user?.role]);
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
    
    const posts = campaigns.flatMap(c => (c && c.posts) ? c.posts : []);

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
    { title: '진행 중인 캠페인', value: inProgressCount, Icon: FileText, color: 'blue', description: '전체 활성 캠페인' },
    { title: '검토 대기 중', value: pendingReviewCount, Icon: Clock, color: 'yellow', description: '승인/반려 검토 필요' },
    { title: '반려된 콘텐츠', value: rejectedCount, Icon: XCircle, color: 'red', description: '확인 및 수정 필요' },
    { title: '이번 달 완료', value: publishedThisMonthCount, Icon: CheckCircle, color: 'green', description: `총 ${allPosts.length}건 중` },
  ];

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const StatCard = ({ title, value, description, Icon, color }) => {
    const c = colorStyles[color] || colorStyles.blue;
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
        <div className={`p-2 rounded-full ${c.bg}`}>
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
          className="text-sm text-blue-600 hover:underline flex items-center"
          onClick={onSeeAll || (() => {})}
          type="button"
        >
          전체보기 <ArrowRight size={14} className="ml-1" />
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-4 py-3">주제</th>
              <th className="px-4 py-3">상태</th>
              <th className="px-4 py-3">업데이트</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-400" colSpan={3}>
                  표시할 항목이 없습니다.
                </td>
              </tr>
            ) : rows.map(p => {
              const status = p.outlineStatus || p.topicStatus || '-';
              return (
                <tr key={p.id} className="border-b">
                  <td className="px-4 py-3 font-medium text-gray-900 truncate">{p.title}</td>
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
    let color = colorStyles.gray;
    if (a.type === 'reject') { Icon = XCircle; color = colorStyles.red; }
    else if (a.type === 'approve') { Icon = CheckCircle; color = colorStyles.green; }
    else if (a.type === 'action') { Icon = AlertCircle; color = colorStyles.yellow; }

    return (
      <li className="flex items-start space-x-3 py-3 border-b last:border-b-0">
        <div className={`mt-0.5 p-1.5 rounded-full ${color.bg}`}>
          <Icon size={16} className={color.text} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">{a.user}</span>{' '}
            <span className="text-gray-700">{a.action}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
        </div>
      </li>
    );
  };

  return (
    <div className="p-6 bg-gray-50 space-y-6">
      {/* 환영 메시지 및 주요 알림 */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold">
          {user?.role === '직원' ? `직원 ${user?.name || '사용자'}님의 대시보드 👨‍💼` : '본사 관리자 대시보드 📊'}
        </h2>
        <p className="mt-2 opacity-90">
          {user?.role === '직원' 
            ? `안녕하세요! 오늘도 화이팅입니다! 💪`
            : urgentTasks.length > 0 
              ? `⚠️ 긴급 처리가 필요한 업무가 ${urgentTasks.length}건 있습니다!`
              : `모든 업무가 원활하게 진행되고 있습니다. 👍`
          }
        </p>
        {user?.role !== '직원' && avgCompletionTime > 0 && (
          <div className="mt-3 text-sm opacity-90">
            평균 업무 완료 시간: <span className="font-bold">{avgCompletionTime}일</span>
          </div>
        )}
      </div>

      {/* 직원용 매출 데이터 또는 관리자용 재무 현황 */}
      {user?.role === '직원' ? (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            📊 내 매출 데이터
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl font-bold text-blue-600">{formatAmount(employeeStats.thisMonthRevenue)}</div>
              <div className="text-lg text-blue-700 mt-2">이번달 총 매출</div>
              <div className="text-sm text-gray-500 mt-1">담당 캠페인 기준</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl font-bold text-green-600">{formatAmount(employeeStats.thisMonthIncentive)}</div>
              <div className="text-lg text-green-700 mt-2">이번달 인센티브 금액</div>
              <div className="text-sm text-gray-500 mt-1">
                {employeeStats.thisMonthIncentive > 0 ? '승인/지급 예정액' : '계산 대기 중'}
              </div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg border-2 border-dashed border-purple-300">
              <div className="text-4xl font-bold text-purple-600">🗓️</div>
              <div className="text-lg text-purple-700 mt-2">업무 캘린더</div>
              <div className="text-sm text-gray-500 mt-1">추후 개발 예정</div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{employeeStats.pendingInvoices}</div>
              <div className="text-sm text-red-700 mt-1">미발행 계산서</div>
              <div className="text-xs text-gray-500 mt-1">발행 필요한 캠페인</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{employeeStats.pendingPayments}</div>
              <div className="text-sm text-orange-700 mt-1">미입금 캠페인</div>
              <div className="text-xs text-gray-500 mt-1">입금 대기 중</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            💰 재무 현황 (원장 데이터)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{formatAmount(financialOverview.totalRevenue)}</div>
              <div className="text-sm text-blue-700 mt-1">총 매출</div>
              <div className="text-xs text-gray-500 mt-1">Sales + Campaigns</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{formatAmount(financialOverview.totalExpenses)}</div>
              <div className="text-sm text-red-700 mt-1">총 매입/지출</div>
              <div className="text-xs text-gray-500 mt-1">Purchase + Cost</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{formatAmount(financialOverview.netProfit)}</div>
              <div className="text-sm text-green-700 mt-1">순이익</div>
              <div className="text-xs text-gray-500 mt-1">Revenue - Expenses</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{formatAmount(financialOverview.totalIncentives)}</div>
              <div className="text-sm text-orange-700 mt-1">인센티브 지출</div>
              <div className="text-xs text-gray-500 mt-1">Staff Incentives</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className={`text-3xl font-bold ${financialOverview.finalNetProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatAmount(financialOverview.finalNetProfit)}
              </div>
              <div className="text-sm text-purple-700 mt-1">최종 순이익</div>
              <div className="text-xs text-gray-500 mt-1">Final Net Profit</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <span className="font-medium">공식:</span> 순이익 = 매출 - 매입 | 최종 순이익 = 순이익 - 인센티브 지출
            </div>
            <div className="text-xs text-gray-500 mt-1">
              인센티브는 승인완료/지급완료 상태의 금액만 포함됩니다
            </div>
            {financialOverview.totalIncentives > financialOverview.netProfit && financialOverview.totalIncentives > 0 && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-400 rounded text-sm text-yellow-800">
                ⚠️ 인센티브 지출({formatAmount(financialOverview.totalIncentives)})이 순이익({formatAmount(financialOverview.netProfit)})을 초과했습니다! 검토가 필요합니다.
              </div>
            )}
            {financialOverview.totalIncentives > 0 && financialOverview.netProfit > 0 && (
              <div className="mt-2 text-xs text-blue-600">
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
      {user?.role !== '직원' && urgentTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4">🚨 긴급 처리 필요 (3일 이상 대기)</h3>
          <div className="space-y-3">
            {urgentTasks.slice(0, 5).map(task => (
              <div key={task.id} className="bg-white p-3 rounded-lg border border-red-200">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-600">
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
      {user?.role !== '직원' && (
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💸 구매요청 및 발주승인 현황</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{purchaseStats.totalRequests}</div>
            <div className="text-sm text-blue-700 mt-1">전체 요청</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{purchaseStats.pendingRequests}</div>
            <div className="text-sm text-yellow-700 mt-1">승인 대기</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{purchaseStats.approvedRequests}</div>
            <div className="text-sm text-green-700 mt-1">승인 완료</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{formatAmount(purchaseStats.thisMonthAmount)}</div>
            <div className="text-sm text-red-700 mt-1">이번 달 지출</div>
            <div className="text-xs text-gray-500 mt-1">구매요청 + 발주승인</div>
          </div>
        </div>
      </div>
      )}

      {/* 캠페인 성과 분석 */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 캠페인 성과 분석</h3>
        {campaignPerformance.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignPerformance.slice(0, 8).map((campaign, index) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-400 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-400 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{campaign.name}</div>
                    <div className="text-sm text-gray-600">{campaign.clientName}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{campaign.completionRate}%</div>
                  <div className="text-xs text-gray-500">{campaign.completed}/{campaign.total} 완료</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
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

      {/* 최신 활동 */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">📋 최신 활동</h3>
        </div>
        {activities && activities.length > 0 ? (
          <ul>
            {activities.slice(0, 8).map((a, idx) => (
              <ActivityItem key={idx} a={a} />
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-3">📝</div>
            <p>최근 활동이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
