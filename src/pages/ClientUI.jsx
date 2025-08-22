// src/pages/ClientUI.jsx
import React, { useEffect, useState } from 'react';
import { Home, FileText, ChevronDown, ArrowRight, LogOut, Search, Link as LinkIcon } from 'lucide-react';
import api from '../api/client';
import NotificationBell from '../components/common/NotificationBell';
import ImagePreview from '../components/common/ImagePreview';
import LogoDisplay from '../components/LogoDisplay';
import { useToast } from '../contexts/ToastContext';

/* ============ Helpers ============ */
const StatusBadge = ({ status }) => {
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
  return <span className={`${base} ${styles[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const formatUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `//${url}`;
};

/* ============ Layout ============ */
const ClientSidebar = ({ activePage, setActivePage }) => {
  const menu = [
    { id: 'dashboard', label: '대시보드', icon: <Home size={20} /> },
    { id: 'campaigns', label: '캠페인 목록', icon: <FileText size={20} /> },
  ];
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
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
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activePage === item.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.icon}
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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
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
  const allPosts = (campaigns || []).flatMap((c) => c.posts || []);
  
  // 상태별 통계
  const pendingTopics = allPosts.filter((p) => p.topicStatus === '주제 승인 대기').length;
  const pendingOutlines = allPosts.filter((p) => p.outlineStatus === '목차 승인 대기').length;
  const rejectedPosts = allPosts.filter((p) => p.topicStatus === '주제 반려' || p.outlineStatus === '목차 반려').length;
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
        <div className="bg-white p-4 rounded-lg border-l-4 border-yellow-400 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">주제 승인 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingTopics}</p>
            </div>
            <div className="text-yellow-400">📝</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border-l-4 border-orange-400 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">목차 승인 대기</p>
              <p className="text-2xl font-bold text-orange-600">{pendingOutlines}</p>
            </div>
            <div className="text-orange-400">📋</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border-l-4 border-red-400 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">반려된 업무</p>
              <p className="text-2xl font-bold text-red-600">{rejectedPosts}</p>
            </div>
            <div className="text-red-400">❌</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border-l-4 border-green-400 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">완료된 업무</p>
              <p className="text-2xl font-bold text-green-600">{completedPosts}</p>
            </div>
            <div className="text-green-400">✅</div>
          </div>
        </div>
      </div>

      {/* 이번 주 활동 요약 */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 이번 주 활동 요약</h3>
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
                  const posts = c.posts || [];
                  const total = posts.length;
                  const completed = posts.filter((p) => p.publishedUrl).length;
                  const pending = posts.filter(
                    (p) => p.topicStatus?.includes('대기') || p.outlineStatus?.includes('대기')
                  ).length;
                  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setActivePage('campaignDetail', c.id)}
                      className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">{c.name}</h4>
                            {pending > 0 && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                                검토필요 {pending}
                              </span>
                            )}
                            {total === completed && total > 0 && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                완료 ✅
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">담당자: {c.User?.name || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">{progressPercent}%</div>
                          <div className="text-xs text-gray-500">{completed}/{total} 완료</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
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
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ 최근 활동</h3>
            {recentlyUpdated.length > 0 ? (
              <div className="space-y-3">
                {recentlyUpdated.map((p) => (
                  <div key={p.id} className="border-l-2 border-blue-200 pl-3">
                    <div className="text-sm font-medium text-gray-900 line-clamp-2">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(p.updatedAt || p.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                    <StatusBadge status={p.topicStatus || p.outlineStatus} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">최근 활동이 없습니다.</p>
            )}
          </div>

          {/* 발행된 글 */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎉 최근 발행된 글</h3>
            {recentlyPublished.length > 0 ? (
              <div className="space-y-4">
                {recentlyPublished.map((p) => (
                  <div key={p.id} className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-gray-900 line-clamp-2 mb-2">{p.title}</div>
                    <a
                      href={formatUrl(p.publishedUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:underline"
                    >
                      <LinkIcon size={12} className="mr-1" />
                      링크 보기
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <div className="text-2xl mb-2">📝</div>
                <p className="text-sm">아직 발행된 글이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 빠른 액션 */}
          {totalPending > 0 && (
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚡ 빠른 액션</h3>
              <button
                onClick={() => setActivePage('campaigns', null)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
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
  const filtered = (campaigns || []).filter((c) =>
    c.name.toLowerCase().includes(term.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="캠페인명 검색..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full max-w-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <table className="w-full text-sm text-left text-gray-500">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-4 py-3">캠페인명</th>
              <th className="px-4 py-3">담당자</th>
              <th className="px-4 py-3">진행률</th>
              <th className="px-4 py-3">승인대기</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const posts = c.posts || [];
              const total = posts.length;
              const completed = posts.filter((p) => p.publishedUrl).length;
              const pending = posts.filter(
                (p) => p.topicStatus?.includes('대기') || p.outlineStatus?.includes('대기')
              ).length;

              return (
                <tr
                  key={c.id}
                  onClick={() => setActivePage('campaignDetail', c.id)}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-4 py-3">{c.User?.name || 'N/A'}</td>
                  <td className="px-4 py-3">
                    {completed}/{total}
                  </td>
                  <td className="px-4 py-3">
                    {pending > 0 ? <span className="font-bold text-yellow-600">{pending} 건</span> : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ClientCampaignDetail = ({ campaign, setActivePage, onUpdatePostStatus }) => {
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
        className="text-sm text-blue-600 hover:underline mb-4"
      >
        &larr; 캠페인 목록으로
      </button>

      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">{campaign.name}</h2>
        <p className="text-gray-600 mt-1">담당자: {campaign.User?.name || 'N/A'}</p>

        <div className="mt-6">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="p-2">업무 타입</th>
                <th className="p-2">업무 내용</th>
                <th className="p-2">승인 상태</th>
                <th className="p-2">세부사항 검토</th>
                <th className="p-2">세부사항 승인 상태</th>
                <th className="p-2">첨부 이미지</th>
                <th className="p-2">결과물 링크</th>
                <th className="p-2">작성 시간</th>
                <th className="p-2 text-center">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(campaign.posts || []).map((post) => {
                const isPending = (post.topicStatus && post.topicStatus.includes('대기')) || 
                                 (post.outlineStatus && post.outlineStatus.includes('대기'));
                const isPublished = !!post.publishedUrl;
                const created = post.creationTime || post.createdAt;

                return (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="p-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {post.workType || '블로그'}
                      </span>
                    </td>
                    <td 
                      onClick={() => openDetail(post)}
                      className="p-2 font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                    >
                      {post.title}
                    </td>
                    <td className="p-2">
                      <StatusBadge status={post.topicStatus} />
                    </td>
                    <td 
                      onClick={() => openDetail(post)}
                      className="p-2 hover:text-blue-600 cursor-pointer"
                    >
                      {post.outline ? (
                        <span className="text-xs truncate max-w-xs">{post.outline}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2">{post.outlineStatus ? <StatusBadge status={post.outlineStatus} /> : '-'}</td>
                    <td className="p-2"><ImagePreview images={post.images} /></td>
                    <td className="p-2">
                      {post.publishedUrl ? (
                        <a
                          href={formatUrl(post.publishedUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <LinkIcon size={14} className="inline" />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2 text-xs text-gray-600">{created ? new Date(created).toLocaleString() : '-'}</td>
                    <td className="p-2 text-center">
                      {isPending && (
                        <button
                          onClick={() => openReview(post)}
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          검토하기
                        </button>
                      )}
                      {isPublished && !isPending && (
                        <a
                          href={formatUrl(post.publishedUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-600 hover:underline"
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
        <ReviewModal post={selectedPost} onClose={closeModals} onUpdate={onUpdatePostStatus} />
      )}
      {isDetailModalOpen && <ContentDetailModal post={selectedPost} onClose={closeModals} />}
    </div>
  );
};

const ReviewModal = ({ post, onClose, onUpdate }) => {
  const { showWarning } = useToast();
  const [isRejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const status = post.outlineStatus || post.topicStatus;
  const isTopic = (status || '').includes('주제');

  const approve = () => { onUpdate(post.id, isTopic ? '주제 승인' : '목차 승인', null); onClose(); };
  const reject = () => {
    if (!rejectReason) return showWarning('반려 사유를 입력해주세요.');
    onUpdate(post.id, isTopic ? '주제 반려' : '목차 반려', rejectReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w/full max-w-2xl">
        <h3 className="text-xl font-bold mb-4">콘텐츠 검토</h3>
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <h4 className="font-semibold text-gray-800">주제</h4>
            <p className="text-gray-600 mt-1">{post.title}</p>
          </div>
          {post.outline && (
            <div>
              <h4 className="font-semibold text-gray-800">목차</h4>
              <p className="text-gray-600 mt-1 whitespace-pre-wrap">{post.outline}</p>
            </div>
          )}
        </div>

        {isRejecting ? (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">반려 사유 (필수)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="4"
              className="w-full p-2 mt-1 border border-gray-300 rounded-lg"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => setRejecting(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                취소
              </button>
              <button onClick={reject} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                반려 제출
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg">
              취소
            </button>
            <button onClick={() => setRejecting(true)} className="px-5 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg">
              반려
            </button>
            <button onClick={approve} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              승인
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ContentDetailModal = ({ post, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
      <h3 className="text-xl font-bold mb-4">콘텐츠 상세 내용</h3>
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
        <div>
          <h4 className="font-semibold text-gray-800">주제</h4>
          <p className="text-gray-600 mt-1">{post.title}</p>
        </div>
        {post.outline && (
          <div>
            <h4 className="font-semibold text-gray-800">목차</h4>
            <p className="text-gray-600 mt-1 whitespace-pre-wrap">{post.outline}</p>
          </div>
        )}
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={onClose} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
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

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const role = user.role || '클라이언트';
        const { data } = await api.get(
          `/api/campaigns?viewerId=${user.id}&viewerRole=${encodeURIComponent(role)}`
        );
        setCampaigns(data || []);
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
  const handleUpdatePostStatus = async (postId, newStatus, rejectReason) => {
    const { showError } = useToast();
    const target = campaigns.find((c) => (c.posts || []).some((p) => p.id === postId));
    if (!target) return;

    const post = target.posts.find((p) => p.id === postId);
    const isTopic = (post.topicStatus || '').includes('주제');
    const payload = isTopic
      ? { topicStatus: newStatus, rejectReason: rejectReason || null }
      : { outlineStatus: newStatus, rejectReason: rejectReason || null };

    try {
      await api.put(`/api/posts/${postId}/status`, payload);
      const updated = campaigns.map((c) => ({
        ...c,
        posts: (c.posts || []).map((p) => (p.id === postId ? { ...p, ...payload } : p)),
      }));
      setCampaigns(updated);
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
    <div className="h-screen w-full bg-gray-50 flex font-sans">
      <ClientSidebar activePage={activePage} setActivePage={setActive} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <ClientHeader user={user} onLogout={onLogout} title={title} />
        <div className="flex-1 overflow-y-auto">{renderPage()}</div>
      </main>
    </div>
  );
}
