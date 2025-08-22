// src/pages/SystemSettings.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Shield, DollarSign, FileText, ToggleLeft, ToggleRight, Save, RefreshCw, Image } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import LogoUpload from '../components/LogoUpload';
import useLogo from '../hooks/useLogo';

const SystemSettings = ({ loggedInUser }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const { logo, updateLogo } = useLogo();
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [modifiedSettings, setModifiedSettings] = useState({});
  const [initConfirm, setInitConfirm] = useState({ isOpen: false });

  const categories = [
    { id: 'all', label: '전체', icon: <Settings size={16} /> },
    { id: 'branding', label: '브랜딩', icon: <Image size={16} /> },
    { id: 'incentive', label: '인센티브', icon: <DollarSign size={16} /> },
    { id: 'sales', label: '매출', icon: <DollarSign size={16} /> },
    { id: 'document', label: '문서', icon: <FileText size={16} /> },
    { id: 'general', label: '일반', icon: <Settings size={16} /> }
  ];

  const fetchSettings = async () => {
    if (!loggedInUser?.id) return;
    
    setIsLoading(true);
    try {
      // 더미 시스템 설정 데이터
      const dummySettings = [
        {
          id: 1,
          settingKey: 'incentive_calculation_enabled',
          settingValue: 'true',
          settingType: 'boolean',
          defaultValue: 'false',
          category: 'incentive',
          accessLevel: 'super_admin',
          description: '인센티브 자동 계산 기능 활성화 여부',
          modifier: { name: '슈퍼 관리자' },
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          settingKey: 'default_incentive_rate',
          settingValue: '10',
          settingType: 'number',
          defaultValue: '5',
          category: 'incentive',
          accessLevel: 'agency_admin',
          description: '기본 인센티브율 (%)',
          modifier: { name: '대행사 관리자' },
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          settingKey: 'sales_auto_approval_threshold',
          settingValue: '5000000',
          settingType: 'number',
          defaultValue: '1000000',
          category: 'sales',
          accessLevel: 'agency_admin',
          description: '매출 자동 승인 임계값 (원)',
          modifier: { name: '대행사 관리자' },
          updatedAt: new Date().toISOString()
        },
        {
          id: 4,
          settingKey: 'document_retention_days',
          settingValue: '365',
          settingType: 'number',
          defaultValue: '180',
          category: 'document',
          accessLevel: 'super_admin',
          description: '문서 보관 기간 (일)',
          modifier: { name: '슈퍼 관리자' },
          updatedAt: new Date().toISOString()
        },
        {
          id: 5,
          settingKey: 'notification_enabled',
          settingValue: 'true',
          settingType: 'boolean',
          defaultValue: 'true',
          category: 'general',
          accessLevel: 'staff',
          description: '시스템 알림 기능 활성화',
          modifier: { name: '직원1' },
          updatedAt: new Date().toISOString()
        }
      ];
      
      // 카테고리 필터 적용
      let filteredSettings = dummySettings;
      if (selectedCategory !== 'all') {
        filteredSettings = dummySettings.filter(s => s.category === selectedCategory);
      }
      
      setSettings(filteredSettings);
      setModifiedSettings({});
      setHasChanges(false);
    } catch (error) {
      console.error('시스템 설정 로딩 실패:', error);
      setSettings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSettings = async () => {
    if (loggedInUser?.role !== '슈퍼 어드민') {
      showError('초기화는 슈퍼 어드민만 가능합니다.');
      return;
    }

    try {
      // 더미로 초기화 성공 처리
      showSuccess('기본 설정이 초기화되었습니다! (더미 모드)');
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
    if (modifiedSettings.hasOwnProperty(setting.settingKey)) {
      return modifiedSettings[setting.settingKey];
    }
    return setting.settingValue;
  };

  const saveSettings = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      // 더미로 저장 성공 처리
      await new Promise(resolve => setTimeout(resolve, 500)); // 저장 중 효과
      showSuccess('설정이 저장되었습니다! (더미 모드)');
      fetchSettings();
    } catch (error) {
      console.error('설정 저장 실패:', error);
      showError('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSettingInput = (setting) => {
    const currentValue = getDisplayValue(setting);
    
    switch (setting.settingType) {
      case 'boolean':
        const boolValue = String(currentValue).toLowerCase() === 'true';
        return (
          <button
            onClick={() => handleSettingChange(setting.settingKey, !boolValue)}
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
            onChange={(e) => handleSettingChange(setting.settingKey, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            step="0.1"
          />
        );
        
      case 'json':
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.settingKey, e.target.value)}
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
            onChange={(e) => handleSettingChange(setting.settingKey, e.target.value)}
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

  const canManageSettings = ['슈퍼 어드민', '대행사 어드민'].includes(loggedInUser?.role);

  if (!canManageSettings) {
    return (
      <div className="p-6 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <Shield className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">접근 권한 없음</h3>
          <p className="text-yellow-700">시스템 설정 관리는 관리자 권한이 필요합니다.</p>
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
          <p className="text-gray-600 mt-1">업체별 기능 설정을 관리합니다</p>
        </div>
        
        <div className="flex gap-3">
          {loggedInUser?.role === '슈퍼 어드민' && (
            <button
              onClick={confirmInitialize}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw size={20} />
              초기화
            </button>
          )}
          
          {hasChanges && (
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
                      {setting.settingKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    {getAccessLevelBadge(setting.accessLevel)}
                  </div>
                  
                  {setting.description && (
                    <p className="text-gray-600 mb-3">{setting.description}</p>
                  )}
                  
                  <div className="text-sm text-gray-500 mb-4">
                    <span className="font-medium">기본값:</span> {setting.defaultValue || '없음'}
                    {setting.modifier && (
                      <span className="ml-4">
                        <span className="font-medium">마지막 수정:</span> {setting.modifier.name} 
                        ({new Date(setting.updatedAt).toLocaleString('ko-KR')})
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
                
                {modifiedSettings.hasOwnProperty(setting.settingKey) && (
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
          {loggedInUser?.role === '슈퍼 어드민' && (
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