// frontend/src/pages/Dashboard.jsx
import React, { useMemo } from 'react';
import {
  FileText,
  XCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

const colorStyles = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-600'   },
  red:    { bg: 'bg-red-100',    text: 'text-red-600'    },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  green:  { bg: 'bg-green-100',  text: 'text-green-600'  },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

export default function Dashboard({ campaigns = [], activities = [], onSeeAll }) {
  const {
    allPosts,
    inProgressCount,
    rejectedCount,
    publishReadyCount,
    publishedThisMonthCount,
    previewInProgress,
    previewRejected,
    previewPublishReady,
  } = useMemo(() => {
    const posts = campaigns.flatMap(c => c.posts || []);

    const isRejected = (p) =>
      (p.topicStatus && p.topicStatus.includes('반려')) ||
      (p.outlineStatus && p.outlineStatus.includes('반려'));

    const isPublishReady = (p) =>
      p.topicStatus === '주제 승인' &&
      p.outlineStatus === '목차 승인' &&
      !p.publishedUrl;

    const isPublishedThisMonth = (p) => {
      if (!p.publishedUrl) return false;
      const d = new Date(p.updatedAt || p.createdAt);
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };

    const inProgressCount = campaigns.length;
    const rejectedCount = posts.filter(isRejected).length;
    const publishReadyCount = posts.filter(isPublishReady).length;
    const publishedThisMonthCount = posts.filter(isPublishedThisMonth).length;

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
      previewInProgress,
      previewRejected,
      previewPublishReady,
    };
  }, [campaigns]);

  const stats = [
    { title: '진행 중인 캠페인', value: inProgressCount, Icon: FileText,  color: 'blue',   description: '전체 활성 캠페인' },
    { title: '반려된 콘텐츠',   value: rejectedCount,  Icon: XCircle,   color: 'red',    description: '확인 및 수정 필요' },
    { title: '발행 대기',       value: publishReadyCount, Icon: Clock,    color: 'yellow', description: '주제/목차 승인 완료' },
    { title: '이번 달 발행 완료', value: publishedThisMonthCount, Icon: CheckCircle, color: 'green',  description: `총 ${allPosts.length}건 콘텐츠` },
  ];

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
      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* 미리보기 3열 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MiniTable title="진행 중"   rows={previewInProgress} />
        <MiniTable title="반려"     rows={previewRejected} />
        <MiniTable title="발행 대기" rows={previewPublishReady} />
      </div>

      {/* 최신 알림 */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">최신 알림</h3>
          {/* 필요하면 알림 전체 페이지로 이동하는 버튼 연결 */}
          {/* <button className="text-sm text-blue-600 hover:underline">더보기</button> */}
        </div>
        {activities && activities.length > 0 ? (
          <ul>
            {activities.slice(0, 8).map((a, idx) => (
              <ActivityItem key={idx} a={a} />
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-400">최근 알림이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
