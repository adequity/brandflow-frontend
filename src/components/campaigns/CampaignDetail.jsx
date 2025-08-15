// src/components/campaigns/CampaignDetail.jsx
import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Edit, Trash2, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';

import StatusBadge from '../common/StatusBadge';
import AdvancedFilter from '../common/AdvancedFilter';
import ImagePreview from '../common/ImagePreview';
import EditModal from '../modals/EditModal';
import DeleteModal from '../modals/DeleteModal';
import OutlineRegisterModal from '../modals/OutlineRegisterModal';
import TopicRegisterModal from '../modals/TopicRegisterModal';
import LinkRegisterModal from '../modals/LinkRegisterModal';

const formatUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `//${url}`;
};

const CampaignDetail = ({ campaign, onBack, setCampaigns }) => {
  const [posts, setPosts] = useState(campaign.posts || []);
  const [filteredPosts, setFilteredPosts] = useState(campaign.posts || []);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    workType: 'all',
    status: 'all', 
    manager: 'all',
    dateRange: 'all',
    stage: 'all'
  });
  
  useEffect(() => {
    setPosts(campaign.posts || []);
  }, [campaign]);

  const [selectedRows, setSelectedRows] = useState([]);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isOutlineModalOpen, setOutlineModalOpen] = useState(false);
  const [isTopicModalOpen, setTopicModalOpen] = useState(false);
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const [modalType, setModalType] = useState('topic');
  const [selectedPost, setSelectedPost] = useState(null);

  // 사용자 목록 가져오기 (담당자 필터용)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users');
        setUsers(response.data);
      } catch (error) {
        console.error('사용자 목록 로딩 실패:', error);
      }
    };
    fetchUsers();
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = [...posts];

    // 업무 타입 필터
    if (filters.workType !== 'all') {
      filtered = filtered.filter(post => 
        (post.workType || '블로그') === filters.workType
      );
    }

    // 상태 필터 (주제 승인 상태 기준)
    if (filters.status !== 'all') {
      let statusFilter = filters.status;
      if (statusFilter === '승인 대기') {
        filtered = filtered.filter(post => 
          post.topicStatus === '주제 승인 대기' || 
          post.outlineStatus === '목차 승인 대기'
        );
      } else if (statusFilter === '승인') {
        filtered = filtered.filter(post => 
          post.topicStatus === '주제 승인' || 
          post.outlineStatus === '목차 승인'
        );
      } else if (statusFilter === '반려') {
        filtered = filtered.filter(post => 
          post.topicStatus === '주제 반려' || 
          post.outlineStatus === '목차 반려'
        );
      } else if (statusFilter === '완료') {
        filtered = filtered.filter(post => post.publishedUrl);
      }
    }

    // 담당자 필터 (캠페인의 매니저 기준)
    if (filters.manager !== 'all' && campaign?.managerId) {
      if (filters.manager !== campaign.managerId.toString()) {
        filtered = [];
      }
    }

    // 날짜 범위 필터
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      if (filters.dateRange === '7days') {
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === '30days') {
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === '3months') {
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      
      if (cutoffDate) {
        filtered = filtered.filter(post => 
          new Date(post.createdAt || post.creationTime) >= cutoffDate
        );
      }
    }

    // 진행 단계 필터
    if (filters.stage !== 'all') {
      if (filters.stage === 'work_only') {
        filtered = filtered.filter(post => 
          !post.outline && !post.publishedUrl
        );
      } else if (filters.stage === 'has_details') {
        filtered = filtered.filter(post => 
          post.outline && !post.publishedUrl
        );
      } else if (filters.stage === 'has_result') {
        filtered = filtered.filter(post => post.publishedUrl);
      }
    }

    setFilteredPosts(filtered);
  }, [posts, filters, campaign]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // 부모(AdminUI)의 campaigns 상태를 업데이트
  const updateParentCampaign = (updatedPosts) => {
    if (!setCampaigns) return;
    setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? { ...c, posts: updatedPosts } : c)));
  };

  /* ---------- Handlers ---------- */
  const handleRowSelect = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [id])); // 단일 선택
  };
  const handleSelectAll = (e) => setSelectedRows(e.target.checked ? filteredPosts.map((p) => p.id) : []);
  const openEditModal = (post, type) => { setSelectedPost(post); setModalType(type); setEditModalOpen(true); };
  const handleDeleteClick = (post) => { setSelectedPost(post); setDeleteModalOpen(true); };

  // 주제/목차 재요청
  const handleReRequest = async (updatedContent) => {
    const postToUpdate = filteredPosts.find((p) => p.id === selectedPost?.id) || posts.find((p) => p.id === selectedPost?.id);
    if (!postToUpdate) return;

    const payload =
      modalType === 'topic'
        ? { title: updatedContent, topicStatus: '주제 승인 대기', outline: null, outlineStatus: null }
        : { outline: updatedContent, outlineStatus: '목차 승인 대기' };

    try {
      const { data: updated } = await api.put(`/api/posts/${postToUpdate.id}`, payload);
      const next = posts.map((p) => (p.id === updated.id ? updated : p));
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      alert('재요청 실패');
    } finally {
      setEditModalOpen(false);
      setSelectedPost(null);
    }
  };

  // 목차 등록
  const handleRegisterOutline = async (outlineData) => {
    const postId = selectedRows[0];
    if (!postId) return;
    try {
      const payload = typeof outlineData === 'string' 
        ? { outline: outlineData, outlineStatus: '목차 승인 대기' }
        : { 
            outline: outlineData.text, 
            outlineStatus: '목차 승인 대기',
            images: outlineData.images || []
          };
      const { data: updated } = await api.put(`/api/posts/${postId}`, payload);
      const next = posts.map((p) => (p.id === updated.id ? updated : p));
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      alert('목차 등록 실패');
    } finally {
      setOutlineModalOpen(false);
      setSelectedRows([]);
    }
  };

  // 업무 등록
  const handleRegisterTopic = async (topicData) => {
    try {
      const payload = typeof topicData === 'string' 
        ? { title: topicData, workType: '블로그' } // 기존 호환성
        : { 
            title: topicData.title, 
            workType: topicData.workType,
            images: topicData.images || []
          };
        
      const { data: created } = await api.post(`/api/campaigns/${campaign.id}/posts`, payload);
      const next = [...(posts || []), created];
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      alert('업무 등록 실패');
    } finally {
      setTopicModalOpen(false);
    }
  };

  // 발행 링크 등록/수정
  const handleRegisterLink = async (url) => {
    const postId = selectedRows[0];
    if (!postId) return;
    try {
      const { data: updated } = await api.put(`/api/posts/${postId}`, { publishedUrl: url });
      const next = posts.map((p) => (p.id === updated.id ? updated : p));
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      alert('링크 등록 실패');
    } finally {
      setLinkModalOpen(false);
      setSelectedRows([]);
    }
  };

  // 삭제
  const handleConfirmDelete = async () => {
    if (!selectedPost) return;
    try {
      await api.delete(`/api/posts/${selectedPost.id}`);
      const next = posts.filter((p) => p.id !== selectedPost.id);
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      alert('삭제 실패');
    } finally {
      setDeleteModalOpen(false);
      setSelectedPost(null);
    }
  };

  const selected = filteredPosts.find((p) => p.id === selectedRows[0]) || posts.find((p) => p.id === selectedRows[0]);
  const canRegisterOutline = selectedRows.length === 1 && selected?.topicStatus === '주제 승인' && !selected?.outline;
  const canRegisterLink = selectedRows.length === 1;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex-shrink-0">
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline mb-2">
          &larr; 전체 캠페인 목록으로
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{campaign.name}</h2>
      </div>

      <div className="flex-grow bg-white p-6 rounded-xl border border-gray-200 flex flex-col mt-4">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-800">콘텐츠 기획 및 승인</h3>
            <AdvancedFilter 
              onFilterChange={handleFilterChange}
              users={users}
            />
            {filteredPosts.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedRows.length === filteredPosts.length && filteredPosts.length > 0}
                  className="rounded"
                />
                <span>전체 선택</span>
                {selectedRows.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {selectedRows.length}개 선택됨
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setTopicModalOpen(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              업무 등록
            </button>
            <button
              onClick={() => setOutlineModalOpen(true)}
              disabled={!canRegisterOutline}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700"
            >
              세부사항 등록
            </button>
            <button
              onClick={() => setLinkModalOpen(true)}
              disabled={!canRegisterLink}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700"
            >
              {selected?.publishedUrl ? '결과물 수정' : '결과물 등록'}
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <p>등록된 업무가 없습니다.</p>
              <p className="text-sm mt-2">위의 "업무 등록" 버튼을 클릭하여 새 업무를 추가해보세요.</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredPosts.map((post) => {
                const created = post.creationTime || post.createdAt;
                const isSelected = selectedRows.includes(post.id);
                
                return (
                  <div
                    key={post.id}
                    className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleRowSelect(post.id)}
                  >
                    {/* 헤더 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(post.id)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {post.workType || '블로그'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(post, 'topic');
                          }} 
                          className="text-gray-400 hover:text-blue-600 p-1"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(post);
                          }} 
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* 제목 */}
                    <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h4>

                    {/* 진행 상태 바 */}
                    <div className="mb-4">
                      {(() => {
                        let progress = 0;
                        let progressColor = 'bg-gray-300';
                        let statusText = '대기중';
                        
                        if (post.topicStatus === '주제 승인') {
                          progress = 33;
                          progressColor = 'bg-blue-500';
                          statusText = '주제 승인됨';
                        }
                        if (post.outline && post.outlineStatus === '목차 승인') {
                          progress = 66;
                          progressColor = 'bg-blue-500';
                          statusText = '세부사항 승인됨';
                        }
                        if (post.publishedUrl) {
                          progress = 100;
                          progressColor = 'bg-green-500';
                          statusText = '완료';
                        }
                        if (post.topicStatus === '주제 반려' || post.outlineStatus === '목차 반려') {
                          progressColor = 'bg-red-500';
                          statusText = '반려됨';
                        }
                        
                        return (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-medium text-gray-600">진행 상태</span>
                              <span className="text-xs text-gray-600">{statusText}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 상태 배지들 */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">주제 상태</span>
                        <StatusBadge status={post.topicStatus} />
                      </div>
                      
                      {post.outline && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">세부사항 상태</span>
                          <StatusBadge status={post.outlineStatus} />
                        </div>
                      )}
                    </div>

                    {/* 세부사항 */}
                    {post.outline && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-600">세부사항</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(post, 'outline');
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Edit size={12} />
                          </button>
                        </div>
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded line-clamp-3">
                          {post.outline}
                        </div>
                      </div>
                    )}

                    {/* 첨부 이미지 */}
                    {post.images && post.images.length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-600 block mb-1">첨부 이미지</span>
                        <ImagePreview images={post.images} />
                      </div>
                    )}

                    {/* 결과물 링크 */}
                    {post.publishedUrl && (
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-600 block mb-1">결과물</span>
                        <a
                          href={formatUrl(post.publishedUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:underline text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <LinkIcon size={14} className="mr-1" />
                          링크 보기
                        </a>
                      </div>
                    )}

                    {/* 푸터 */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      {created ? new Date(created).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-center items-center mt-4 flex-shrink-0">
          <nav className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <ChevronLeft size={16} />
            </button>
            <button className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md">1</button>
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      </div>

      {isEditModalOpen && (
        <EditModal post={selectedPost} type={modalType} onSave={handleReRequest} onClose={() => setEditModalOpen(false)} />
      )}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        itemType="콘텐츠"
        itemName={selectedPost?.title}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
      />
      {isOutlineModalOpen && <OutlineRegisterModal onSave={handleRegisterOutline} onClose={() => setOutlineModalOpen(false)} />}
      {isTopicModalOpen && <TopicRegisterModal onSave={handleRegisterTopic} onClose={() => setTopicModalOpen(false)} />}
      {isLinkModalOpen && (
        <LinkRegisterModal
          onSave={handleRegisterLink}
          onClose={() => setLinkModalOpen(false)}
          initialUrl={selected?.publishedUrl}
        />
      )}
    </div>
  );
};

export default CampaignDetail;
