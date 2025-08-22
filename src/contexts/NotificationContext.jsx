import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/client';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 알림 목록 조회
  const fetchNotifications = useCallback(async (page = 1, unreadOnly = false) => {
    console.log('fetchNotifications 호출됨:', { page, unreadOnly });
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/notifications', {
        params: { page, limit: 20, unreadOnly }
      });
      
      console.log('알림 API 응답:', response.data);
      
      if (page === 1) {
        setNotifications(response.data.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.data.notifications]);
      }
      
      setUnreadCount(response.data.unreadCount);
      return response.data;
    } catch (err) {
      console.error('알림 조회 실패:', err);
      // 404 오류인 경우 (API 미구현) 빈 배열 반환
      if (err.response?.status === 404) {
        setNotifications([]);
        setUnreadCount(0);
        return { notifications: [], unreadCount: 0 };
      }
      setError('알림을 불러오는데 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 미읽음 알림 개수 조회
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      setUnreadCount(response.data.unreadCount);
      return response.data.unreadCount;
    } catch (err) {
      // 404 오류인 경우 (API 미구현) 조용히 처리
      if (err.response?.status === 404) {
        setUnreadCount(0);
        return 0;
      }
      // 다른 에러는 로그 출력
      console.error('미읽음 알림 개수 조회 실패:', err);
      if (err.response?.status === 401) {
        setUnreadCount(0);
      }
      return 0;
    }
  }, []);

  // 알림 읽음 처리
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
      
      // 미읽음 개수 감소
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
      setError('알림 읽음 처리에 실패했습니다.');
      throw err;
    }
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.put('/api/notifications/read-all');
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date() 
        }))
      );
      
      setUnreadCount(0);
      return response.data.updatedCount;
    } catch (err) {
      console.error('모든 알림 읽음 처리 실패:', err);
      setError('모든 알림 읽음 처리에 실패했습니다.');
      throw err;
    }
  }, []);

  // 새 알림 추가 (실시간 업데이트용)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // 알림 타입별 아이콘 및 색상 반환
  const getNotificationStyle = useCallback((type) => {
    const styles = {
      task_created: { 
        icon: '📋', 
        color: 'blue',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800'
      },
      task_approved: { 
        icon: '✅', 
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800'
      },
      task_rejected: { 
        icon: '❌', 
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800'
      },
      outline_submitted: { 
        icon: '📝', 
        color: 'purple',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-800'
      },
      outline_approved: { 
        icon: '✅', 
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800'
      },
      outline_rejected: { 
        icon: '❌', 
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800'
      },
      result_submitted: { 
        icon: '🎯', 
        color: 'orange',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-800'
      },
      campaign_created: { 
        icon: '🚀', 
        color: 'indigo',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-800'
      },
      campaign_assigned: { 
        icon: '👨‍💼', 
        color: 'teal',
        bgColor: 'bg-teal-50',
        textColor: 'text-teal-800'
      }
    };

    return styles[type] || {
      icon: '📢',
      color: 'gray',
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-800'
    };
  }, []);

  // 컴포넌트 마운트 시 미읽음 개수 조회
  useEffect(() => {
    fetchUnreadCount();
    
    // 주기적으로 미읽음 개수 업데이트 (30초마다)
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    getNotificationStyle,
    setError
  }), [
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    getNotificationStyle
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};