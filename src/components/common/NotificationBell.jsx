import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getNotificationStyle
  } = useNotifications();

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 알림 드롭다운 열기
  const handleBellClick = async () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setPage(1);
      setHasMore(true);
      try {
        const result = await fetchNotifications(1);
        setHasMore(result.page < result.totalPages);
      } catch (error) {
        console.error('알림 로딩 실패:', error);
      }
    }
  };

  // 더 많은 알림 로드
  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    const nextPage = page + 1;
    try {
      const result = await fetchNotifications(nextPage);
      setPage(nextPage);
      setHasMore(result.page < result.totalPages);
    } catch (error) {
      console.error('추가 알림 로딩 실패:', error);
    }
  };

  // 알림 클릭 처리
  const handleNotificationClick = async (notification) => {
    // 읽지 않은 알림이면 읽음 처리
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }

    // 관련 페이지로 이동
    if (notification.relatedData?.campaignId) {
      navigate(`/admin/campaigns/${notification.relatedData.campaignId}`);
      setIsOpen(false);
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 상대 시간 포맷
  const formatRelativeTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    
    return notificationDate.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 벨 버튼 */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="알림"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">알림</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  title="모두 읽음"
                >
                  <CheckCheck size={14} />
                  <span>모두 읽음</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-64 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                <span className="mt-2 block">알림을 불러오는 중...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                <span>{error}</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell size={24} className="mx-auto mb-2 text-gray-300" />
                <span>새로운 알림이 없습니다.</span>
              </div>
            ) : (
              <>
                {notifications.map((notification) => {
                  const style = getNotificationStyle(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* 알림 아이콘 */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${style.bgColor} flex items-center justify-center text-sm`}>
                          {style.icon}
                        </div>
                        
                        {/* 알림 내용 */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 더 보기 버튼 */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full p-3 text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {loading ? '로딩 중...' : '더 보기'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* 푸터 */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                navigate('/admin/notifications');
                setIsOpen(false);
              }}
              className="w-full text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              모든 알림 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;