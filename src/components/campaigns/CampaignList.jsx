// src/components/campaigns/CampaignList.jsx
import React, { useState } from 'react';
import api from '../../api/client';
import { Plus, Search, Trash2 } from 'lucide-react';
import NewCampaignModal from '../modals/NewCampaignModal';

const CampaignList = ({ campaigns, setCampaigns, users, onSelectCampaign, currentUser }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);

  const handleSaveCampaign = async (campaignData) => {
    try {
      console.log('Campaign data received:', campaignData);
      
      const payload = {
        name: campaignData.name?.trim(),
        client: campaignData.clientName?.trim(),
        userId: Number(campaignData.clientId),
        managerId: Number(campaignData.UserId),
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
      const manager =
        users?.find((u) => u.id === (created.managerId ?? Number(campaignData.UserId))) ||
        users?.find((u) => u.id === Number(campaignData.UserId));

      const newCampaign = {
        ...created,
        posts: created.posts ?? [],
        User: created.User ?? manager ?? null,
      };

      setCampaigns((prev) => [...prev, newCampaign]);
      setModalOpen(false);
    } catch (err) {
      console.error('캠페인 생성 실패:', err);
      alert(err?.response?.data?.message ?? err.message ?? '캠페인 생성에 실패했습니다.');
    }
  };

  const handleDeleteCampaign = async (campaignId, campaignName) => {
    if (!window.confirm(`정말 "${campaignName}" 캠페인을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 캠페인과 관련된 모든 주제/목차 데이터가 삭제됩니다.`)) {
      return;
    }

    setDeletingCampaignId(campaignId);
    try {
      await api.delete(`/api/campaigns/${campaignId}`);
      
      // 캠페인 목록에서 제거
      setCampaigns((prev) => prev.filter(c => c.id !== campaignId));
      
      alert('캠페인이 성공적으로 삭제되었습니다.');
    } catch (err) {
      console.error('캠페인 삭제 실패:', err);
      alert(err?.response?.data?.message ?? '캠페인 삭제에 실패했습니다.');
    } finally {
      setDeletingCampaignId(null);
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
              <th className="px-6 py-3">최근 업데이트</th>
              {currentUser?.role === '슈퍼 어드민' && (
                <th className="px-6 py-3">관리</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map((campaign) => {
              const posts = campaign.posts || [];
              const completedCount = posts.filter((p) => p.publishedUrl).length;
              const totalCount = posts.length;

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
                    {campaign.name}
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
                    {campaign.User?.name || 'N/A'}
                  </td>
                  <td 
                    className="px-6 py-4 font-medium cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    {`${completedCount}/${totalCount}`}
                  </td>
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => onSelectCampaign(campaign.id)}
                  >
                    {campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleDateString() : '-'}
                  </td>
                  {currentUser?.role === '슈퍼 어드민' && (
                    <td className="px-6 py-4">
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
    </div>
  );
};

export default CampaignList;
