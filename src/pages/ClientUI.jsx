// src/pages/ClientUI.jsx
import React, { useEffect, useState } from 'react';
import { Home, FileText, ChevronDown, ArrowRight, LogOut, Search, Link as LinkIcon } from 'lucide-react';
import api from '../api/client';
import NotificationBell from '../components/common/NotificationBell';
import ImagePreview from '../components/common/ImagePreview';
import LogoDisplay from '../components/LogoDisplay';
import { useToast } from '../contexts/ToastContext';

/* ============ Helpers ============ */
const StatusBadge = ({ status, onClick, clickable }) => {
  const base = 'px-2.5 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap';
  const styles = {
    '주제 승인 대기': 'bg-yellow-100 text-yellow-800',
    '목차 승인 대기': 'bg-yellow-100 text-yellow-800',
    '주제 승인': 'bg-green-100 text-green-800',
    '목차 승인': 'bg-green-100 text-green-800',
    '주제 반려': 'bg-red-100 text-red-800',
    '목차 반려': 'bg-red-100 text-red-800',
    '발행 완료': 'bg-blue-100 text-blue-800',
  };
  const className = `${base} ${styles[status] || 'bg-gray-100 text-gray-800'} ${clickable ? 'cursor-pointer hover:opacity-80' : ''}`;

  return (
    <span
      className={className}
      onClick={clickable ? onClick : undefined}
      title={clickable ? '클릭하여 상태 변경' : ''}
    >
      {status}
    </span>
  );
};

const StatusDropdown = ({ post, field, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const currentStatus = field === 'topic'
    ? (post.topicStatus || post.topic_status)
    : (post.outlineStatus || post.outline_status);

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    const newStatus = field === 'topic' ? '주제 반려' : '목차 반려';
    onUpdate(post.id, newStatus, rejectReason, field);
    setIsOpen(false);
    setRejectMode(false);
    setRejectReason('');
  };

  const handleStatusChange = (newStatus) => {
    onUpdate(post.id, newStatus, null, field);
    setIsOpen(false);
  };

  // 상태 옵션 정의
  const statusOptions = field === 'topic'
    ? ['주제 승인 대기', '주제 승인', '주제 반려']
    : ['목차 승인 대기', '목차 승인', '목차 반려'];

  return (
    <div className="relative inline-block">
      <StatusBadge
        status={currentStatus}
        onClick={() => setIsOpen(!isOpen)}
        clickable={true}
      />

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => { setIsOpen(false); setRejectMode(false); setRejectReason(''); }}
          />
          <div className="absolute left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
            {!isRejectMode ? (
              <div className="py-1">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      if (status.includes('반려')) {
                        setRejectMode(true);
                      } else {
                        handleStatusChange(status);
                      }
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center ${
                      status.includes('승인 대기') ? 'text-yellow-700' :
                      status.includes('승인') ? 'text-green-700' :
                      'text-red-700'
                    } ${currentStatus === status ? 'bg-gray-100 font-semibold' : ''}`}
                  >
                    {status.includes('승인 대기') ? '⏳' :
                     status.includes('승인') ? '✅' : '❌'} {status}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3">
                <p className="text-xs font-medium text-gray-700 mb-2">반려 사유</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="반려 사유를 입력하세요"
                  className="w-full p-2 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  rows="3"
                  autoFocus
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => { setRejectMode(false); setRejectReason(''); }}
                    className="flex-1 px-3 py-1.5 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    반려 제출
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const formatUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return `https://${url}`;
};

/* ============ Layout ============ */
const ClientSidebar = ({ activePage, setActivePage }) => {
  const menu = [
    { id: 'dashboard', label: '대시보드', icon: <Home size={20} /> },
    { id: 'campaigns', label: '캠페인 목록', icon: <FileText size={20} /> },
  ];
  return (
    <div className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shrink-0 shadow-lg">
      <div className="h-16 flex items-center px-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-purple-600">
        <LogoDisplay size="medium" />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menu.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => setActivePage(item.id, null)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActivePage(item.id, null)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group ${
              activePage === item.id
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md transform scale-105'
                : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-gray-900 hover:shadow-sm'
            }`}
          >
            <span className={`transition-transform duration-200 ${activePage === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="ml-3">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

const ClientHeader = ({ user, onLogout, title }) => {
  const [open, setOpen] = useState(false);
  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-6 shrink-0 shadow-sm">
      <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{title}</h2>
      <div className="flex items-center space-x-4">
        <NotificationBell />
        <div className="relative">
        <div onClick={() => setOpen((v) => !v)} className="flex items-center space-x-2 cursor-pointer">
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{user?.name} 님</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            <ChevronDown size={20} />
          </button>
        </div>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <LogOut size={16} className="mr-2" />
              로그아웃
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
};

/* ============ Pages ============ */
const ClientDashboard = ({ user, campaigns, setActivePage }) => {
  // 안전한 posts 추출: flatMap 대신 호환성이 좋은 방법 사용
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const allPosts = safeCampaigns.reduce((acc, c) => {
    // c가 객체이고 posts가 배열인지 확인
    if (c && Array.isArray(c.posts)) {
      return acc.concat(c.posts);
    }
    return acc; // posts가 없거나 배열이 아니면 현재 누적값 반환
  }, []);
  
  // 상태별 통계
  const pendingTopics = allPosts.filter((p) => p.topicStatus === '주제 승인 대기').length;
  const pendingOutlines = allPosts.filter((p) => (p.outlineStatus || p.outline_status) === '목차 승인 대기').length;
  const rejectedPosts = allPosts.filter((p) => (p.topicStatus || p.topic_status) === '주제 반려' || (p.outlineStatus || p.outline_status) === '목차 반려').length;
  const completedPosts = allPosts.filter((p) => p.publishedUrl).length;
  const totalPending = pendingTopics + pendingOutlines;
  
  // 최근 활동
  const recentlyPublished = allPosts.filter((p) => p.publishedUrl).slice(0, 3);
  const recentlyUpdated = allPosts
    .filter((p) => p.updatedAt || p.createdAt)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  // 진행률 계산
  const totalTasks = allPosts.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedPosts / totalTasks) * 100) : 0;

  // 이번 주 활동
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisWeekPosts = allPosts.filter(p => {
    const postDate = new Date(p.createdAt || p.creationTime);
    return postDate >= thisWeekStart;
  }).length;

  return (
    <div className="p-6 space-y-6">
      {/* 환영 메시지 및 주요 알림 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold">{user?.name}님, 안녕하세요! 👋</h2>
        <p className="mt-2 opacity-90">
          {totalPending > 0 
            ? `검토가 필요한 콘텐츠가 ${totalPending}건 있습니다. 빠른 검토 부탁드려요!`
            : `모든 업무가 최신 상태입니다! 🎉`
          }
        </p>
        {totalTasks > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>전체 진행률</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 상태별 카드 통계 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border-l-4 border-yellow-400 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 group-hover:text-yellow-700 transition-colors">주제 승인 대기</p>
              <p className="text-3xl font-bold text-yellow-600 group-hover:scale-110 transition-transform">{pendingTopics}</p>
            </div>
            <div className="text-4xl group-hover:scale-125 transition-transform">📝</div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border-l-4 border-orange-400 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 group-hover:text-orange-700 transition-colors">목차 승인 대기</p>
              <p className="text-3xl font-bold text-orange-600 group-hover:scale-110 transition-transform">{pendingOutlines}</p>
            </div>
            <div className="text-4xl group-hover:scale-125 transition-transform">📋</div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border-l-4 border-red-400 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 group-hover:text-red-700 transition-colors">반려된 업무</p>
              <p className="text-3xl font-bold text-red-600 group-hover:scale-110 transition-transform">{rejectedPosts}</p>
            </div>
            <div className="text-4xl group-hover:scale-125 transition-transform">❌</div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border-l-4 border-green-400 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 group-hover:text-green-700 transition-colors">완료된 업무</p>
              <p className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform">{completedPosts}</p>
            </div>
            <div className="text-4xl group-hover:scale-125 transition-transform">✅</div>
          </div>
        </div>
      </div>

      {/* 이번 주 활동 요약 */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 shadow-md hover:shadow-xl transition-shadow duration-300">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">📊 이번 주 활동 요약</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{thisWeekPosts}</div>
            <div className="text-sm text-gray-600">새 업무 등록</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{totalTasks}</div>
            <div className="text-sm text-gray-600">전체 업무</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{progressPercentage}%</div>
            <div className="text-sm text-gray-600">완료율</div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 진행 중인 캠페인 */}
        <div className="xl:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">🎯 진행 중인 캠페인</h3>
              <button
                onClick={() => setActivePage('campaigns', null)}
                className="text-sm text-blue-600 hover:underline flex items-center"
              >
                전체보기 <ArrowRight size={14} className="ml-1" />
              </button>
            </div>

            {campaigns && campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.slice(0, 4).map((c) => {
                  // posts가 배열인지 안전하게 확인
                  const safePosts = Array.isArray(c.posts) ? c.posts : [];
                  const total = safePosts.length;
                  const completed = safePosts.filter((p) => p && p.publishedUrl).length;
                  const pending = safePosts.filter(
                    (p) => p && ((p.topicStatus || p.topic_status)?.includes('대기') || (p.outlineStatus || p.outline_status)?.includes('대기'))
                  ).length;
                  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setActivePage('campaignDetail', c.id)}
                      className="p-5 rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm hover:border-blue-400 hover:shadow-xl hover:scale-[1.02] cursor-pointer transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">{c.name}</h4>
                            {pending > 0 && (
                              <span className="bg-gradient-to-r from-red-100 to-orange-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                                검토필요 {pending}
                              </span>
                            )}
                            {total === completed && total > 0 && (
                              <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
                                완료 ✅
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-700 transition-colors">담당자: {c.User?.name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{progressPercent}%</div>
                          <div className="text-xs text-gray-500">{completed}/{total} 완료</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            progressPercent === 100
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">📋</div>
                <p>아직 등록된 캠페인이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 최근 활동 */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 shadow-md hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">⚡ 최근 활동</h3>
            {recentlyUpdated.length > 0 ? (
              <div className="space-y-3">
                {recentlyUpdated.map((p) => (
                  <div key={p.id} className="border-l-4 border-blue-300 pl-4 py-2 hover:bg-blue-50/50 rounded-r-lg transition-all duration-200 cursor-pointer group">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(p.updatedAt || p.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                    <div className="mt-2">
                      <StatusBadge status={p.topicStatus || p.outlineStatus} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">최근 활동이 없습니다.</p>
            )}
          </div>

          {/* 발행된 글 */}
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 shadow-md hover:shadow-xl transition-all duration-300">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">🎉 최근 발행된 글</h3>
            {recentlyPublished.length > 0 ? (
              <div className="space-y-4">
                {recentlyPublished.map((p) => (
                  <div key={p.id} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200 group">
                    <div className="font-medium text-gray-900 line-clamp-2 mb-3 group-hover:text-green-700 transition-colors">{p.title}</div>
                    <a
                      href={formatUrl(p.publishedUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                    >
                      <LinkIcon size={14} className="mr-1.5" />
                      링크 보기
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <div className="text-3xl mb-2">📝</div>
                <p className="text-sm">아직 발행된 글이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 빠른 액션 */}
          {totalPending > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200/50 shadow-md hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-yellow-700 to-orange-700 bg-clip-text text-transparent mb-3">⚡ 빠른 액션</h3>
              <button
                onClick={() => setActivePage('campaigns', null)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                대기 중인 {totalPending}건 검토하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClientCampaignList = ({ campaigns, setActivePage }) => {
  const [term, setTerm] = useState('');
  
  // 안전한 배열 처리: campaigns가 배열인지 확인
  const safeCampaigns = Array.isArray(campaigns) ? campaigns : [];
  const filtered = safeCampaigns.filter((c) => {
    // c가 객체이고 name 속성이 있는지 확인
    if (!c || typeof c.name !== 'string') {
      return false;
    }
    return c.name.toLowerCase().includes(term.toLowerCase());
  });

  return (
    <div className="p-6">
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200/50 shadow-lg">
        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="캠페인명 검색..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="pl-10 pr-4 py-3 w-full max-w-md border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200 hover:shadow-md"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200/50 shadow-sm">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50 text-xs text-gray-700 uppercase border-b border-gray-200">
              <tr>
                <th className="px-5 py-4 font-semibold">캠페인명</th>
                <th className="px-5 py-4 font-semibold">담당자</th>
                <th className="px-5 py-4 font-semibold">진행률</th>
                <th className="px-5 py-4 font-semibold">승인대기</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200/50">
              {filtered.map((c) => {
                // posts가 배열인지 안전하게 확인
                const safePosts = Array.isArray(c.posts) ? c.posts : [];
                const total = safePosts.length;
                const completed = safePosts.filter((p) => p && p.publishedUrl).length;
                const pending = safePosts.filter(
                  (p) => p && ((p.topicStatus || p.topic_status)?.includes('대기') || (p.outlineStatus || p.outline_status)?.includes('대기'))
                ).length;

                return (
                  <tr
                    key={c.id}
                    onClick={() => setActivePage('campaignDetail', c.id)}
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 cursor-pointer transition-all duration-200 group"
                  >
                    <td className="px-5 py-4 font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{c.name}</td>
                    <td className="px-5 py-4 text-gray-700">{c.User?.name || c.creator_name || 'N/A'}</td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-gray-900">{completed}/{total}</span>
                    </td>
                    <td className="px-5 py-4">
                      {pending > 0 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 shadow-sm">
                          {pending} 건
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ClientCampaignDetail = ({ campaign, setActivePage, onUpdatePostStatus, showWarning }) => {
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const openReview = (post) => { setSelectedPost(post); setReviewModalOpen(true); };
  const openDetail = (post) => { setSelectedPost(post); setDetailModalOpen(true); };
  const closeModals = () => { setReviewModalOpen(false); setDetailModalOpen(false); setSelectedPost(null); };

  if (!campaign) return <div className="p-6">캠페인 정보를 불러오는 중...</div>;

  return (
    <div className="p-6">
      <button
        onClick={() => setActivePage('campaigns', null)}
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 mb-6 transition-colors group"
      >
        <span className="group-hover:-translate-x-1 transition-transform duration-200">&larr;</span>
        <span className="ml-2">캠페인 목록으로</span>
      </button>

      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl border border-gray-200/50 shadow-lg">
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{campaign.name}</h2>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            담당자: <span className="font-medium text-gray-800">{campaign.User?.name || campaign.creator_name || 'N/A'}</span>
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200/50 shadow-sm">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-4 font-semibold">업무 타입</th>
                <th className="px-3 py-4 font-semibold">업무 내용</th>
                <th className="px-3 py-4 text-center font-semibold">견적 금액</th>
                <th className="px-3 py-4 font-semibold">승인 상태</th>
                <th className="px-3 py-4 font-semibold">세부사항 검토</th>
                <th className="px-3 py-4 font-semibold">세부사항 승인 상태</th>
                <th className="px-3 py-4 text-center font-semibold">재무 상태</th>
                <th className="px-3 py-4 font-semibold">결과물 링크</th>
                <th className="px-3 py-4 font-semibold">작성 시간</th>
                <th className="px-3 py-4 text-center font-semibold">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200/50">
              {(campaign.posts || []).map((post) => {
                const isPending = ((post.topicStatus || post.topic_status) && (post.topicStatus || post.topic_status).includes('대기')) ||
                                 ((post.outlineStatus || post.outline_status) && (post.outlineStatus || post.outline_status).includes('대기'));
                const isPublished = !!post.publishedUrl;
                const created = post.creationTime || post.createdAt;

                return (
                  <tr key={post.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200 group">
                    <td className="px-3 py-3">
                      <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm">
                        {post.workType || '블로그'}
                      </span>
                    </td>
                    <td
                      onClick={() => openDetail(post)}
                      className="px-3 py-3 font-semibold text-gray-900 hover:text-blue-700 cursor-pointer transition-colors"
                    >
                      {post.title}
                    </td>
                    {/* 견적 금액 */}
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {post.budget && post.budget > 0 ? (
                          `${post.budget.toLocaleString()}원`
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusDropdown post={post} field="topic" onUpdate={onUpdatePostStatus} />
                    </td>
                    <td
                      onClick={() => openDetail(post)}
                      className="px-3 py-3 hover:text-blue-600 cursor-pointer transition-colors"
                    >
                      {post.outline ? (
                        <span className="text-xs truncate max-w-xs block">{post.outline}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <StatusDropdown post={post} field="outline" onUpdate={onUpdatePostStatus} />
                    </td>
                    {/* 재무 상태 */}
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        {/* 계산서 발행 */}
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${post.invoiceIssued ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                          <span className={`text-xs font-medium ${post.invoiceIssued ? 'text-blue-600' : 'text-gray-500'}`}>
                            {post.invoiceIssued ? '📄 발행' : '📄 미발행'}
                          </span>
                        </div>
                        {post.invoiceDueDate && (
                          <div className={`text-xs ${
                            !post.invoiceIssued && new Date(post.invoiceDueDate) < new Date()
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}>
                            {!post.invoiceIssued && new Date(post.invoiceDueDate) < new Date() && '⚠️ '}
                            {new Date(post.invoiceDueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                        {/* 입금 완료 */}
                        <div className="flex items-center space-x-1 pt-1">
                          <span className={`w-2 h-2 rounded-full ${post.paymentCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span className={`text-xs font-medium ${post.paymentCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                            {post.paymentCompleted ? '💰 완료' : '💰 대기'}
                          </span>
                        </div>
                        {post.paymentDueDate && (
                          <div className={`text-xs ${
                            !post.paymentCompleted && new Date(post.paymentDueDate) < new Date()
                              ? 'text-red-600 font-medium'
                              : 'text-gray-500'
                          }`}>
                            {!post.paymentCompleted && new Date(post.paymentDueDate) < new Date() && '⚠️ '}
                            {new Date(post.paymentDueDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {post.publishedUrl ? (
                        <a
                          href={formatUrl(post.publishedUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          <LinkIcon size={14} className="inline" />
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{created ? new Date(created).toLocaleString() : '-'}</td>
                    <td className="px-3 py-3 text-center">
                      {isPending && (
                        <button
                          onClick={() => openReview(post)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                        >
                          검토하기
                        </button>
                      )}
                      {isPublished && !isPending && (
                        <a
                          href={formatUrl(post.publishedUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                        >
                          링크 보기
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isReviewModalOpen && (
        <ReviewModal post={selectedPost} onClose={closeModals} onUpdate={onUpdatePostStatus} showWarning={showWarning} />
      )}
      {isDetailModalOpen && <ContentDetailModal post={selectedPost} onClose={closeModals} />}
    </div>
  );
};

const ReviewModal = ({ post, onClose, onUpdate, showWarning }) => {
  const [isRejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const status = (post.outlineStatus || post.outline_status) || (post.topicStatus || post.topic_status);
  const isTopic = (status || '').includes('주제');

  const approve = () => { onUpdate(post.id, isTopic ? '주제 승인' : '목차 승인', null); onClose(); };
  const reject = () => {
    if (!rejectReason) return showWarning('반려 사유를 입력해주세요.');
    onUpdate(post.id, isTopic ? '주제 반려' : '목차 반려', rejectReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">콘텐츠 검토</h3>
        <div className="space-y-4 bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 rounded-xl border border-gray-200/50">
          <div>
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              주제
            </h4>
            <p className="text-gray-700 mt-2 pl-4">{post.title}</p>
          </div>
          {post.outline && (
            <div className="pt-4 border-t border-gray-200/50">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                목차
              </h4>
              <p className="text-gray-700 mt-2 pl-4 whitespace-pre-wrap">{post.outline}</p>
            </div>
          )}
        </div>

        {isRejecting ? (
          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">반려 사유 (필수)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="4"
              placeholder="반려 사유를 상세히 입력해주세요..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejecting(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all duration-200"
              >
                취소
              </button>
              <button
                onClick={reject}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                반려 제출
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
            >
              취소
            </button>
            <button
              onClick={() => setRejecting(true)}
              className="px-6 py-2.5 bg-white border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-all duration-200"
            >
              반려
            </button>
            <button
              onClick={approve}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              승인
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ContentDetailModal = ({ post, onClose }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all">
      <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">콘텐츠 상세 내용</h3>
      <div className="space-y-5 bg-gradient-to-br from-gray-50 to-blue-50/30 p-6 rounded-xl border border-gray-200/50 max-h-[65vh] overflow-y-auto">
        <div>
          <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            주제
          </h4>
          <p className="text-gray-700 pl-4 leading-relaxed">{post.title}</p>
        </div>
        {post.outline && (
          <div className="pt-4 border-t border-gray-200/50">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              목차
            </h4>
            <p className="text-gray-700 pl-4 whitespace-pre-wrap leading-relaxed">{post.outline}</p>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          닫기
        </button>
      </div>
    </div>
  </div>
);

/* ============ Main ============ */
export default function ClientUI({ user, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess, showWarning } = useToast(); // Hook을 컴포넌트 최상위로 이동

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        // JWT 인증을 통한 캠페인 데이터 로드
        const response = await api.get('/api/campaigns/');

        // 백엔드 응답 구조 처리: { data: [...], pagination: {...} }
        const campaignData = response.data?.data || response.data || [];
        console.log('ClientUI: 캠페인 데이터 로드:', campaignData);
        setCampaigns(Array.isArray(campaignData) ? campaignData : []);
      } catch (err) {
        console.error('클라이언트 데이터 로딩 실패:', err);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const setActive = (page, id) => {
    setActivePage(page);
    setSelectedCampaignId(id);
  };

  // 승인/반려
  const handleUpdatePostStatus = async (postId, newStatus, rejectReason, field) => {
    const target = campaigns.find((c) => (c.posts || []).some((p) => p.id === postId));
    if (!target) {
      showError('캠페인을 찾을 수 없습니다.');
      return;
    }

    const post = target.posts.find((p) => p.id === postId);

    // field가 전달되면 그것을 사용, 없으면 기존 로직 (ReviewModal 호환)
    const isTopic = field ? field === 'topic' : ((post.topicStatus || post.topic_status) || '').includes('주제');
    const payload = isTopic
      ? { topicStatus: newStatus, rejectReason: rejectReason || null }
      : { outlineStatus: newStatus, rejectReason: rejectReason || null };

    try {
      // 백엔드 API: PUT /api/campaigns/{campaignId}/posts/{postId}
      const response = await api.put(`/api/campaigns/${target.id}/posts/${postId}`, payload);
      const updatedPost = response.data;  // 백엔드에서 받은 실제 데이터 사용

      const updated = campaigns.map((c) => ({
        ...c,
        posts: (c.posts || []).map((p) => (p.id === postId ? { ...p, ...updatedPost } : p)),
      }));
      setCampaigns(updated);
      showSuccess(`${isTopic ? '주제' : '목차'} ${newStatus === '주제 승인' || newStatus === '목차 승인' ? '승인' : '반려'} 처리가 완료되었습니다.`);
    } catch (err) {
      console.error('상태 업데이트 실패:', err);
      showError('상태 업데이트에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="flex h-screen w-full items-center justify-center">클라이언트 데이터를 불러오는 중...</div>;
  }

  const renderPage = () => {
    if (activePage === 'campaignDetail' && selectedCampaignId) {
      const campaign = campaigns.find((c) => c.id === selectedCampaignId);
      return (
        <ClientCampaignDetail
          campaign={campaign}
          setActivePage={setActive}
          onUpdatePostStatus={handleUpdatePostStatus}
          showWarning={showWarning}
        />
      );
    }
    if (activePage === 'campaigns') {
      return <ClientCampaignList campaigns={campaigns} setActivePage={setActive} />;
    }
    return <ClientDashboard user={user} campaigns={campaigns} setActivePage={setActive} />;
  };

  const title =
    activePage === 'campaigns' ? '캠페인 목록' : activePage === 'campaignDetail' ? '캠페인 상세' : '대시보드';

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex font-sans">
      <ClientSidebar activePage={activePage} setActivePage={setActive} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ClientHeader user={user} onLogout={onLogout} title={title} />
        <div className="flex-1 overflow-y-auto">{renderPage()}</div>
      </main>
    </div>
  );
}
