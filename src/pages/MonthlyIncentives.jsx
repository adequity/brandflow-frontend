// src/pages/MonthlyIncentives.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, Calculator, CheckCircle, Clock, X, Download } from 'lucide-react';
import api from '../api/client';
import useModal from '../hooks/useModal';
import AlertModal from '../components/ui/AlertModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { LoadingButton } from '../components/ui/LoadingSpinner';

const MonthlyIncentives = ({ loggedInUser }) => {
  const [incentives, setIncentives] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // 모달 관리
  const {
    alertModal,
    confirmModal, 
    showAlert,
    showConfirm,
    showSuccess,
    showError,
    closeAlert,
    closeConfirm
  } = useModal();
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    status: '',
    userId: loggedInUser?.role === '직원' ? loggedInUser.id : ''
  });
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingIncentives: 0,
    approvedIncentives: 0,
    totalIncentiveAmount: 0,
    totalAdjustmentAmount: 0,
    totalFinalAmount: 0
  });

  const fetchIncentives = async () => {
    if (!loggedInUser?.id) return;
    
    setIsLoading(true);
    try {
      // 실제 사용자 데이터를 먼저 가져온다
      const { data: usersData } = await api.get('/api/users', {
        params: {
          adminId: loggedInUser.id,
          adminRole: loggedInUser.role
        }
      });
      
      // 인센티브 대상 직원 필터링
      const eligibleUsers = (usersData || []).filter(user => {
        if (loggedInUser.role === '직원') {
          return user.id === loggedInUser.id; // 직원은 본인만
        }
        if (loggedInUser.role === '대행사 어드민') {
          // 대행사 어드민은 자신 소속의 직원들만 (본인 제외)
          return user.role === '직원' && user.incentiveRate > 0 && user.company === loggedInUser.company;
        }
        // 슈퍼 어드민은 모든 직원과 대행사 어드민
        return (user.role === '직원' || user.role === '대행사 어드민') && user.incentiveRate > 0;
      });
      
      // 각 사용자의 캠페인 데이터를 기반으로 인센티브 계산
      const incentivePromises = eligibleUsers.map(async (user) => {
        try {
          // 해당 사용자의 캠페인 데이터 조회
          const campaignsResponse = await api.get('/api/campaigns/', {
            params: {
              viewerId: user.id,
              viewerRole: user.role,
              year: filters.year,
              month: filters.month
            }
          });
          
          const campaigns = campaignsResponse.data.results || campaignsResponse.data || [];
          
          // 완료된 캠페인들의 매출 계산
          const completedCampaigns = campaigns.filter(c => c.status === '완료' || c.status === '승인');
          const totalRevenue = completedCampaigns.reduce((sum, campaign) => {
            const campaignRevenue = campaign.posts?.reduce((postSum, post) => {
              return postSum + (post.unitPrice || 0) * (post.quantity || 1);
            }, 0) || 0;
            return sum + campaignRevenue;
          }, 0);
          
          // 인센티브 계산 (매출 * 인센티브율)
          const baseIncentive = Math.round(totalRevenue * (user.incentiveRate / 100));
          const adjustmentAmount = 0; // 기본값, 나중에 수동 조정 가능
          
          return {
            id: `${user.id}-${filters.year}-${filters.month}`,
            userId: user.id,
            user: {
              name: user.name,
              email: user.email,
              company: user.company || '미설정',
              incentiveRate: user.incentiveRate
            },
            year: filters.year,
            month: filters.month,
            totalRevenue,
            baseIncentiveAmount: baseIncentive,
            adjustmentAmount: adjustmentAmount,
            finalIncentiveAmount: baseIncentive + adjustmentAmount,
            status: baseIncentive > 0 ? '계산 완료' : '매출 없음',
            calculatedAt: new Date().toISOString(),
            campaignCount: completedCampaigns.length,
            notes: `${completedCampaigns.length}개 캠페인 기준, 매출: ${totalRevenue.toLocaleString()}원`
          };
        } catch (error) {
          console.error(`사용자 ${user.name}의 인센티브 계산 실패:`, error);
          // 오류 발생 시에도 기본 인센티브 레코드 생성
          return {
            id: `${user.id}-${filters.year}-${filters.month}`,
            userId: user.id,
            user: {
              name: user.name,
              email: user.email,
              company: user.company || '미설정',
              incentiveRate: user.incentiveRate
            },
            year: filters.year,
            month: filters.month,
            totalRevenue: 0,
            baseIncentiveAmount: 0,
            adjustmentAmount: 0,
            finalIncentiveAmount: 0,
            status: '계산 오류',
            calculatedAt: new Date().toISOString(),
            campaignCount: 0,
            notes: '데이터 계산 중 오류 발생'
          };
        }
      });
      
      const calculatedIncentives = await Promise.all(incentivePromises);
      
      // 필터 적용
      let filteredIncentives = calculatedIncentives;
      if (filters.status) {
        filteredIncentives = filteredIncentives.filter(i => i.status === filters.status);
      }
      if (filters.userId && filters.userId !== '') {
        filteredIncentives = filteredIncentives.filter(i => i.userId === parseInt(filters.userId));
      }
      
      setIncentives(filteredIncentives);
    } catch (error) {
      console.error('인센티브 목록 로딩 실패:', error);
      setIncentives([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!loggedInUser?.id) return;
    
    try {
      // incentives 상태를 기반으로 통계 계산
      if (incentives.length > 0) {
        const totalEmployees = incentives.length;
        const pendingIncentives = incentives.filter(i => i.status === '계산 완료' || i.status === '승인 대기').length;
        const approvedIncentives = incentives.filter(i => i.status === '승인완료').length;
        const totalIncentiveAmount = incentives.reduce((sum, i) => sum + i.baseIncentiveAmount, 0);
        const totalAdjustmentAmount = incentives.reduce((sum, i) => sum + i.adjustmentAmount, 0);
        const totalFinalAmount = incentives.reduce((sum, i) => sum + i.finalIncentiveAmount, 0);

        setStats({
          totalEmployees,
          pendingIncentives,
          approvedIncentives,
          totalIncentiveAmount,
          totalAdjustmentAmount,
          totalFinalAmount
        });
      } else {
        // 인센티브 데이터가 없을 때 기본 통계
        setStats({
          totalEmployees: 0,
          pendingIncentives: 0,
          approvedIncentives: 0,
          totalIncentiveAmount: 0,
          totalAdjustmentAmount: 0,
          totalFinalAmount: 0
        });
      }
    } catch (error) {
      console.error('인센티브 통계 계산 실패:', error);
    }
  };

  const fetchUsers = async () => {
    if (!loggedInUser?.id) return;
    
    try {
      const { data } = await api.get('/api/users', {
        params: {
          adminId: loggedInUser.id,
          adminRole: loggedInUser.role
        }
      });
      
      // 권한별 사용자 필터링
      const staffUsers = (data || []).filter(user => {
        if (loggedInUser.role === '직원') {
          return user.id === loggedInUser.id; // 직원은 본인만
        }
        if (loggedInUser.role === '대행사 어드민') {
          // 대행사 어드민은 자신 소속의 직원들만 (본인 제외)
          return user.role === '직원' && user.company === loggedInUser.company;
        }
        // 슈퍼 어드민은 모든 직원과 대행사 어드민
        return user.role === '직원' || user.role === '대행사 어드민';
      });
      setUsers(staffUsers);
    } catch (error) {
      console.error('사용자 목록 로딩 실패:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [loggedInUser]);

  useEffect(() => {
    fetchIncentives();
  }, [loggedInUser, filters]);

  // 인센티브 데이터가 변경되면 통계 업데이트
  useEffect(() => {
    fetchStats();
  }, [incentives]);

  const handleCalculateIncentives = async () => {
    const confirmed = await showConfirm({
      title: '인센티브 계산',
      message: `${filters.year}년 ${filters.month}월 인센티브를 계산하시겠습니까?\n\n이미 계산된 데이터가 있는 경우 건너뜁니다.`,
      type: 'info',
      confirmText: '계산 시작',
      cancelText: '취소'
    });
    
    if (!confirmed) return;
    
    setIsCalculating(true);
    try {
      const { data } = await api.post('/api/monthly-incentives/calculate', {
        year: filters.year,
        month: filters.month
      }, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      
      const successCount = data.results.filter(r => r.status === 'created').length;
      const skipCount = data.results.filter(r => r.status === 'skipped').length;
      
      await showSuccess(
        `인센티브 계산이 완료되었습니다.\n\n• 신규 계산: ${successCount}건\n• 기존 데이터 건너뜀: ${skipCount}건`,
        '계산 완료'
      );
      
      fetchIncentives();
      fetchStats();
    } catch (error) {
      console.error('인센티브 계산 실패:', error);
      await showError(
        error.response?.data?.message || '인센티브 계산에 실패했습니다.',
        '계산 실패'
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleStatusUpdate = async (incentiveId, status) => {
    try {
      await api.put(`/api/monthly-incentives/${incentiveId}`, { status }, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      fetchIncentives();
      fetchStats();
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
      await showError(
        error.response?.data?.message || '상태 업데이트에 실패했습니다.',
        '업데이트 실패'
      );
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      '계산중': { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      '검토대기': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      '승인완료': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      '지급완료': { bg: 'bg-blue-100', text: 'text-blue-800', icon: DollarSign },
      '보류': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Clock },
      '취소': { bg: 'bg-red-100', text: 'text-red-800', icon: X }
    };
    
    const config = statusConfig[status] || statusConfig['계산중'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={12} className="mr-1" />
        {status}
      </span>
    );
  };

  const canManageIncentives = ['슈퍼 어드민', '대행사 어드민'].includes(loggedInUser?.role);

  if (isLoading) {
    return <div className="p-8 text-center">인센티브 목록을 불러오는 중...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">월간 인센티브 관리</h1>
          <p className="text-gray-600 mt-1">직원들의 월간 인센티브를 계산하고 관리합니다</p>
        </div>
        {canManageIncentives && (
          <LoadingButton
            onClick={handleCalculateIncentives}
            loading={isCalculating}
            loadingText="계산 중..."
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Calculator size={20} />
            인센티브 계산
          </LoadingButton>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">대상 직원</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">검토대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingIncentives}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인완료</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedIncentives}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 지급액</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalFinalAmount.toLocaleString()}원</p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{month}월</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">전체</option>
              <option value="검토대기">검토대기</option>
              <option value="승인완료">승인완료</option>
              <option value="지급완료">지급완료</option>
              <option value="보류">보류</option>
              <option value="취소">취소</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">직원</label>
            {loggedInUser?.role === '직원' ? (
              <div className="w-full border border-gray-300 bg-gray-100 rounded-lg px-3 py-2 text-gray-700">
                {loggedInUser.name} (본인)
              </div>
            ) : (
              <select
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">전체 직원</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* 인센티브 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">직원</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기간</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매출/이익</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">인센티브율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계산금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조정금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">최종금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                {canManageIncentives && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {incentives.map((incentive) => (
                <tr key={incentive.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {incentive.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{incentive.user?.name}</div>
                        <div className="text-sm text-gray-500">{incentive.user?.company}</div>
                        <div className="text-sm text-gray-400">{incentive.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {incentive.year}년 {incentive.month}월
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      매출: {incentive.totalRevenue?.toLocaleString() || '0'}원
                    </div>
                    <div className="text-sm text-gray-500">
                      캠페인: {incentive.campaignCount || 0}개
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {incentive.user?.incentiveRate || 0}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {incentive.baseIncentiveAmount?.toLocaleString() || '0'}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {incentive.adjustmentAmount ? 
                      `${incentive.adjustmentAmount > 0 ? '+' : ''}${incentive.adjustmentAmount.toLocaleString()}원` : 
                      '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {incentive.finalIncentiveAmount?.toLocaleString() || '0'}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(incentive.status)}
                  </td>
                  {canManageIncentives && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {incentive.status === '검토대기' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(incentive.id, '승인완료')}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              승인
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(incentive.id, '보류')}
                              className="text-orange-600 hover:text-orange-900 text-xs"
                            >
                              보류
                            </button>
                          </>
                        )}
                        {incentive.status === '승인완료' && (
                          <button
                            onClick={() => handleStatusUpdate(incentive.id, '지급완료')}
                            className="text-blue-600 hover:text-blue-900 text-xs"
                          >
                            지급완료
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {incentives.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            해당 조건의 인센티브 데이터가 없습니다.
          </div>
        )}
      </div>
      
      {/* 모달들 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        buttonText={alertModal.buttonText}
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        loading={confirmModal.loading}
      />
    </div>
  );
};

export default MonthlyIncentives;