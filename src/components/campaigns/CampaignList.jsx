// src/components/campaigns/CampaignList.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { Plus, Search, Trash2, MessageSquare, FileText, Edit } from 'lucide-react';
import NewCampaignModal from '../modals/NewCampaignModal';
import CampaignEditModal from '../modals/CampaignEditModal';
import ChatContentModal from '../modals/ChatContentModal';
import ConfirmModal from '../ui/ConfirmModal';
import { debugAuth, checkAuthToken } from '../../utils/tokenUtils';
import { useToast } from '../../contexts/ToastContext';
import { ensureArray, safeFormatCurrency } from '../../utils/dataUtils';
import { canEditCampaign } from '../../utils/permissions';

const CampaignList = ({ campaigns, setCampaigns, campaignSales = {}, users, onSelectCampaign, currentUser, pagination, onPageChange }) => {
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, campaign: null });
  const [chatContentModal, setChatContentModal] = useState(null);

  // 클라이언트 정보에서 ID 추출하는 유틸리티 함수
  const extractClientId = (clientCompany) => {
    const match = clientCompany?.match(/ \(ID: (\d+)\)$/);
    return match ? parseInt(match[1]) : null;
  };

  // 클라이언트 이름만 추출하는 유틸리티 함수  
  const getClientDisplayName = (clientCompany) => {
    return clientCompany?.replace(/ \(ID: \d+\)$/, '') || 'N/A';
  };

  const handleSaveCampaign = async (campaignData) => {
    try {
      console.log('Campaign data received:', campaignData);
      
      // JWT 토큰 존재 여부만 확인 (서버에서 유효성 검증)
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        showError('인증이 필요합니다. 다시 로그인해주세요.');
        return;
      }
      
      console.log('Auth token exists, proceeding with campaign creation');
      
      // 담당자가 선택된 경우 그 사람으로, 아니면 현재 사용자로 캠페인 생성
      const actualCreatorId = campaignData.UserId || currentUser.id;
      
      // 백엔드 CampaignCreate 스키마에 맞춘 페이로드
      // 클라이언트 ID 정보를 포함해서 저장 (기존 필드 활용)
      const clientDisplayName = campaignData.clientName || 'Unknown Client';
      const clientCompanyWithId = campaignData.clientId ? 
        `${clientDisplayName} (ID: ${campaignData.clientId})` : 
        clientDisplayName;
        
      const payload = {
        name: campaignData.name?.trim() || '테스트 캠페인',
        description: campaignData.description || '',
        client_company: clientCompanyWithId,
        budget: Math.max(campaignData.budget || 1000000, 1), // 백엔드 요구사항: budget > 0
        start_date: campaignData.startDate ? new Date(campaignData.startDate).toISOString() : new Date().toISOString(),
        end_date: campaignData.endDate ? new Date(campaignData.endDate).toISOString() : new Date(Date.now() + 365*24*60*60*1000).toISOString()
      };
      
      console.log('Payload to send:', payload);

      
      console.log('🚀 캠페인 생성 API 호출 시작:', '/api/campaigns/');
      console.log('🚀 Payload:', payload);
      
      // 🚨 CORS 우회 시도: 다른 방식으로 요청
      console.log('🚨 CORS 이슈로 인해 대체 방식 시도');
      
      // JWT 인증을 통한 간단한 API 호출
      const response = await api.post('/api/campaigns/', payload);
      const data = response.data;
      const status = response.status;
      console.log('✅ 캠페인 생성 성공:', { data, status });
      
      console.log('✅ 캠페인 생성 API 성공:', { data, status });

      // 서버가 {campaign:{...}} 또는 {...} 로 와도 안전하게 처리
      const created = data?.campaign ?? data;
      if (!(status === 200 || status === 201)) throw new Error('Unexpected status: ' + status);

      // 화면 즉시 반영: 담당자(User) 정보 매칭
      const managerId = created.managerId ?? created.manager ?? Number(campaignData.UserId);
      const manager = users?.find((u) => u.id === managerId);

      const newCampaign = {
        ...created,
        posts: created.posts ?? [],
        User: manager ?? { 
          id: managerId, 
          name: manager?.name || manager?.username || '담당자',
          username: manager?.username || '담당자'
        },
        // 추가 필드들을 프론트엔드 형식으로 매핑
        invoiceIssued: created.invoiceIssued,
        paymentCompleted: created.paymentCompleted,
        invoiceDueDate: created.invoiceDueDate,
        paymentDueDate: created.paymentDueDate,
        managerId: managerId,
        updatedAt: created.updatedAt
      };

      setCampaigns((prev) => [...prev, newCampaign]);
      setModalOpen(false);
      showSuccess('캠페인이 성공적으로 생성되었습니다.');
    } catch (err) {
      console.error('❌ 캠페인 생성 실패:', err);
      console.error('❌ Error type:', typeof err);
      console.error('❌ Error name:', err.name);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error stack:', err.stack);
      if (err.response) {
        console.error('❌ Response status:', err.response.status);
        console.error('❌ Response data:', err.response.data);
        console.error('❌ Response headers:', err.response.headers);
      }
      console.error('❌ Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
      
      // Network/Fetch 관련 에러 체크
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        console.error('🚨 네트워크 연결 실패 - HTTP/HTTPS 또는 CORS 문제');
        showError('백엔드 서버 연결 실패: CORS 정책 또는 서버 500 에러 발생. 백엔드 개발자에게 문의하세요.');
        return;
      }
      
      // CORS 에러 특별 처리
      if (err.message?.includes('CORS') || err.message?.includes('Access-Control-Allow-Origin')) {
        console.error('🚨 CORS 정책 에러 - 백엔드 서버 설정 필요');
        showError('CORS 정책 에러: 백엔드 서버에서 프론트엔드 도메인을 허용해야 합니다.');
        return;
      }
      
      // 인증 관련 에러인지 확인
      if (err.response?.status === 401) {
        console.error('Authentication failed - clearing token and redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        showError('인증이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/login';
        return;
      }
      
      // 서버 에러인 경우 디버깅 정보 추가
      if (err.response?.status === 500) {
        console.error('Server error details:', {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers,
          data: err.config?.data,
          response: err.response?.data
        });
        showError('서버 에러가 발생했습니다. 콘솔을 확인해주세요.');
        return;
      }
      
      showError(err?.response?.data?.message ?? err.message ?? '캠페인 생성에 실패했습니다.');
    }
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setEditModalOpen(true);
  };

  const handleSaveEditedCampaign = async () => {
    try {
      // 캠페인 목록 새로고침 (JWT 인증)
      console.log('[CAMPAIGN-REFRESH] Calling API: /api/campaigns/');
      const response = await api.get('/api/campaigns/');
      console.log('[CAMPAIGN-REFRESH] API Response:', response.data);
      console.log('[CAMPAIGN-REFRESH] Response status:', response.status);

      // 백엔드 응답 구조: { data: [...], pagination: {...} }
      const campaignsData = response.data?.data || response.data || [];
      console.log('[CAMPAIGN-REFRESH] Extracted campaigns:', campaignsData);
      console.log('[CAMPAIGN-REFRESH] First campaign structure:', campaignsData[0]);

      setCampaigns(campaignsData);
      setEditModalOpen(false);
      setEditingCampaign(null);

      showSuccess('캠페인이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('캠페인 목록 새로고침 실패:', error);
      showError('캠페인 목록 새로고침에 실패했습니다.');
    }
  };

  const handleDeleteCampaign = async (campaignId, campaignName) => {
    console.log(`[MODAL] 삭제 모달 열기 - campaignId: ${campaignId}, name: ${campaignName}`);
    setDeleteConfirm({
      isOpen: true,
      campaign: { id: campaignId, name: campaignName }
    });
    console.log(`[MODAL] 삭제 모달 상태 설정 완료`);
  };

  const confirmDelete = async () => {
    console.log(`[CONFIRM] confirmDelete 함수 호출됨`);
    console.log(`[CONFIRM] deleteConfirm 상태:`, deleteConfirm);
    
    if (!deleteConfirm.campaign) {
      console.error('[CONFIRM] deleteConfirm.campaign이 null입니다!');
      return;
    }
    
    const { id: campaignId, name: campaignName } = deleteConfirm.campaign;

    console.log(`[DELETE] 캠페인 삭제 시작: ${campaignId}`);
    setDeletingCampaignId(campaignId);
    
    try {
      // JWT 인증을 통한 캠페인 삭제
      console.log(`[DELETE] API 호출 - campaignId: ${campaignId}`);
      
      const response = await api.delete(`/api/campaigns/${campaignId}`);
      
      console.log(`[DELETE] 응답 수신 - Status: ${response.status}`, response);
      
      // 성공 처리 - API 클라이언트가 에러를 throw하지 않았다면 성공
      console.log(`[DELETE] 성공 처리 시작`);
      // 캠페인 목록에서 제거
      setCampaigns((prev) => prev.filter(c => c.id !== campaignId));
      showSuccess('캠페인이 성공적으로 삭제되었습니다.');
      console.log(`[DELETE] 성공 완료`);
      
    } catch (err) {
      console.error('[DELETE] 캠페인 삭제 실패:', err);
      console.error('[DELETE] 에러 상세:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      
      // 실제 에러 처리
      if (err.response?.status === 403) {
        showError('이 캠페인을 삭제할 권한이 없습니다.');
      } else if (err.response?.status === 404) {
        showError('캠페인을 찾을 수 없습니다.');
      } else {
        showError(err?.response?.data?.detail ?? err?.response?.data?.message ?? '캠페인 삭제에 실패했습니다.');
      }
    } finally {
      console.log(`[DELETE] finally 블록 실행`);
      setDeletingCampaignId(null);
      setDeleteConfirm({ isOpen: false, campaign: null });
    }
  };

  const filteredCampaigns = ensureArray(campaigns).filter((c) =>
    (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // 클라이언트는 신규 캠페인 생성 버튼 숨김(정책에 맞게 조정 가능)
  const canCreate = currentUser?.role && currentUser.role !== '클라이언트';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="캠페인명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg"
          />
        </div>

        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            <span>새 캠페인 생성</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th className="px-6 py-3">캠페인명</th>
              <th className="px-6 py-3">클라이언트</th>
              <th className="px-6 py-3">담당자</th>
              <th className="px-6 py-3">진행률 (완료/총)</th>
              <th className="px-6 py-3">매출 현황</th>
              <th className="px-6 py-3">재무 상태</th>
              <th className="px-6 py-3">집행 상태</th>
              <th className="px-6 py-3">최근 업데이트</th>
              <th className="px-6 py-3">카톡 관리</th>
              {(currentUser?.role === '슈퍼 어드민' || currentUser?.role === '대행사 어드민' || currentUser?.role === '직원') && (
                <th className="px-6 py-3">관리</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map((campaign) => {
              // 디버깅: 캠페인 데이터 구조 확인
              console.log('Campaign data:', {
                id: campaign.id,
                manager_name: campaign.manager_name,
                User: campaign.User,
                posts: campaign.posts,
                post_count: campaign.post_count
              });
              
              const posts = campaign.posts || [];
              const completedCount = posts.filter((p) => p.publishedUrl || p.published_url).length;
              const totalCount = posts.length || campaign.post_count || 0;
              const salesData = campaignSales[campaign.id] || { totalSales: 0, totalRevenue: 0, totalMargin: 0, totalCost: 0 };

              return (
                <tr
                  key={campaign.id}
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <th 
                    scope="row" 
                    className="px-6 py-4 font-medium text-gray-900 cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      {campaign.memo && (
                        <div className="text-xs text-gray-500 mt-1">
                          특이사항: {campaign.memo}
                        </div>
                      )}
                    </div>
                  </th>
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    {/* 클라이언트 이름만 표시 (ID 정보 제거) */}
                    {getClientDisplayName(campaign.client_company || campaign.client)}
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    {campaign.creator_name || 
                     campaign.manager_name || 
                     campaign.User?.name || 
                     users?.find(u => u.id === campaign.creator_id)?.name ||
                     'N/A'}
                  </td>
                  <td 
                    className="px-6 py-4 font-medium cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    <div className="text-center">
                      <div className="font-medium">{`${completedCount}/${totalCount}`}</div>
                      <div className="text-xs text-gray-500">
                        {totalCount > 0 ? Math.round((completedCount/totalCount) * 100) : 0}%
                      </div>
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    <div className="text-sm">
                      <div className="font-medium text-blue-600">
                        매출: {safeFormatCurrency(campaign.budget || 0)}
                        {console.log(`[CAMPAIGN-DEBUG] Campaign ${campaign.id} budget:`, campaign.budget, typeof campaign.budget)}
                      </div>
                      {/* 간단화: budget만 표시 */}
                    </div>
                  </td>
                  
                  {/* 재무 상태 */}
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-1">
                        <span className={`w-2 h-2 rounded-full ${campaign.invoiceIssued ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                        <span className="text-xs">
                          {campaign.invoiceIssued ? (
                            <span className="text-blue-600">📄 계산서 발행</span>
                          ) : (
                            <span className="text-gray-500">📄 계산서 미발행</span>
                          )}
                        </span>
                        {campaign.invoiceDueDate && (
                          <div className={`text-xs ml-1 ${
                            !campaign.invoiceIssued && new Date(campaign.invoiceDueDate) < new Date() 
                              ? 'text-red-600 font-medium' 
                              : 'text-gray-500'
                          }`}>
                            {!campaign.invoiceIssued && new Date(campaign.invoiceDueDate) < new Date() && '⚠️ '}
                            ({new Date(campaign.invoiceDueDate).toLocaleDateString()})
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`w-2 h-2 rounded-full ${campaign.paymentCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-xs">
                          {campaign.paymentCompleted ? (
                            <span className="text-green-600">💰 입금 완료</span>
                          ) : (
                            <span className="text-gray-500">💰 입금 대기</span>
                          )}
                        </span>
                        {campaign.paymentDueDate && (
                          <div className={`text-xs ml-1 ${
                            !campaign.paymentCompleted && new Date(campaign.paymentDueDate) < new Date() 
                              ? 'text-red-600 font-medium' 
                              : 'text-gray-500'
                          }`}>
                            {!campaign.paymentCompleted && new Date(campaign.paymentDueDate) < new Date() && '⚠️ '}
                            ({new Date(campaign.paymentDueDate).toLocaleDateString()})
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* 집행 상태 */}
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.executionStatus === '완료' 
                          ? 'bg-green-100 text-green-800'
                          : campaign.executionStatus === '승인'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.executionStatus || '대기'}
                      </span>
                      {campaign.executionStatus === '승인' && campaign.executionApprovedAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(campaign.executionApprovedAt).toLocaleDateString()}
                        </span>
                      )}
                      {campaign.executionStatus === '완료' && campaign.executionCompletedAt && (
                        <span className="text-xs text-gray-500">
                          {new Date(campaign.executionCompletedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    {campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setChatContentModal(campaign);
                      }}
                      className="text-green-600 hover:text-green-900"
                      title="카톡 내용 정리"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </td>
                  {canEditCampaign(currentUser, campaign) && (
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* 편집 버튼 - 모든 계정이 자신의 권한 안에 있는 캠페인 편집 가능 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCampaign(campaign);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="캠페인 편집"
                        >
                          <Edit size={16} />
                        </button>
                        
                        {/* 삭제 버튼 - 편집 권한과 동일하게 적용 */}
                        {canEditCampaign(currentUser, campaign) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCampaign(campaign.id, campaign.name);
                            }}
                            disabled={deletingCampaignId === campaign.id}
                            className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                            title="캠페인 삭제"
                          >
                            {deletingCampaignId === campaign.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {pagination && pagination.total_pages > 1 && (
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            전체 {pagination.total}개 중 {((pagination.page - 1) * pagination.size) + 1}-{Math.min(pagination.page * pagination.size, pagination.total)}개 표시
          </div>
          <div className="flex items-center space-x-2">
            {/* 이전 페이지 */}
            <button
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              disabled={!pagination.has_prev}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>

            {/* 페이지 번호들 */}
            {(() => {
              const pages = [];
              const currentPage = pagination.page;
              const totalPages = pagination.total_pages;
              
              // 시작과 끝 페이지 계산 (현재 페이지 기준 ±2)
              const start = Math.max(1, currentPage - 2);
              const end = Math.min(totalPages, currentPage + 2);
              
              // 첫 페이지 표시
              if (start > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => onPageChange && onPageChange(1)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    1
                  </button>
                );
                if (start > 2) {
                  pages.push(<span key="start-ellipsis" className="px-2 text-gray-500">...</span>);
                }
              }
              
              // 현재 페이지 주변 페이지들
              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => onPageChange && onPageChange(i)}
                    className={`px-3 py-1 text-sm border rounded-md ${
                      i === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              
              // 마지막 페이지 표시
              if (end < totalPages) {
                if (end < totalPages - 1) {
                  pages.push(<span key="end-ellipsis" className="px-2 text-gray-500">...</span>);
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => onPageChange && onPageChange(totalPages)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                );
              }
              
              return pages;
            })()}

            {/* 다음 페이지 */}
            <button
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              disabled={!pagination.has_next}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <NewCampaignModal users={users} onSave={handleSaveCampaign} onClose={() => setModalOpen(false)} />
      )}

      {isEditModalOpen && (
        <CampaignEditModal 
          campaign={editingCampaign} 
          onSave={handleSaveEditedCampaign} 
          onClose={() => setEditModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* 카톡 내용 정리 모달 */}
      {chatContentModal && (
        <ChatContentModal 
          campaign={chatContentModal}
          onClose={() => setChatContentModal(null)}
          onSave={(chatData) => {
            // 여기서 캠페인의 카톡 내용을 업데이트할 수 있습니다
            console.log('카톡 내용 저장:', chatData);
            setChatContentModal(null);
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, campaign: null })}
        onConfirm={confirmDelete}
        title="캠페인 삭제"
        message={`정말 "${deleteConfirm.campaign?.name}" 캠페인을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 캠페인과 관련된 모든 주제/목차 데이터가 삭제됩니다.`}
        type="error"
        confirmText="삭제"
        cancelText="취소"
        loading={deletingCampaignId !== null}
      />
    </div>
  );
};


export default CampaignList;
