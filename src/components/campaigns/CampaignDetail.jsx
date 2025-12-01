// src/components/campaigns/CampaignDetail.jsx
import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Edit, Trash2, Link as LinkIcon, ChevronLeft, ChevronRight, ShoppingCart, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { safeFormatCurrency, safeFormatDate } from '../../utils/dataUtils';

import StatusBadge from '../common/StatusBadge';
import AdvancedFilter from '../common/AdvancedFilter';
import EditModal from '../modals/EditModal';
import DeleteModal from '../modals/DeleteModal';
import OutlineRegisterModal from '../modals/OutlineRegisterModal';
import TopicRegisterModal from '../modals/TopicRegisterModal';
import LinkRegisterModal from '../modals/LinkRegisterModal';
import PurchaseRequestModal from '../modals/PurchaseRequestModal';
import ExcelUploadModal from '../modals/ExcelUploadModal';
import ApprovalButtons from '../ApprovalButtons';
import { WORK_TYPES, POST_STATUSES, DEFAULT_VALUES } from '../../constants/campaignConstants';

const formatUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('https://')) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return `https://${url}`;
};

const CampaignDetail = ({ campaign, onBack, setCampaigns, loggedInUser }) => {
  const { showError } = useToast();
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
  const [isPurchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [isExcelUploadModalOpen, setExcelUploadModalOpen] = useState(false);
  const [modalType, setModalType] = useState('topic');
  const [selectedPost, setSelectedPost] = useState(null);
  const [purchaseRequests, setPurchaseRequests] = useState([]);

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

  // 캠페인 구매요청 목록 가져오기
  useEffect(() => {
    const fetchPurchaseRequests = async () => {
      if (!campaign?.id || !loggedInUser?.id) return;
      
      try {
        const { data } = await api.get('/api/purchase-requests', {
          params: {
            viewerId: loggedInUser.id,
            viewerRole: loggedInUser.role,
            campaignId: campaign.id
          }
        });
        setPurchaseRequests(data.requests || []);
      } catch (error) {
        console.error('구매요청 목록 로딩 실패:', error);
      }
    };
    fetchPurchaseRequests();
  }, [campaign?.id, loggedInUser]);

  // 필터링 로직
  useEffect(() => {
    let filtered = [...posts];

    // 업무 타입 필터
    if (filters.workType !== 'all') {
      filtered = filtered.filter(post => 
        (post.workType || DEFAULT_VALUES.WORK_TYPE) === filters.workType
      );
    }

    // 상태 필터 (주제 승인 상태 기준)
    if (filters.status !== 'all') {
      let statusFilter = filters.status;
      if (statusFilter === '승인 대기') {
        filtered = filtered.filter(post => 
          post.topicStatus === POST_STATUSES.TOPIC_PENDING || 
          post.outlineStatus === POST_STATUSES.OUTLINE_PENDING
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

  // 주제/목차 수정
  const handleReRequest = async (updatedContent) => {
    const postToUpdate = filteredPosts.find((p) => p.id === selectedPost?.id) || posts.find((p) => p.id === selectedPost?.id);
    if (!postToUpdate) return;

    let payload;
    if (modalType === 'topic') {
      // 새로운 확장된 수정 데이터 처리
      if (typeof updatedContent === 'object') {
        payload = {
          title: updatedContent.title,
          workType: updatedContent.workType,
          images: updatedContent.images,
          productId: updatedContent.productId,
          quantity: updatedContent.quantity,
          startDate: updatedContent.startDate,
          dueDate: updatedContent.dueDate,
          topicStatus: POST_STATUSES.TOPIC_PENDING // 수정 시 재승인 필요
        };
      } else {
        // 기존 방식 호환성
        payload = { title: updatedContent, topicStatus: POST_STATUSES.TOPIC_PENDING, outline: null, outlineStatus: null };
      }
    } else {
      payload = { outline: updatedContent, outlineStatus: POST_STATUSES.OUTLINE_PENDING };
    }

    try {
      const { data: updated } = await api.put(`/api/campaigns/${campaign.id}/posts/${postToUpdate.id}`, payload);
      const next = posts.map((p) => (p.id === updated.id ? updated : p));
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      showError('수정 실패');
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
        ? { outline: outlineData, outlineStatus: POST_STATUSES.OUTLINE_PENDING }
        : {
            outline: outlineData.outline,  // DB 필드명과 일치
            outlineStatus: POST_STATUSES.OUTLINE_PENDING,
            images: outlineData.images || []
          };
      const { data: updated } = await api.put(`/api/campaigns/${campaign.id}/posts/${postId}`, payload);
      const next = posts.map((p) => (p.id === updated.id ? updated : p));
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      showError('목차 등록 실패');
    } finally {
      setOutlineModalOpen(false);
      setSelectedRows([]);
    }
  };

  // 업무 등록
  const handleRegisterTopic = async (topicData) => {
    try {
      const payload = typeof topicData === 'string' 
        ? { title: topicData, workType: DEFAULT_VALUES.WORK_TYPE } // 기존 호환성
        : { 
            title: topicData.title, 
            workType: topicData.workType,
            images: topicData.images || []
          };
        
      const { data: created } = await api.post(`/api/campaigns/${campaign.id}/posts/`, payload);
      const next = [...(posts || []), created];
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      showError('업무 등록 실패');
    } finally {
      setTopicModalOpen(false);
    }
  };

  // 발행 링크 등록/수정
  const handleRegisterLink = async (url) => {
    const postId = selectedRows[0];
    if (!postId) return;
    try {
      const { data: updated } = await api.put(`/api/campaigns/${campaign.id}/posts/${postId}`, { publishedUrl: url });
      const next = posts.map((p) => (p.id === updated.id ? updated : p));
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      showError('링크 등록 실패');
    } finally {
      setLinkModalOpen(false);
      setSelectedRows([]);
    }
  };

  // 삭제
  const handleConfirmDelete = async () => {
    if (!selectedPost) return;
    try {
      await api.delete(`/api/campaigns/${campaign.id}/posts/${selectedPost.id}`);
      const next = posts.filter((p) => p.id !== selectedPost.id);
      setPosts(next);
      updateParentCampaign(next);
    } catch (err) {
      console.error(err);
      showError('삭제 실패');
    } finally {
      setDeleteModalOpen(false);
      setSelectedPost(null);
    }
  };

  // Excel 일괄 업로드 성공 핸들러
  const handleExcelUploadSuccess = async () => {
    try {
      // 캠페인 데이터 새로고침하여 최신 포스트 목록 가져오기
      const { data: updatedCampaign } = await api.get(`/api/campaigns/${campaign.id}`);
      const updatedPosts = updatedCampaign.posts || [];
      setPosts(updatedPosts);
      updateParentCampaign(updatedPosts);
    } catch (err) {
      console.error('캠페인 데이터 새로고침 실패:', err);
    }
  };

  // 구매요청 처리
  const handlePurchaseRequest = (postId) => {
    const post = posts.find(p => p.id === postId);
    setSelectedPost(post);
    setPurchaseModalOpen(true);
  };

  const handlePurchaseSuccess = () => {
    // 구매요청 목록 새로고침
    const fetchPurchaseRequests = async () => {
      if (!campaign?.id || !loggedInUser?.id) return;
      
      try {
        const { data } = await api.get('/api/purchase-requests', {
          params: {
            viewerId: loggedInUser.id,
            viewerRole: loggedInUser.role,
            campaignId: campaign.id
          }
        });
        setPurchaseRequests(data.requests || []);
      } catch (error) {
        console.error('구매요청 목록 로딩 실패:', error);
      }
    };
    fetchPurchaseRequests();
    setPurchaseModalOpen(false);
  };

  // 특정 업무의 구매요청 상태 가져오기
  const getPurchaseRequestStatus = (postId) => {
    const request = purchaseRequests.find(req => req.postId === postId);
    if (!request) return null;
    
    return {
      status: request.status,
      id: request.id,
      amount: request.amount
    };
  };

  // 구매요청 상태 뱃지 렌더링
  const renderPurchaseStatusBadge = (postId) => {
    const requestStatus = getPurchaseRequestStatus(postId);
    if (!requestStatus) return null;

    const statusStyles = {
      '승인 대기': 'bg-yellow-100 text-yellow-800',
      '검토 중': 'bg-blue-100 text-blue-800',
      '승인됨': 'bg-green-100 text-green-800',
      '거절됨': 'bg-red-100 text-red-800',
      '보류': 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[requestStatus.status] || 'bg-gray-100 text-gray-800'}`}>
        {requestStatus.status}
      </span>
    );
  };

  const selected = filteredPosts.find((p) => p.id === selectedRows[0]) || posts.find((p) => p.id === selectedRows[0]);
  const canRegisterOutline = selectedRows.length === 1 && selected?.topicStatus === '주제 승인' && !selected?.outline;
  const canRegisterLink = selectedRows.length === 1;

  return (
    <div className="p-3 md:p-6 h-full flex flex-col">
      <div className="flex-shrink-0">
        <button onClick={onBack} className="text-xs md:text-sm text-blue-600 hover:underline mb-2 md:mb-2 min-h-[44px] flex items-center touch-manipulation">
          &larr; 전체 캠페인 목록으로
        </button>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0">
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">{campaign.name}</h2>

          {/* 총 매출 표시 */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg px-4 md:px-6 py-2 md:py-3">
            <div className="text-xs text-gray-600 mb-1">캠페인 총 매출</div>
            <div className="text-xl md:text-2xl font-bold text-purple-700">
              {(() => {
                const totalBudget = posts.reduce((sum, post) => sum + (post.budget || 0), 0);
                return safeFormatCurrency(totalBudget);
              })()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {posts.filter(p => p.budget && p.budget !== 0).length}개 업무
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow bg-white p-3 md:p-6 rounded-xl border border-gray-200 flex flex-col mt-3 md:mt-4">
        {/* Header Section - 모바일 최적화 */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 mb-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">콘텐츠 기획 및 승인</h3>
            <AdvancedFilter
              onFilterChange={handleFilterChange}
              users={users}
            />
          </div>

          {/* 액션 버튼 - 모바일에서 세로 스택 */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <button
              onClick={() => setExcelUploadModalOpen(true)}
              className="px-3 py-2.5 min-h-[44px] bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 touch-manipulation flex items-center justify-center gap-2"
              title="Excel 파일로 여러 업무를 한 번에 등록"
            >
              <FileSpreadsheet size={18} />
              <span className="hidden sm:inline">Excel 일괄등록</span>
              <span className="sm:hidden">Excel</span>
            </button>
            <button
              onClick={() => setTopicModalOpen(true)}
              className="px-3 py-2.5 min-h-[44px] bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 touch-manipulation"
            >
              업무 등록
            </button>
            <button
              onClick={() => setOutlineModalOpen(true)}
              disabled={!canRegisterOutline}
              className="px-3 py-2.5 min-h-[44px] text-sm font-semibold rounded-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 touch-manipulation"
            >
              세부사항 등록
            </button>
            <button
              onClick={() => setLinkModalOpen(true)}
              disabled={!canRegisterLink}
              className="px-3 py-2.5 min-h-[44px] text-sm font-semibold rounded-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 touch-manipulation"
            >
              {selected?.publishedUrl ? '결과물 수정' : '결과물 등록'}
            </button>
          </div>
        </div>

        {/* Desktop 테이블 뷰 */}
        <div className="flex-grow overflow-x-auto hidden md:block">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="p-2 w-4">
                  <input type="checkbox" onChange={handleSelectAll} />
                </th>
                <th className="p-2">업무 타입</th>
                <th className="p-2">제품명</th>
                <th className="p-2">업무 내용</th>
                <th className="p-2">승인 상태</th>
                <th className="p-2">세부사항 검토</th>
                <th className="p-2">세부사항 승인 상태</th>
                <th className="p-2 bg-purple-50">매출</th>
                <th className="p-2">결과물 링크</th>
                <th className="p-2">작성 시간</th>
                <th className="p-2 bg-yellow-50">원가</th>
                <th className="p-2 bg-blue-50">구매요청</th>
                <th className="p-2 bg-green-50">승인/반려</th>
                <th className="p-2">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPosts.map((post) => {
                const created = post.creationTime || post.createdAt;
                return (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(post.id)}
                        onChange={() => handleRowSelect(post.id)}
                      />
                    </td>
                    <td className="p-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {post.workType || DEFAULT_VALUES.WORK_TYPE}
                      </span>
                    </td>
                    <td className="p-2 text-sm text-gray-700">{post.productName || '-'}</td>
                    <td className="p-2 font-medium text-gray-900">{post.title}</td>
                    <td className="p-2">
                      <StatusBadge status={post.topicStatus} />
                    </td>
                    <td className="p-2">
                      {post.outline ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate max-w-xs">{post.outline}</span>
                          <button
                            onClick={() => openEditModal(post, 'outline')}
                            className="text-gray-400 hover:text-blue-600 ml-2 shrink-0"
                          >
                            <Edit size={14} />
                          </button>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2">{post.outlineStatus ? <StatusBadge status={post.outlineStatus} /> : '-'}</td>
                    <td className="p-2 text-xs font-semibold bg-purple-50">
                      {post.budget !== null && post.budget !== undefined && post.budget !== 0 ? (
                        <span className={post.budget > 0 ? 'text-purple-600' : 'text-red-600'}>
                          {safeFormatCurrency(post.budget)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
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
                    <td className="p-2 text-xs text-gray-600">{safeFormatDate(created)}</td>
                    <td className="p-2 text-xs font-semibold text-orange-600 bg-yellow-50">
                      {post.productId && post.publishedUrl ? (
                        <span>{safeFormatCurrency((post.product?.costPrice || 0) * (post.quantity || 1))}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-2 bg-blue-50">
                      <div className="flex flex-col items-center space-y-1">
                        {renderPurchaseStatusBadge(post.id)}
                        {(loggedInUser?.role === 'STAFF' || loggedInUser?.role === 'AGENCY_ADMIN') && (
                          <button
                            onClick={() => handlePurchaseRequest(post.id)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                            title="구매요청"
                          >
                            <ShoppingCart size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-2 bg-green-50">
                      <ApprovalButtons
                        resourceType="post"
                        resource={{ ...post, Campaign: campaign }}
                        onApproved={(updatedPost) => {
                          const updatedPosts = posts.map(p => 
                            p.id === updatedPost.id ? updatedPost : p
                          );
                          setPosts(updatedPosts);
                        }}
                        onRejected={(updatedPost) => {
                          const updatedPosts = posts.map(p => 
                            p.id === updatedPost.id ? updatedPost : p
                          );
                          setPosts(updatedPosts);
                        }}
                        compact={true}
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openEditModal(post, 'topic')} className="text-gray-400 hover:text-blue-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(post)} className="text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile 카드 뷰 */}
        <div className="block md:hidden divide-y divide-gray-200">
          {filteredPosts.map((post) => {
            const created = post.creationTime || post.createdAt;
            return (
              <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                {/* 체크박스와 업무 타입 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(post.id)}
                      onChange={() => handleRowSelect(post.id)}
                      className="mt-1 w-5 h-5 touch-manipulation"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {post.workType || DEFAULT_VALUES.WORK_TYPE}
                        </span>
                        <StatusBadge status={post.topicStatus} />
                      </div>
                      {post.productName && (
                        <div className="text-xs text-gray-600 mb-1">
                          제품: <span className="font-medium text-gray-800">{post.productName}</span>
                        </div>
                      )}
                      <div className="font-medium text-gray-900 text-sm mb-2">{post.title}</div>
                    </div>
                  </div>
                </div>

                {/* 세부사항 정보 */}
                {post.outline && (
                  <div className="mb-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-gray-600">세부사항</div>
                      <button
                        onClick={() => openEditModal(post, 'outline')}
                        className="text-gray-400 hover:text-blue-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                        title="세부사항 수정"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-700 mb-2">{post.outline}</div>
                    {post.outlineStatus && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">승인 상태:</span>
                        <StatusBadge status={post.outlineStatus} />
                      </div>
                    )}
                  </div>
                )}

                {/* 매출, 원가, 결과물 정보 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">매출</div>
                    <div className="font-medium text-sm text-purple-600">
                      {post.budget !== null && post.budget !== undefined && post.budget !== 0 ? (
                        <span className={post.budget > 0 ? 'text-purple-600' : 'text-red-600'}>
                          {safeFormatCurrency(post.budget)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">원가</div>
                    <div className="font-medium text-sm text-orange-600">
                      {post.productId && post.publishedUrl ? (
                        <span>{safeFormatCurrency((post.product?.costPrice || 0) * (post.quantity || 1))}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 결과물 링크와 날짜 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">결과물</div>
                    {post.publishedUrl ? (
                      <a
                        href={formatUrl(post.publishedUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                      >
                        <LinkIcon size={12} />
                        링크 보기
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">작성일</div>
                    <div className="text-xs text-gray-700">{safeFormatDate(created)}</div>
                  </div>
                </div>

                {/* 구매요청 상태 */}
                {renderPurchaseStatusBadge(post.id) && (
                  <div className="mb-3 bg-blue-50 p-2 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">구매요청</div>
                    <div className="flex items-center justify-between">
                      {renderPurchaseStatusBadge(post.id)}
                      {(loggedInUser?.role === 'STAFF' || loggedInUser?.role === 'AGENCY_ADMIN') && (
                        <button
                          onClick={() => handlePurchaseRequest(post.id)}
                          className="p-2 min-w-[44px] min-h-[44px] text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded touch-manipulation"
                          title="구매요청"
                        >
                          <ShoppingCart size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 승인 버튼 영역 */}
                <div className="mb-3 bg-green-50 p-2 rounded-lg">
                  <div className="text-xs text-gray-600 mb-2">승인/반려</div>
                  <ApprovalButtons
                    resourceType="post"
                    resource={{ ...post, Campaign: campaign }}
                    onApproved={(updatedPost) => {
                      const updatedPosts = posts.map(p =>
                        p.id === updatedPost.id ? updatedPost : p
                      );
                      setPosts(updatedPosts);
                    }}
                    onRejected={(updatedPost) => {
                      const updatedPosts = posts.map(p =>
                        p.id === updatedPost.id ? updatedPost : p
                      );
                      setPosts(updatedPosts);
                    }}
                    compact={true}
                  />
                </div>

                {/* 관리 버튼 */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(post, 'topic')}
                    className="flex items-center justify-center w-11 h-11 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors touch-manipulation"
                    title="업무 수정"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(post)}
                    className="flex items-center justify-center w-11 h-11 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors touch-manipulation"
                    title="삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
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
      {isTopicModalOpen && (
        <TopicRegisterModal 
          key={`topic-modal-${Date.now()}`} // 매번 새로운 키로 컴포넌트를 재마운트
          onSave={handleRegisterTopic} 
          onClose={() => setTopicModalOpen(false)}
          campaignId={campaign.id}
        />
      )}
      {isLinkModalOpen && (
        <LinkRegisterModal
          onSave={handleRegisterLink}
          onClose={() => setLinkModalOpen(false)}
          initialUrl={selected?.publishedUrl}
        />
      )}
      {isPurchaseModalOpen && selectedPost && (
        <PurchaseRequestModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setPurchaseModalOpen(false)}
          onSuccess={handlePurchaseSuccess}
          loggedInUser={loggedInUser}
          initialData={{
            title: `${campaign.name} - ${selectedPost.title}`,
            campaignId: campaign.id,
            postId: selectedPost.id
          }}
        />
      )}
      {isExcelUploadModalOpen && (
        <ExcelUploadModal
          campaignId={campaign.id}
          onClose={() => setExcelUploadModalOpen(false)}
          onSuccess={handleExcelUploadSuccess}
        />
      )}
    </div>
  );
};

export default CampaignDetail;
