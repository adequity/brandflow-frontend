// src/pages/CampaignListPage.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import CampaignList from '../components/campaigns/CampaignList';

const CampaignListPage = ({ users, loggedInUser }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCampaigns = useCallback(async () => {
    if (!loggedInUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/api/campaigns', {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role, // '슈퍼 어드민' | '대행사 어드민' | ...
        },
      });
      setCampaigns(data || []);
    } catch (err) {
      console.error('캠페인 목록 로딩 실패:', err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, [loggedInUser]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSelect = (campaignId) => {
    navigate(`/admin/campaigns/${campaignId}`);
  };

  if (loading) return <div className="p-6">캠페인 목록을 불러오는 중...</div>;

  return (
    <CampaignList
      campaigns={campaigns}
      setCampaigns={setCampaigns}
      users={users}
      onSelectCampaign={handleSelect}
      currentUser={loggedInUser}
    />
  );
};

export default CampaignListPage;
