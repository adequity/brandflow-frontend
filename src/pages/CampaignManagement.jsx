import React, { useState } from 'react';
import CampaignList from '../components/campaigns/CampaignList';
import CampaignDetail from '../components/campaigns/CampaignDetail';

const CampaignManagement = ({ users, initialCampaigns, setCampaigns, onDataChange, loggedInUser }) => {
    // [수정] 전체 캠페인 객체 대신 ID만 저장하여 데이터 정합성을 보장합니다.
    const [selectedCampaignId, setSelectedCampaignId] = useState(null);

    // 렌더링 시점에 항상 최신 캠페인 목록(initialCampaigns)에서 선택된 캠페인 정보를 찾습니다.
    const selectedCampaign = selectedCampaignId
        ? initialCampaigns.find(c => c.id === selectedCampaignId)
        : null;

    if (!selectedCampaign) {
        return (
            <CampaignList
                campaigns={initialCampaigns}
                setCampaigns={setCampaigns}
                users={users}
                // [수정] 캠페인 객체 대신 ID를 전달하도록 onSelectCampaign을 변경합니다.
                onSelectCampaign={setSelectedCampaignId}
                currentUser={loggedInUser}
            />
        );
    }

    return (
        <CampaignDetail
            campaign={selectedCampaign}
            // [수정] 뒤로가기 시 ID를 null로 설정합니다.
            onBack={() => setSelectedCampaignId(null)}
            setCampaigns={setCampaigns}
            onDataChange={onDataChange}
            loggedInUser={loggedInUser}
        />
    );
};

export default CampaignManagement;
