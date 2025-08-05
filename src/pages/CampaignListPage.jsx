import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search } from 'lucide-react';
import NewCampaignModal from '../components/modals/NewCampaignModal';

// ⭐️ [수정] loggedInUser를 prop으로 받습니다.
const CampaignListPage = ({ users, loggedInUser }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchCampaigns = useCallback(async () => {
        if (!loggedInUser) return; // 로그인 정보가 없으면 실행하지 않음

        setIsLoading(true);
        try {
            // ⭐️ [수정] API 요청 시 쿼리 파라미터로 관리자 정보를 전달합니다.
            const response = await axios.get(${import.meta.env.VITE_API_URL}/api/campaigns', {
                params: {
                    adminId: loggedInUser.id,
                    adminRole: loggedInUser.role
                }
            });
            setCampaigns(response.data);
        } catch (error) {
            console.error("캠페인 목록 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, [loggedInUser]); // loggedInUser가 바뀔 때마다 함수를 재생성

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const handleSaveCampaign = async (campaignData) => {
        try {
            const payload = {
                name: campaignData.name,
                client: campaignData.clientName,
                userId: campaignData.clientId,
                managerId: campaignData.managerId
            };
            await axios.post(${import.meta.env.VITE_API_URL}/api/campaigns', payload);
            setModalOpen(false);
            fetchCampaigns(); // 저장 후 목록을 다시 불러옵니다.
        } catch (error) {
            alert("캠페인 생성에 실패했습니다.");
        }
    };
    
    const filteredCampaigns = (campaigns || []).filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (isLoading) {
        return <div className="p-6">캠페인 목록을 불러오는 중...</div>;
    }

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
                            const posts = campaign.Posts || [];
                            const completedCount = posts.filter(p => p.publishedUrl).length;
                            const totalCount = posts.length;
                            return (
                                <tr key={campaign.id} className="bg-white border-b hover:bg-gray-50 cursor-pointer" 
                                    onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}>
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900">{campaign.name}</th>
                                    <td className="px-6 py-4">{campaign.client}</td>
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

export default CampaignListPage;
