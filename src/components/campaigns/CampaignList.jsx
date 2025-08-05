import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Search } from 'lucide-react';
import NewCampaignModal from '../modals/NewCampaignModal';

const CampaignList = ({ campaigns, setCampaigns, users, onSelectCampaign }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSaveCampaign = async (campaignData) => {
        try {
            const payload = {
                name: campaignData.name,
                client: campaignData.clientName,
                userId: campaignData.clientId,
                managerId: campaignData.managerId
            };
            const response = await axios.post(${import.meta.env.VITE_API_URL}/api/campaigns', payload);
            
            const manager = users.find(u => u.id === parseInt(campaignData.managerId));
            const newCampaign = { 
                ...response.data, 
                posts: [], 
                Manager: manager // ⭐️ [수정] User 대신 Manager로 응답을 구성합니다.
            };
            setCampaigns(prevCampaigns => [...prevCampaigns, newCampaign]);
            setModalOpen(false);
        } catch (error) {
            console.error("캠페인 생성 실패:", error);
            alert("캠페인 생성에 실패했습니다.");
        }
    };

    const filteredCampaigns = (campaigns || []).filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="캠페인명 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg" />
                </div>
                <button onClick={() => setModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus size={18} />
                    <span>새 캠페인 생성</span>
                </button>
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
                        {filteredCampaigns.map(campaign => {
                            const posts = campaign.posts || [];
                            const completedCount = posts.filter(p => p.publishedUrl).length;
                            const totalCount = posts.length;
                            return (
                                <tr key={campaign.id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" onClick={() => onSelectCampaign(campaign.id)}>
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900">{campaign.name}</th>
                                    <td className="px-6 py-4">{campaign.client}</td>
                                    {/* ⭐️ [수정] campaign.User?.name을 campaign.Manager?.name으로 변경합니다. */}
                                    <td className="px-6 py-4">{campaign.Manager?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 font-medium">{`${completedCount}/${totalCount}`}</td>
                                    <td className="px-6 py-4">{new Date(campaign.updatedAt).toLocaleDateString()}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <NewCampaignModal users={users} onSave={handleSaveCampaign} onClose={() => setModalOpen(false)} />}
        </div>
    );
};

export default CampaignList;
