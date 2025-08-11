// src/components/campaigns/CampaignList.jsx
import React, { useState } from 'react';
import api from '../../api/client';
import { Plus, Search } from 'lucide-react';
import NewCampaignModal from '../modals/NewCampaignModal';

const CampaignList = ({ campaigns, setCampaigns, users, onSelectCampaign, currentUser }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveCampaign = async (campaignData) => {
    try {
      const payload = {
        name: campaignData.name?.trim(),
        client: campaignData.clientName?.trim(),
        userId: Number(campaignData.clientId),
        managerId: Number(campaignData.managerId),
      };

      // 대행사/슈퍼 권한 체크용 viewer 파라미터 포함
      const { data, status } = await api.post('/api/campaigns', payload, {
        params: currentUser?.id ? { viewerId: currentUser.id, viewerRole: currentUser.role } : {},
      });

      // 서버가 {campaign:{...}} 또는 {...} 로 와도 안전하게 처리
      const created = data?.campaign ?? data;
      if (!(status === 200 || status === 201)) throw new Error('Unexpected status: ' + status);

      // 화면 즉시 반영: 담당자(User) 정보 매칭
      const manager =
        users?.find((u) => u.id === (created.managerId ?? Number(campaignData.managerId))) ||
        users?.find((u) => u.id === Number(campaignData.managerId));

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
                  className="bg-white border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectCampaign(campaign.id)}
                >
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900">
                    {campaign.name}
                  </th>
                  <td className="px-6 py-4">{campaign.client}</td>
                  <td className="px-6 py-4">{campaign.User?.name || 'N/A'}</td>
                  <td className="px-6 py-4 font-medium">{`${completedCount}/${totalCount}`}</td>
                  <td className="px-6 py-4">
                    {campaign.updatedAt ? new Date(campaign.updatedAt).toLocaleDateString() : '-'}
                  </td>
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
