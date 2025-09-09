import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

const CampaignEditModal = ({ campaign, onSave, onClose, currentUser }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_company: '',
    budget: '',
    start_date: '',
    end_date: '',
    status: 'DRAFT'
  });
  const [isLoading, setIsLoading] = useState(false);

  // 숫자에 콤마 추가하는 함수
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const numericValue = value.toString().replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 콤마 제거하고 숫자만 추출하는 함수
  const removeCommas = (value) => {
    return value.toString().replace(/,/g, '');
  };

  // 초기값 설정
  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        client_company: campaign.client_company || '',
        budget: campaign.budget ? formatNumberWithCommas(campaign.budget.toString()) : '',
        start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
        end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
        status: campaign.status || 'DRAFT'
      });
    }
  }, [campaign]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'budget') {
      setFormData(prev => ({
        ...prev,
        [name]: formatNumberWithCommas(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        client_company: formData.client_company || null,
        budget: formData.budget ? parseFloat(removeCommas(formData.budget)) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status
      };

      await api.put(`/api/campaigns/${campaign.id}/`, updateData, {
        params: {
          viewerId: currentUser.id,
          viewerRole: currentUser.role
        }
      });

      showSuccess('캠페인이 성공적으로 수정되었습니다.');
      onSave();
    } catch (error) {
      console.error('캠페인 수정 실패:', error);
      
      // 404 에러 또는 "Not implemented yet" 메시지 처리
      if (error?.response?.status === 404 || 
          error?.response?.data?.detail === 'Not implemented yet' ||
          error?.message?.includes('404')) {
        showError('⚠️ 캠페인 편집 기능은 현재 백엔드에서 개발 중입니다.\n잠시 후 다시 시도해주세요.');
      } else {
        const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.detail || 
                           '캠페인 수정에 실패했습니다.';
        showError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">캠페인 수정 - {campaign?.name}</h3>
        
        {/* 성공 안내 메시지 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-600">✅</span>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                캠페인 수정 기능 활성화
              </h4>
              <p className="text-sm text-green-700 mt-1">
                이제 캠페인의 기본 정보를 수정할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 캠페인명 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              📝 캠페인명 <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              name="name" 
              id="name" 
              value={formData.name} 
              onChange={handleInputChange} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" 
              placeholder="캠페인명을 입력하세요"
              required
            />
          </div>

          {/* 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              📋 캠페인 설명
            </label>
            <textarea 
              name="description" 
              id="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md resize-none" 
              placeholder="캠페인에 대한 설명을 입력하세요..."
            />
          </div>

          {/* 클라이언트 회사 */}
          <div>
            <label htmlFor="client_company" className="block text-sm font-medium text-gray-700">
              🏢 클라이언트 회사
            </label>
            <input 
              type="text" 
              name="client_company" 
              id="client_company" 
              value={formData.client_company} 
              onChange={handleInputChange} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" 
              placeholder="클라이언트 회사명을 입력하세요"
            />
          </div>

          {/* 예산 */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
              💰 예산
            </label>
            <div className="mt-1 relative">
              <input 
                type="text" 
                name="budget" 
                id="budget" 
                value={formData.budget} 
                onChange={handleInputChange} 
                className="block w-full px-3 py-2 border border-gray-300 rounded-md pr-12" 
                placeholder="예: 5,000,000"
                pattern="[0-9,]*"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                원
              </div>
            </div>
          </div>

          {/* 시작일과 종료일 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                📅 시작일
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                📅 종료일
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* 상태 */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              📊 상태
            </label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="DRAFT">초안</option>
              <option value="ACTIVE">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              disabled={isLoading}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {isLoading ? '수정 중...' : '수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignEditModal;