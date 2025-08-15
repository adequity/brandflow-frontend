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
  const [purchaseStats, setPurchaseStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalAmount: 0,
    thisMonthAmount: 0
  });

  useEffect(() => {
    const fetchPurchaseStats = async () => {
      if (!user?.id) return;
      
      try {
        const { data } = await api.get('/api/purchase-requests/summary/stats', {
          params: {
            viewerId: user.id,
            viewerRole: user.role
          }
        });
        setPurchaseStats(data);
      } catch (error) {
        console.error('구매요청 통계 로딩 실패:', error);
      }
    };

    fetchPurchaseStats();
  }, [user]);
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
    const posts = campaigns.flatMap(c => c.posts || []);

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
    const campaignPerformance = campaigns.map(c => {
      const posts = c.posts || [];
      const total = posts.length;
      const completed = posts.filter(p => p.publishedUrl).length;
      const pending = posts.filter(isPendingReview).length;
      const rejected = posts.filter(isRejected).length;
      
      return {
        id: c.id,
        name: c.name,
        clientName: c.Client?.name || 'Unknown',
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
          onClick={onSeeAll}
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
        <h2 className="text-2xl font-bold">관리자 대시보드 📊</h2>
        <p className="mt-2 opacity-90">
          {urgentTasks.length > 0 
            ? `⚠️ 긴급 처리가 필요한 업무가 ${urgentTasks.length}건 있습니다!`
            : `모든 업무가 원활하게 진행되고 있습니다. 👍`
          }
        </p>
        {avgCompletionTime > 0 && (
          <div className="mt-3 text-sm opacity-90">
            평균 업무 완료 시간: <span className="font-bold">{avgCompletionTime}일</span>
          </div>
        )}
      </div>

      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* 긴급 업무 섹션 */}
      {urgentTasks.length > 0 && (
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

      {/* 구매요청 현황 */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 구매요청 현황</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{purchaseStats.totalRequests}</div>
            <div className="text-sm text-gray-600">전체 요청</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{purchaseStats.pendingRequests}</div>
            <div className="text-sm text-gray-600">승인 대기</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{purchaseStats.approvedRequests}</div>
            <div className="text-sm text-gray-600">승인 완료</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{formatAmount(purchaseStats.totalAmount)}</div>
            <div className="text-sm text-gray-600">총 승인금액</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-600">{formatAmount(purchaseStats.thisMonthAmount)}</div>
            <div className="text-sm text-gray-600">이번 달</div>
          </div>
        </div>
      </div>

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
