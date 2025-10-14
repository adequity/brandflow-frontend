// src/pages/SystemSettings.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Shield, DollarSign, FileText, ToggleLeft, ToggleRight, Save, RefreshCw, Image, List } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import LogoUpload from '../components/LogoUpload';
import TelegramSettings from '../components/TelegramSettings';
import DocumentTemplateBuilder from '../components/DocumentTemplateBuilder';
import CompanyInfoSection from '../components/CompanyInfoSection';
import useLogo from '../hooks/useLogo';

const SystemSettings = ({ loggedInUser }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const { logo, updateLogo } = useLogo();
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // STAFF는 기본적으로 '내 회사 정보' 탭 표시, 나머지는 '전체'
  const [selectedCategory, setSelectedCategory] = useState(
    loggedInUser?.role === 'STAFF' ? 'company' : 'all'
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [modifiedSettings, setModifiedSettings] = useState({});
  const [initConfirm, setInitConfirm] = useState({ isOpen: false });

  // STAFF 권한에 따른 카테고리 필터링
  const isStaff = loggedInUser?.role === 'STAFF';
  const allCategories = [
    { id: 'all', label: '전체', icon: <Settings size={16} />, staffAllowed: false },
    { id: 'company', label: '내 회사 정보', icon: <Shield size={16} />, staffAllowed: true },
    { id: 'branding', label: '브랜딩', icon: <Image size={16} />, staffAllowed: false },
    { id: 'document', label: '문서 템플릿', icon: <FileText size={16} />, staffAllowed: false },
    { id: 'telegram', label: '텔레그램 알림', icon: <Settings size={16} />, staffAllowed: true },
    // 사용하지 않는 탭들 (임시 주석처리)
    // { id: 'incentive', label: '인센티브', icon: <DollarSign size={16} /> },
    // { id: 'sales', label: '매출', icon: <DollarSign size={16} /> },
    // { id: 'general', label: '일반', icon: <Settings size={16} /> }
  ];

  // STAFF는 허용된 카테고리만 표시
  const categories = isStaff
    ? allCategories.filter(cat => cat.staffAllowed)
    : allCategories;

  console.log('[SystemSettings] isStaff:', isStaff, 'categories:', categories.map(c => c.id));

  const fetchSettings = async () => {
    if (!loggedInUser?.id) return;

    // company와 telegram은 시스템 설정이 아니므로 API 호출 불필요
    if (selectedCategory === 'company' || selectedCategory === 'telegram') {
      setIsLoading(false);
      setSettings([]);
      return;
    }

    setIsLoading(true);
    try {
      // API에서 시스템 설정 데이터 로드
      const params = new URLSearchParams({
        page: '1',
        size: '100'
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await api.get(`/api/admin/system-settings/?${params.toString()}`);
      const settingsData = response.data.settings || [];

      setSettings(settingsData);
      setModifiedSettings({});
      setHasChanges(false);
    } catch (error) {
      console.error('시스템 설정 로딩 실패:', error);
      if (error.response?.status === 404) {
        // 시스템 설정 API가 아직 없는 경우
        setSettings([]);
      } else {
        showError('시스템 설정을 불러오는데 실패했습니다.');
        setSettings([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSettings = async () => {
    if (loggedInUser?.role !== 'SUPER_ADMIN') {
      showError('초기화는 슈퍼 어드민만 가능합니다.');
      return;
    }

    try {
      // 초기화 성공 처리
      showSuccess('기본 설정이 초기화되었습니다!');
      fetchSettings();
    } catch (error) {
      console.error('설정 초기화 실패:', error);
      showError('설정 초기화에 실패했습니다.');
    }
  };

  const confirmInitialize = () => {
    setInitConfirm({ isOpen: true });
  };

  useEffect(() => {
    fetchSettings();
  }, [loggedInUser, selectedCategory]);

  const handleSettingChange = (settingKey, newValue) => {
    setModifiedSettings(prev => ({
      ...prev,
      [settingKey]: newValue
    }));
    setHasChanges(true);
  };

  const getDisplayValue = (setting) => {
    if (modifiedSettings.hasOwnProperty(setting.setting_key)) {
      return modifiedSettings[setting.setting_key];
    }
    return setting.current_value || setting.default_value;
  };

  const saveSettings = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      // 벌크 업데이트 API 호출
      const response = await api.post('/api/admin/system-settings/bulk-update', {
        settings: modifiedSettings
      });

      if (response.data.success) {
        showSuccess(`${response.data.total_updated}개 설정이 저장되었습니다!`);

        if (response.data.errors?.length > 0) {
          showWarning(`${response.data.total_errors}개 설정 저장 중 오류가 발생했습니다.`);
          console.error('설정 저장 오류:', response.data.errors);
        }

        fetchSettings();
      } else {
        throw new Error('설정 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      showError(error.response?.data?.detail || '설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingInput = (setting) => {
    const currentValue = getDisplayValue(setting);
    
    switch (setting.setting_type) {
      case 'boolean':
        const boolValue = String(currentValue).toLowerCase() === 'true';
        return (
          <button
            onClick={() => handleSettingChange(setting.setting_key, !boolValue)}
            className={`flex items-center p-2 rounded-lg transition-colors ${
              boolValue
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {boolValue ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span className="ml-2 font-medium">
              {boolValue ? '활성화' : '비활성화'}
            </span>
          </button>
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            step="0.1"
          />
        );

      case 'json':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="JSON 형식으로 입력..."
          />
        );

      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
    }
  };

  const getAccessLevelBadge = (accessLevel) => {
    const config = {
      'super_admin': { bg: 'bg-red-100', text: 'text-red-800', label: '슈퍼 어드민' },
      'agency_admin': { bg: 'bg-blue-100', text: 'text-blue-800', label: '대행사 어드민' },
      'staff': { bg: 'bg-green-100', text: 'text-green-800', label: '직원' }
    };

    const style = config[accessLevel] || config['super_admin'];
    return (
      <span className={`px-2 py-1 ${style.bg} ${style.text} rounded-full text-xs flex items-center`}>
        <Shield size={12} className="mr-1" />
        {style.label}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'branding': <Image size={16} />,
      'incentive': <DollarSign size={16} />,
      'sales': <DollarSign size={16} />,
      'document': <FileText size={16} />,
      'general': <Settings size={16} />
    };
    return iconMap[category] || <Settings size={16} />;
  };

  // 관리자 권한 체크 (STAFF는 읽기 전용 접근 허용)
  const canManageSettings = ['SUPER_ADMIN', 'AGENCY_ADMIN'].includes(loggedInUser?.role);
  const canViewSettings = ['SUPER_ADMIN', 'AGENCY_ADMIN', 'STAFF'].includes(loggedInUser?.role);

  if (!canViewSettings) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <Shield className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">접근 권한 없음</h3>
          <p className="text-yellow-700">시스템 설정은 직원 이상의 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center">시스템 설정을 불러오는 중...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">시스템 설정</h1>
          <p className="text-gray-600 mt-1">
            {isStaff ? '회사 정보 및 알림 설정을 확인할 수 있습니다' : '업체별 기능 설정을 관리합니다'}
          </p>
        </div>

        <div className="flex gap-3">
          {loggedInUser?.role === 'SUPER_ADMIN' && (
            <button
              onClick={confirmInitialize}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw size={20} />
              초기화
            </button>
          )}

          {hasChanges && canManageSettings && (
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? '저장 중...' : '변경사항 저장'}
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.icon}
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* 내 회사 정보 섹션 */}
      {(selectedCategory === 'all' || selectedCategory === 'company') && (
        <div className="mb-6">
          <CompanyInfoSection user={loggedInUser} />
        </div>
      )}

      {/* 브랜딩 섹션 */}
      {(selectedCategory === 'all' || selectedCategory === 'branding') && (
        <div className="mb-6">
          <LogoUpload
            currentLogo={logo}
            onLogoUpdate={(newLogo) => {
              updateLogo(newLogo);
              showSuccess(newLogo ? '로고가 업데이트되었습니다!' : '로고가 제거되었습니다!');
            }}
          />
        </div>
      )}

      {/* 문서 템플릿 섹션 */}
      {(selectedCategory === 'all' || selectedCategory === 'document') && (
        <div className="mb-6">
          <DocumentTemplateBuilder
            onSave={(template) => {
              showSuccess('문서 템플릿이 저장되었습니다!');
            }}
          />
        </div>
      )}

      {/* 텔레그램 알림 섹션 */}
      {(selectedCategory === 'all' || selectedCategory === 'telegram') && (
        <div className="mb-6">
          <TelegramSettings loggedInUser={loggedInUser} />
        </div>
      )}


      {/* 설정 목록 */}
      <div className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getCategoryIcon(setting.category)}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {setting.display_name}
                    </h3>
                    {getAccessLevelBadge(setting.access_level)}
                  </div>
                  
                  {setting.description && (
                    <p className="text-gray-600 mb-3">{setting.description}</p>
                  )}
                  
                  <div className="text-sm text-gray-500 mb-4">
                    <span className="font-medium">기본값:</span> {setting.default_value || '없음'}
                    {setting.modifier && (
                      <span className="ml-4">
                        <span className="font-medium">마지막 수정:</span> {setting.modifier.name}
                        ({new Date(setting.updated_at).toLocaleString('ko-KR')})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 설정값
                  </label>
                  {renderSettingInput(setting)}
                </div>
                
                {modifiedSettings.hasOwnProperty(setting.setting_key) && (
                  <div className="text-sm text-orange-600 font-medium">
                    변경됨
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {settings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {selectedCategory === 'all' ? '등록된 시스템 설정이 없습니다.' : `${categories.find(c => c.id === selectedCategory)?.label} 카테고리에 설정이 없습니다.`}
          {loggedInUser?.role === 'SUPER_ADMIN' && (
            <div className="mt-4">
              <button
                onClick={confirmInitialize}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                기본 설정 초기화하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 초기화 확인 모달 */}
      <ConfirmModal
        isOpen={initConfirm.isOpen}
        onClose={() => setInitConfirm({ isOpen: false })}
        onConfirm={() => {
          initializeSettings();
          setInitConfirm({ isOpen: false });
        }}
        title="시스템 설정 초기화"
        message="모든 설정을 기본값으로 초기화합니다. 이 작업은 취소할 수 없습니다."
        type="error"
        confirmText="초기화"
        cancelText="취소"
      />
    </div>
  );
};

export default SystemSettings;