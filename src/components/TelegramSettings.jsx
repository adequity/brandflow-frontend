// src/components/TelegramSettings.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Send, Clock, Bell, BellOff, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';

const TelegramSettings = ({ loggedInUser }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [telegramSetting, setTelegramSetting] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formData, setFormData] = useState({
    telegram_chat_id: '',
    telegram_username: '',
    is_enabled: true,
    days_before_due: 2,
    notification_time: '09:00'
  });
  const [hasChanges, setHasChanges] = useState(false);

  // 클라이언트를 제외한 모든 역할이 텔레그램 알림 사용 가능
  const canUseTelegram = loggedInUser?.role && loggedInUser.role !== 'CLIENT';

  useEffect(() => {
    if (canUseTelegram) {
      fetchTelegramSetting();
    } else {
      setIsLoading(false);
    }
  }, [loggedInUser, canUseTelegram]);

  const fetchTelegramSetting = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/telegram/my-setting');

      if (response.data) {
        setTelegramSetting(response.data);
        setFormData({
          telegram_chat_id: response.data.telegram_chat_id || '',
          telegram_username: response.data.telegram_username || '',
          is_enabled: response.data.is_enabled ?? true,
          days_before_due: response.data.days_before_due || 2,
          notification_time: response.data.notification_time || '09:00'
        });
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('텔레그램 설정 조회 실패:', error);
        showError('텔레그램 설정을 불러오는데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const saveTelegramSetting = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      let response;

      if (telegramSetting) {
        // 업데이트
        response = await api.put('/api/telegram/my-setting', formData);
      } else {
        // 생성
        response = await api.post('/api/telegram/my-setting', formData);
      }

      setTelegramSetting(response.data);
      setHasChanges(false);
      showSuccess('텔레그램 설정이 저장되었습니다!');
    } catch (error) {
      console.error('텔레그램 설정 저장 실패:', error);
      showError(error.response?.data?.detail || '텔레그램 설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestMessage = async () => {
    if (!telegramSetting) {
      showError('텔레그램 설정을 먼저 저장해 주세요.');
      return;
    }

    setIsTesting(true);
    try {
      const response = await api.post('/api/telegram/test', {
        message: "테스트 메시지입니다."
      });

      if (response.data.success) {
        showSuccess('테스트 메시지가 성공적으로 전송되었습니다!');
      }
    } catch (error) {
      console.error('테스트 메시지 전송 실패:', error);
      showError(error.response?.data?.detail || '테스트 메시지 전송에 실패했습니다.');
    } finally {
      setIsTesting(false);
    }
  };

  const deleteTelegramSetting = async () => {
    if (!telegramSetting) return;

    try {
      await api.delete('/api/telegram/my-setting');
      setTelegramSetting(null);
      setFormData({
        telegram_chat_id: '',
        telegram_username: '',
        is_enabled: true,
        days_before_due: 2,
        notification_time: '09:00'
      });
      setHasChanges(false);
      showSuccess('텔레그램 설정이 삭제되었습니다.');
    } catch (error) {
      console.error('텔레그램 설정 삭제 실패:', error);
      showError('텔레그램 설정 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">텔레그램 설정을 불러오는 중...</div>
      </div>
    );
  }

  if (!canUseTelegram) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">텔레그램 알림 설정</h3>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-yellow-600" size={20} />
            <p className="text-yellow-800 font-medium">직원 권한 필요</p>
          </div>
          <p className="text-yellow-700 mt-1">
            텔레그램 마감일 알림은 직원(cstaff) 역할의 사용자만 사용할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-blue-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">텔레그램 알림 설정</h3>
            <p className="text-gray-600 text-sm">캠페인 마감일 알림을 텔레그램으로 받아보세요</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 text-orange-600 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              변경사항이 있습니다
            </div>
          )}

          <button
            onClick={saveTelegramSetting}
            disabled={isSaving || !hasChanges}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Settings size={16} />
            {isSaving ? '저장 중...' : hasChanges ? '변경사항 저장' : '저장됨'}
          </button>
        </div>
      </div>

      {/* 텔레그램 봇 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <MessageSquare className="text-blue-600" size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-3">📱 텔레그램 봇 설정 가이드</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold mt-0.5">1</div>
                <div>
                  <p className="text-blue-800 text-sm font-medium">텔레그램에서 봇 찾기</p>
                  <p className="text-blue-700 text-xs mt-1">텔레그램 검색창에 <code className="bg-white px-1 rounded">@Brandflowmanager_bot</code> 입력</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold mt-0.5">2</div>
                <div>
                  <p className="text-blue-800 text-sm font-medium">봇과 대화 시작</p>
                  <p className="text-blue-700 text-xs mt-1"><code className="bg-white px-1 rounded">/start</code> 명령어를 입력하세요</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold mt-0.5">3</div>
                <div>
                  <p className="text-blue-800 text-sm font-medium">채팅 ID 확인</p>
                  <p className="text-blue-700 text-xs mt-1">봇이 알려주는 <strong>채팅 ID</strong>를 복사하여 아래에 입력하세요</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold mt-0.5">4</div>
                <div>
                  <p className="text-blue-800 text-sm font-medium">설정 완료</p>
                  <p className="text-blue-700 text-xs mt-1">설정 저장 후 테스트 메시지로 연동을 확인하세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* 채팅 ID 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            텔레그램 채팅 ID *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.telegram_chat_id}
              onChange={(e) => handleInputChange('telegram_chat_id', e.target.value)}
              placeholder="예: 123456789 또는 @username"
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formData.telegram_chat_id && formData.telegram_chat_id.length > 0
                  ? formData.telegram_chat_id.match(/^(-?\d{8,}|@\w+)$/)
                    ? 'border-green-300 bg-green-50'
                    : 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              required
            />
            {formData.telegram_chat_id && formData.telegram_chat_id.length > 0 && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {formData.telegram_chat_id.match(/^(-?\d{8,}|@\w+)$/) ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          <div className="mt-1 space-y-1">
            <p className="text-gray-500 text-xs">
              텔레그램 봇과 대화 시작 후 /start 명령어로 확인할 수 있습니다.
            </p>
            {formData.telegram_chat_id && formData.telegram_chat_id.length > 0 && !formData.telegram_chat_id.match(/^(-?\d{8,}|@\w+)$/) && (
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle size={12} />
                올바른 형식이 아닙니다. 숫자 ID(예: 123456789) 또는 사용자명(예: @username)을 입력하세요.
              </p>
            )}
            {formData.telegram_chat_id && formData.telegram_chat_id.match(/^(-?\d{8,}|@\w+)$/) && (
              <p className="text-green-600 text-xs flex items-center gap-1">
                <CheckCircle size={12} />
                올바른 형식입니다!
              </p>
            )}
          </div>
        </div>

        {/* 사용자명 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            텔레그램 사용자명 (선택)
          </label>
          <input
            type="text"
            value={formData.telegram_username}
            onChange={(e) => handleInputChange('telegram_username', e.target.value)}
            placeholder="예: @myusername"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 알림 활성화 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {formData.is_enabled ? <Bell className="text-green-600" size={20} /> : <BellOff className="text-gray-400" size={20} />}
            <div>
              <p className="font-medium text-gray-900">알림 활성화</p>
              <p className="text-gray-600 text-sm">텔레그램 마감일 알림을 받습니다</p>
            </div>
          </div>
          <button
            onClick={() => handleInputChange('is_enabled', !formData.is_enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.is_enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* 알림 설정 */}
        {formData.is_enabled && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900">알림 설정</h4>

            {/* 마감일 며칠 전 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                마감일 며칠 전 알림
              </label>
              <select
                value={formData.days_before_due}
                onChange={(e) => handleInputChange('days_before_due', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1일 전</option>
                <option value={2}>2일 전</option>
                <option value={3}>3일 전</option>
                <option value={5}>5일 전</option>
                <option value={7}>7일 전</option>
              </select>
            </div>

            {/* 알림 시간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                알림 시간
              </label>
              <input
                type="time"
                value={formData.notification_time}
                onChange={(e) => handleInputChange('notification_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3">
          {telegramSetting && (
            <div className="flex gap-3">
              <button
                onClick={sendTestMessage}
                disabled={isTesting || !formData.is_enabled || hasChanges}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title={hasChanges ? "변경사항을 먼저 저장하세요" : !formData.is_enabled ? "알림이 비활성화되어 있습니다" : ""}
              >
                <Send size={16} />
                {isTesting ? '전송 중...' : '테스트 메시지'}
              </button>

              <button
                onClick={deleteTelegramSetting}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <AlertCircle size={16} />
                설정 삭제
              </button>
            </div>
          )}

          {hasChanges && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-orange-800 text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                설정을 변경했습니다. 상단의 "변경사항 저장" 버튼을 클릭하여 저장하세요.
              </p>
            </div>
          )}
        </div>

        {/* 현재 설정 정보 */}
        {telegramSetting && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-600" size={20} />
              <p className="font-medium text-green-900">텔레그램 알림 설정됨</p>
            </div>
            <div className="text-green-800 text-sm space-y-1">
              <p>• 마감일 {formData.days_before_due}일 전 알림</p>
              <p>• 매일 {formData.notification_time} 발송</p>
              <p>• 상태: {formData.is_enabled ? '활성화' : '비활성화'}</p>
              {telegramSetting.last_notification_at && (
                <p>• 마지막 알림: {new Date(telegramSetting.last_notification_at).toLocaleString('ko-KR')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramSettings;