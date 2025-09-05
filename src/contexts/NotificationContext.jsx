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

  // 알림 목록 조회 (백엔드 API 미구현으로 임시 비활성화)
  const fetchNotifications = useCallback(async (page = 1, unreadOnly = false) => {
    console.log('fetchNotifications 호출됨 (API 미구현으로 mock 데이터 반환):', { page, unreadOnly });
    
    // 백엔드에 알림 API가 구현되지 않아 임시로 빈 데이터 반환
    setLoading(true);
    setTimeout(() => {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }, 100);
    
    return { notifications: [], unreadCount: 0 };
  }, []);

  // 미읽음 알림 개수 조회 (백엔드 API 미구현으로 임시 비활성화)
  const fetchUnreadCount = useCallback(async () => {
    // 백엔드에 알림 API가 구현되지 않아 임시로 0 반환
    console.log('fetchUnreadCount 호출됨 (API 미구현으로 0 반환)');
    setUnreadCount(0);
    return 0;
  }, []);

  // 알림 읽음 처리 (백엔드 API 미구현으로 임시 비활성화)
  const markAsRead = useCallback(async (notificationId) => {
    console.log('markAsRead 호출됨 (API 미구현으로 로컬 처리만):', notificationId);
    
    // 백엔드 API가 없으므로 로컬 상태만 업데이트
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
  }, []);

  // 모든 알림 읽음 처리 (백엔드 API 미구현으로 임시 비활성화)
  const markAllAsRead = useCallback(async () => {
    console.log('markAllAsRead 호출됨 (API 미구현으로 로컬 처리만)');
    
    // 백엔드 API가 없으므로 로컬 상태만 업데이트
    setNotifications(prev => 
      prev.map(notification => ({ 
        ...notification, 
        isRead: true, 
        readAt: new Date() 
      }))
    );
    
    setUnreadCount(0);
    return 0; // API 미구현으로 0 반환
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