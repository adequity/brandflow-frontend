import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';
import { useNotifications } from './NotificationContext';
import api from '../api/client';

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [orderRequests, setOrderRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 발주 요청 생성
  const createOrderRequest = async (orderData) => {
    try {
      setIsLoading(true);
      
      // 서버에 발주 요청 생성
      const requestData = {
        title: orderData.title,
        description: orderData.description,
        amount: orderData.amount,
        resourceType: orderData.resourceType || '캠페인 업무 발주',
        priority: orderData.priority || '보통',
        dueDate: orderData.dueDate,
        campaignId: orderData.linkedCampaignId,
        postId: orderData.linkedPostId
      };

      const response = await api.post('/api/purchase-requests', requestData);
      const newOrder = response.data;

      // 로컬 상태에 추가
      setOrderRequests(prev => [newOrder, ...prev]);
      
      // 발주 관리 페이지 자동 업데이트를 위한 이벤트 발생
      const updateEvent = new CustomEvent('newOrderRequest', {
        detail: { order: newOrder }
      });
      window.dispatchEvent(updateEvent);

      // 알림 생성 이벤트 발생
      const notificationEvent = new CustomEvent('createNotification', {
        detail: {
          type: 'order_request',
          title: '새로운 발주 요청',
          message: `${newOrder.title} - ${newOrder.amount.toLocaleString()}원`,
          relatedData: {
            orderId: newOrder.id,
            campaignId: newOrder.campaignId,
            postId: newOrder.postId
          },
          targetUsers: ['agency_admin'],
          priority: 'normal'
        }
      });
      window.dispatchEvent(notificationEvent);

      showSuccess(`발주 요청이 등록되었습니다!\n\n제목: ${newOrder.title}\n금액: ${newOrder.amount.toLocaleString()}원`);
      
      return newOrder;
      
    } catch (error) {
      console.error('발주 요청 생성 실패:', error);
      showError('발주 요청에 실패했습니다.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 발주 요청 상태 업데이트
  const updateOrderStatus = async (orderId, status, comment = '') => {
    try {
      // 서버에 상태 업데이트 요청
      const updateData = { 
        status,
        approverComment: comment
      };

      const response = await api.put(`/api/purchase-requests/${orderId}`, updateData);
      const updatedOrder = response.data;

      // 로컬 상태 업데이트
      setOrderRequests(prev => 
        prev.map(order => 
          order.id === orderId ? updatedOrder : order
        )
      );

      // 캠페인 상세 페이지 업데이트를 위한 이벤트 발생
      const updateEvent = new CustomEvent('orderStatusUpdate', {
        detail: { orderId, status, comment }
      });
      window.dispatchEvent(updateEvent);

      return true;
    } catch (error) {
      console.error('발주 상태 업데이트 실패:', error);
      showError('발주 상태 업데이트에 실패했습니다.');
      return false;
    }
  };

  // 발주 요청 목록 조회
  const fetchOrderRequests = async (filters = {}) => {
    try {
      setIsLoading(true);
      
      // 서버에서 발주 요청 목록 조회
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      params.append('page', filters.page || 1);
      params.append('limit', filters.limit || 20);

      const response = await api.get(`/api/purchase-requests?${params.toString()}`);
      const orders = response.data.requests || [];
      
      setOrderRequests(orders);
      return orders;
      
    } catch (error) {
      console.error('발주 요청 목록 조회 실패:', error);
      showError('발주 요청 목록을 불러오는데 실패했습니다.');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // 실시간 업데이트를 위한 이벤트 리스너
  useEffect(() => {
    const handleOrderUpdate = (event) => {
      const { orderId, status, comment } = event.detail;
      updateOrderStatus(orderId, status, comment);
    };

    const handleNewOrder = (event) => {
      const { order } = event.detail;
      setOrderRequests(prev => {
        // 중복 방지
        if (prev.find(o => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    };

    window.addEventListener('orderStatusUpdate', handleOrderUpdate);
    window.addEventListener('newOrderRequest', handleNewOrder);

    return () => {
      window.removeEventListener('orderStatusUpdate', handleOrderUpdate);
      window.removeEventListener('newOrderRequest', handleNewOrder);
    };
  }, []);

  const value = {
    orderRequests,
    isLoading,
    createOrderRequest,
    updateOrderStatus,
    fetchOrderRequests,
    setOrderRequests
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;