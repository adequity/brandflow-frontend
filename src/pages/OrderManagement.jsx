// src/pages/OrderManagement.jsx - 대행사 어드민용 발주 관리 시스템
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, FileText, DollarSign, User, Calendar, Package } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useOrder } from '../contexts/OrderContext';
import ConfirmModal from '../components/ui/ConfirmModal';

const OrderManagement = ({ loggedInUser }) => {
  const { showSuccess, showError, showInfo } = useToast();
  const { orderRequests, setOrderRequests, fetchOrderRequests, updateOrderStatus } = useOrder();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [approveConfirm, setApproveConfirm] = useState({ isOpen: false, orderId: null });
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    rejectedOrders: 0,
    totalAmount: 0,
    thisMonthAmount: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    requesterName: '',
    resourceType: ''
  });
  const [statusList, setStatusList] = useState([]);
  const [requesterList, setRequesterList] = useState([]);

  // 상태 목록 조회 (안전한 구현)
  const loadStatusList = async () => {
    try {
      const response = await api.get('/api/campaigns/order-status-list');
      if (response.data.success && response.data.status_list) {
        setStatusList(response.data.status_list);
        console.log('OrderManagement: 상태 목록 로드 완료', response.data.status_list);
      } else {
        throw new Error('상태 목록 응답 오류');
      }
    } catch (error) {
      console.error('상태 목록 로딩 실패:', error);
      // 실패 시 기본값 사용 (하드코딩 대신 안전한 fallback)
      setStatusList([
        { value: "대기", label: "대기", color: "yellow" },
        { value: "승인", label: "승인", color: "green" },
        { value: "거부", label: "거부", color: "red" }
      ]);
    }
  };

  // 요청자 목록 조회 (안전한 구현)
  const loadRequesterList = async () => {
    try {
      console.log('OrderManagement: 요청자 목록 로딩 시작...');
      const response = await api.get('/api/campaigns/order-requesters');
      if (response.data.success && response.data.requester_list) {
        setRequesterList(response.data.requester_list);
        console.log('OrderManagement: 요청자 목록 로드 완료', response.data.requester_list);
      } else {
        throw new Error('요청자 목록 응답 오류');
      }
    } catch (error) {
      console.error('요청자 목록 로딩 실패:', error);
      console.error('Error details:', error.response?.data, error.response?.status);

      // 에러 발생 시 실제 orderRequests에서 requester_name 추출 (fallback)
      if (orderRequests && orderRequests.length > 0) {
        const uniqueRequesters = [...new Set(orderRequests
          .filter(order => order.requester_name)
          .map(order => order.requester_name)
        )];
        const fallbackList = uniqueRequesters.map(name => ({
          user_name: name,
          label: name,
          user_id: name // fallback으로 이름을 ID로 사용
        }));
        setRequesterList(fallbackList);
        console.log('OrderManagement: 요청자 목록 fallback 사용', fallbackList);
      } else {
        // orderRequests가 없으면 빈 목록으로 설정
        setRequesterList([]);
        console.log('OrderManagement: orderRequests 없음, 빈 요청자 목록 설정');
      }
    }
  };

  // 발주요청 목록 조회
  const loadOrderRequests = async () => {
    if (!loggedInUser?.id) return;

    setIsLoading(true);
    try {
      // 모든 발주요청 조회 (필터링 제거)
      await fetchOrderRequests();
      console.log('OrderManagement: 발주 요청 목록 로드 완료');
    } catch (error) {
      console.error('발주요청 목록 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 통계 계산
  const calculateStats = () => {
    const totalOrders = orderRequests.length;
    const pendingOrders = orderRequests.filter(o => o.status === '대기').length;
    const approvedOrders = orderRequests.filter(o => o.status === '승인').length;
    const rejectedOrders = orderRequests.filter(o => o.status === '거부').length;
    const totalAmount = orderRequests
      .filter(order => order.status === '승인')
      .reduce((sum, order) => sum + (Number(order.cost_price) || 0), 0);

    const thisMonth = new Date();
    const thisMonthApprovedOrders = orderRequests.filter(order => {
      const orderDate = new Date(order.created_at);
      return order.status === '승인' &&
             orderDate.getMonth() === thisMonth.getMonth() &&
             orderDate.getFullYear() === thisMonth.getFullYear();
    });
    const thisMonthAmount = thisMonthApprovedOrders.reduce((sum, order) => sum + (Number(order.cost_price) || 0), 0);
    
    setStats({
      totalOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      totalAmount,
      thisMonthAmount
    });
  };

  useEffect(() => {
    const loadData = async () => {
      await loadStatusList();
      await loadOrderRequests();
      // orderRequests 로드 완료 후 requesterList 로드
      await loadRequesterList();
    };

    if (loggedInUser?.id) {
      loadData();
    }
  }, [loggedInUser]);
  
  // orderRequests가 변경될 때마다 통계 재계산
  useEffect(() => {
    calculateStats();
  }, [orderRequests]);

  // 필터링된 발주요청 목록
  const filteredOrderRequests = orderRequests.filter(order => {
    // 디버깅용 로그 (한번만 출력)
    if (orderRequests.indexOf(order) === 0 && (filters.status || filters.requesterName || filters.resourceType)) {
      console.log('FilterDebug: 필터 상태', filters);
      console.log('FilterDebug: 요청자 목록', requesterList);
      console.log('FilterDebug: 첫번째 발주요청 데이터', {
        id: order.id,
        status: order.status,
        requester_name: order.requester_name,
        resource_type: order.resource_type
      });
    }
    // 상태 필터
    if (filters.status && order.status !== filters.status) {
      return false;
    }

    // 요청자 필터 (requester_name 기준)
    if (filters.requesterName && order.requester_name !== filters.requesterName) {
      console.log('FilterDebug: 요청자 필터 미일치', {
        filterValue: filters.requesterName,
        orderRequesterName: order.requester_name,
        orderId: order.id
      });
      return false;
    }

    // 유형 필터
    if (filters.resourceType && order.resource_type !== filters.resourceType) {
      return false;
    }

    return true;
  });

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      status: '',
      requesterName: '',
      resourceType: ''
    });
  };

  // 실시간 업데이트를 위한 이벤트 리스너
  useEffect(() => {
    const handleNewOrderRequest = () => {
      loadOrderRequests(); // 새로운 발주 요청 시 목록 새로고침
    };

    window.addEventListener('newOrderRequest', handleNewOrderRequest);

    return () => {
      window.removeEventListener('newOrderRequest', handleNewOrderRequest);
    };
  }, []);

  // 발주요청 승인
  const handleApproveOrder = (orderId) => {
    setApproveConfirm({ isOpen: true, orderId });
  };

  const confirmApproveOrder = async () => {
    const orderId = approveConfirm.orderId;

    try {
      const orderToApprove = orderRequests.find(o => o.id === orderId);

      console.log('현재 로그인 사용자:', loggedInUser);

      // OrderContext를 통한 상태 업데이트 (JWT 기반 실제 API 호출)
      const success = await updateOrderStatus(orderId, '승인', '발주 승인 완료');

      if (success) {
        showSuccess(`발주요청이 승인되었습니다!\n\n발주번호: ${orderToApprove?.orderNumber || `ORD-${orderId.toString().padStart(6, '0')}`}\n제목: ${orderToApprove?.title}\n금액: ${orderToApprove?.total_cost ? Number(orderToApprove.total_cost).toLocaleString() : '0'}원`);
        setApproveConfirm({ isOpen: false, orderId: null });
      }

    } catch (error) {
      console.error('발주요청 승인 실패:', error);
      showError('승인 처리에 실패했습니다.');
    }
  };

  // 발주요청 거절
  const handleRejectOrder = async (orderId) => {
    const rejectReason = prompt('거절 사유를 입력하세요:');
    if (!rejectReason) return;

    try {
      const orderToReject = orderRequests.find(o => o.id === orderId);

      // OrderContext를 통한 상태 업데이트 (JWT 기반 실제 API 호출)
      const success = await updateOrderStatus(orderId, '거부', `거절 사유: ${rejectReason}`);

      if (success) {
        showInfo(`발주요청이 거절되었습니다!\n\n발주번호: ${orderToReject?.orderNumber || `ORD-${orderId.toString().padStart(6, '0')}`}\n제목: ${orderToReject?.title}\n거절 사유: ${rejectReason}`);
      }

    } catch (error) {
      console.error('발주요청 거절 실패:', error);
      showError('거절 처리에 실패했습니다.');
    }
  };

  // 상세 보기
  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  // 상태 배지 생성
  const getStatusBadge = (status) => {
    const statusConfig = {
      '대기': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      '발주 대기': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      '승인': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      '승인완료': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      '거부': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      '거절됨': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      '완료': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package },
      '처리완료': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package }
    };

    const config = statusConfig[status] || statusConfig['대기'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={12} className="mr-1" />
        {status}
      </span>
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center">발주요청 목록을 불러오는 중...</div>;
  }

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">발주 관리</h1>
          <p className="text-gray-600 mt-1">직원들의 발주요청을 검토하고 승인/거절합니다</p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 발주</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">대기중</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">승인됨</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.approvedOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">거절됨</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.rejectedOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 금액</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalAmount?.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">이번달</p>
              <p className="text-lg font-semibold text-gray-900">{stats.thisMonthAmount?.toLocaleString()}원</p>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* 상태 필터 */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 min-w-[120px]"
            >
              <option value="">전체 상태</option>
              {statusList.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* 요청자 필터 */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">요청자</label>
            <select
              value={filters.requesterName}
              onChange={(e) => setFilters(prev => ({ ...prev, requesterName: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 min-w-[120px]"
            >
              <option value="">전체 요청자</option>
              {requesterList.map(requester => (
                <option key={requester.user_id} value={requester.user_name}>{requester.label}</option>
              ))}
            </select>
          </div>

          {/* 유형 필터 */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">유형</label>
            <select
              value={filters.resourceType}
              onChange={(e) => setFilters(prev => ({ ...prev, resourceType: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 min-w-[120px]"
            >
              <option value="">전체 유형</option>
              <option value="매출 연동 발주">매출 연동 발주</option>
              <option value="캠페인 업무 발주">캠페인 업무 발주</option>
              <option value="광고비">광고비</option>
              <option value="콘텐츠 제작비">콘텐츠 제작비</option>
              <option value="도구 구독료">도구 구독료</option>
              <option value="기타">기타</option>
            </select>
          </div>

          {/* 필터 초기화 버튼 */}
          <div className="flex flex-col justify-end">
            <button
              onClick={resetFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 transition-colors"
            >
              필터 초기화
            </button>
          </div>

          {/* 필터 결과 표시 */}
          <div className="flex flex-col justify-end ml-auto">
            <span className="text-sm text-gray-600">
              총 {orderRequests.length}건 중 {filteredOrderRequests.length}건 표시
            </span>
          </div>
        </div>
      </div>

      {/* 발주요청 목록 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrderRequests.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber || `ORD-${order.id.toString().padStart(6, '0')}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.title}</div>
                      <div className="text-sm text-gray-500">{order.description?.substring(0, 50)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {order.requester_name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.requester_name || '알 수 없음'}</div>
                        <div className="text-sm text-gray-500">{order.campaign_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.total_cost ? Number(order.total_cost).toLocaleString() : '0'}원
                    {order.product_cost && order.quantity && (
                      <div className="text-xs text-gray-500 mt-1">
                        {Number(order.product_cost).toLocaleString()}원 × {order.quantity}개
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div>{order.resource_type}</div>
                      <div className="text-xs text-gray-400">{order.work_type}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* 상세 보기 */}
                      <button
                        onClick={() => handleViewDetail(order)}
                        className="text-blue-600 hover:text-blue-900"
                        title="상세 보기"
                      >
                        <Eye size={16} />
                      </button>

                      {/* 승인 버튼 */}
                      {order.status === '대기' && (
                        <>
                          <button
                            onClick={() => handleApproveOrder(order.id)}
                            className="text-green-600 hover:text-green-900"
                            title="승인"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleRejectOrder(order.id)}
                            className="text-red-600 hover:text-red-900"
                            title="거절"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orderRequests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            발주요청이 없습니다.
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {isDetailModalOpen && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedOrder(null);
          }}
          onApprove={handleApproveOrder}
          onReject={handleRejectOrder}
        />
      )}

      {/* 승인 확인 모달 */}
      <ConfirmModal
        isOpen={approveConfirm.isOpen}
        onClose={() => setApproveConfirm({ isOpen: false, orderId: null })}
        onConfirm={confirmApproveOrder}
        title="발주요청 승인"
        message="이 발주요청을 승인하시겠습니까?\n승인 시 본사 지출에 반영됩니다."
        type="info"
        confirmText="승인"
        cancelText="취소"
      />
    </div>
  );
};

// 발주요청 상세보기 모달
const OrderDetailModal = ({ order, isOpen, onClose, onApprove, onReject }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">발주요청 상세정보</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {/* 기본 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">기본 정보</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">요청번호:</span> {order.orderNumber || `ORD-${order.id.toString().padStart(6, '0')}`}
              </div>
              <div>
                <span className="font-medium">상태:</span> {order.status}
              </div>
              <div>
                <span className="font-medium">요청자:</span> {order.requester_name}
              </div>
              <div>
                <span className="font-medium">요청일:</span> {new Date(order.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          {/* 발주 내용 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">발주 내용</h3>
            <div className="text-sm space-y-2">
              <div>
                <span className="font-medium">제목:</span> {order.title}
              </div>
              <div>
                <span className="font-medium">설명:</span>
                <p className="mt-1 text-gray-700">{order.description}</p>
              </div>
              <div>
                <span className="font-medium">금액:</span> {order.total_cost ? Number(order.total_cost).toLocaleString() : '0'}원
                {order.product_cost && order.quantity && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({Number(order.product_cost).toLocaleString()}원 × {order.quantity}개)
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">유형:</span> {order.resource_type}
              </div>
              {order.priority && (
                <div>
                  <span className="font-medium">우선순위:</span> {order.priority}
                </div>
              )}
              {order.due_date && (
                <div>
                  <span className="font-medium">희망 완료일:</span> {new Date(order.due_date).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* 연관 정보 */}
          {(order.campaign_id || order.post_id || order.work_type) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">연관 정보</h3>
              <div className="text-sm space-y-1">
                {order.campaign_id && (
                  <div>
                    <span className="font-medium">연관 캠페인:</span> {order.campaign_name || `캠페인 #${order.campaign_id}`}
                  </div>
                )}
                {order.post_id && (
                  <div>
                    <span className="font-medium">연관 업무:</span> {order.post_title || `업무 #${order.post_id}`}
                  </div>
                )}
                {order.work_type && (
                  <div>
                    <span className="font-medium">업무 타입:</span> {order.work_type}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 처리 정보 */}
          {(order.approverComment || order.rejectReason) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">처리 정보</h3>
              <div className="text-sm">
                {order.approverComment && (
                  <div>
                    <span className="font-medium">처리 의견:</span>
                    <p className="mt-1 text-gray-700">{order.approverComment}</p>
                  </div>
                )}
                {order.rejectReason && (
                  <div className="mt-2">
                    <span className="font-medium text-red-600">거절 사유:</span>
                    <p className="mt-1 text-red-700">{order.rejectReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          {order.status === '대기' && (
            <>
              <button
                onClick={() => {
                  onReject(order.id);
                  onClose();
                }}
                className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                거절
              </button>
              <button
                onClick={() => {
                  onApprove(order.id);
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                승인
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;