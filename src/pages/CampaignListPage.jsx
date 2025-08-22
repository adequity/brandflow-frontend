// src/pages/CampaignListPage.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useApiCache, batchRequests } from '../utils/performanceUtils';
import CampaignList from '../components/campaigns/CampaignList';

const CampaignListPage = ({ campaigns: propsCanpaigns, setCampaigns, users, loggedInUser }) => {
  const [campaignSales, setCampaignSales] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // AdminUI에서 전달받은 campaigns 사용
  const campaigns = propsCanpaigns || [];

  const fetchCampaignSales = async (campaignList) => {
    if (!loggedInUser?.id || !campaignList.length) return;
    
    try {
      const salesData = {};
      
      // 각 캠페인별로 재무 요약 정보를 가져옴 (배치 처리로 최적화)
      const requests = campaignList.map(campaign => 
        () => api.get(`/api/campaigns/${campaign.id}/financial_summary/`)
      );
      
      const responses = await batchRequests(requests, 3);
      
      campaignList.forEach((campaign, index) => {
        try {
          const response = responses[index];
          const summary = response?.data;
          
          salesData[campaign.id] = {
            totalSales: summary.completed_tasks || 0,
            totalRevenue: summary.total_revenue || 0,
            totalMargin: summary.total_profit || 0,
            totalCost: summary.total_cost || 0,
            financial: {
              totalRevenue: summary.total_revenue || 0,
              totalCost: summary.total_cost || 0,
              totalProfit: summary.total_profit || 0,
              completedTasksCount: summary.completed_tasks || 0,
              totalTasksCount: summary.total_tasks || 0,
              completionRate: summary.completion_rate || 0,
              marginRate: summary.margin_rate || 0
            }
          };
        } catch (error) {
          console.error(`캠페인 ${campaign.id} 재무 데이터 로딩 실패:`, error);
          // 오류 발생 시 기본값 설정
          salesData[campaign.id] = {
            totalSales: 0,
            totalRevenue: 0,
            totalMargin: 0,
            totalCost: 0,
            financial: {
              totalRevenue: 0,
              totalCost: 0,
              totalProfit: 0,
              completedTasksCount: 0,
              totalTasksCount: 0,
              completionRate: 0,
              marginRate: 0
            }
          };
        }
      });
      
      setCampaignSales(salesData);
    } catch (error) {
      console.error('캠페인 매출 데이터 로딩 실패:', error);
      setCampaignSales({});
    }
  };

  useEffect(() => {
    if (campaigns.length > 0) {
      fetchCampaignSales(campaigns);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [campaigns, loggedInUser?.id]);

  const handleSelect = (campaignId) => {
    navigate(`/admin/campaigns/${campaignId}`);
  };

  if (loading) return <div className="p-6">캠페인 목록을 불러오는 중...</div>;

  return (
    <CampaignList
      campaigns={campaigns}
      setCampaigns={setCampaigns}
      campaignSales={campaignSales}
      users={users}
      onSelectCampaign={handleSelect}
      currentUser={loggedInUser}
    />
  );
};

export default CampaignListPage;
