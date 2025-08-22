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

const CampaignList = ({ campaigns, setCampaigns, campaignSales = {}, users, onSelectCampaign, currentUser }) => {
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, campaign: null });
  const [chatContentModal, setChatContentModal] = useState(null);

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
      
      // 실제 폼 데이터를 사용한 페이로드
      const payload = {
        name: campaignData.name?.trim() || '테스트 캠페인',
        client: campaignData.clientName || 'Unknown Client',
        userId: campaignData.UserId || currentUser?.id || 1,
        managerId: campaignData.UserId || currentUser?.id || 1,
        budget: campaignData.budget || 0,
        notes: campaignData.notes || null,
        reminders: campaignData.reminders || null,
        invoiceIssued: campaignData.invoiceIssued || false,
        paymentCompleted: campaignData.paymentCompleted || false,
        invoiceDueDate: campaignData.invoiceDueDate || null,
        paymentDueDate: campaignData.paymentDueDate || null
      };
      
      console.log('Payload to send:', payload);

      // 대행사/슈퍼 권한 체크용 viewer 파라미터 포함
      const { data, status } = await api.post('/api/campaigns', payload, {
        params: currentUser?.id ? { viewerId: currentUser.id, viewerRole: currentUser.role } : {},
      });

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
      console.error('캠페인 생성 실패:', err);
      
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
      // 캠페인 목록 새로고침
      const { data } = await api.get('/api/campaigns', {
        params: currentUser?.id ? { viewerId: currentUser.id, viewerRole: currentUser.role } : {},
      });
      setCampaigns(data || []);
      setEditModalOpen(false);
      setEditingCampaign(null);
    } catch (error) {
      console.error('캠페인 목록 새로고침 실패:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId, campaignName) => {
    setDeleteConfirm({
      isOpen: true,
      campaign: { id: campaignId, name: campaignName }
    });
  };

  const confirmDelete = async () => {
    const { id: campaignId, name: campaignName } = deleteConfirm.campaign;

    setDeletingCampaignId(campaignId);
    try {
      await api.delete(`/api/campaigns/${campaignId}/`);
      
      // 캠페인 목록에서 제거
      setCampaigns((prev) => prev.filter(c => c.id !== campaignId));
      
      showSuccess('캠페인이 성공적으로 삭제되었습니다.');
    } catch (err) {
      console.error('캠페인 삭제 실패:', err);
      showError(err?.response?.data?.message ?? '캠페인 삭제에 실패했습니다.');
    } finally {
      setDeletingCampaignId(null);
      setDeleteConfirm({ isOpen: false, campaign: null });
    }
  };

  const filteredCampaigns = (campaigns || []).filter((c) =>
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
                    {campaign.client}
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    {campaign.manager_name || 
                     campaign.User?.name || 
                     users?.find(u => u.id === campaign.managerId || u.id === campaign.manager)?.name ||
                     users?.find(u => u.id === campaign.managerId || u.id === campaign.manager)?.username ||
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
                        매출: {salesData.totalRevenue.toLocaleString()}원
                      </div>
                      <div className="text-xs text-gray-500">
                        원가: {(salesData.totalCost || 0).toLocaleString()}원
                      </div>
                      <div className="text-xs text-green-600">
                        {salesData.totalSales}건 / 이익 {salesData.totalMargin.toLocaleString()}원
                      </div>
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
                  {(currentUser?.role === '슈퍼 어드민' || currentUser?.role === '대행사 어드민' || currentUser?.role === '직원') && (
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* 편집 버튼 - 슈퍼 어드민, 대행사 어드민, 직원 모두 가능 */}
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
                        
                        {/* 삭제 버튼 - 슈퍼 어드민만 가능 */}
                        {currentUser?.role === '슈퍼 어드민' && (
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
        type="danger"
        confirmText="삭제"
        cancelText="취소"
        loading={deletingCampaignId !== null}
      />
    </div>
  );
};


export default CampaignList;
