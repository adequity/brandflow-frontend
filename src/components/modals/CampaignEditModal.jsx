import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

const CampaignEditModal = ({ campaign, onSave, onClose, currentUser }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    budget: '',
    notes: '',
    reminders: '',
    invoiceIssued: false,
    paymentCompleted: false,
    invoiceDueDate: '',
    paymentDueDate: ''
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
        budget: campaign.budget ? formatNumberWithCommas(campaign.budget.toString()) : '',
        notes: campaign.notes || '',
        reminders: campaign.reminders || '',
        invoiceIssued: campaign.invoiceIssued || false,
        paymentCompleted: campaign.paymentCompleted || false,
        invoiceDueDate: campaign.invoiceDueDate ? campaign.invoiceDueDate.split('T')[0] : '',
        paymentDueDate: campaign.paymentDueDate ? campaign.paymentDueDate.split('T')[0] : ''
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
        budget: formData.budget ? parseFloat(removeCommas(formData.budget)) : null,
        notes: formData.notes || null,
        reminders: formData.reminders || null,
        invoiceIssued: formData.invoiceIssued,
        paymentCompleted: formData.paymentCompleted,
        invoiceDueDate: formData.invoiceDueDate || null,
        paymentDueDate: formData.paymentDueDate || null
      };

      await api.patch(`/api/campaigns/${campaign.id}/`, updateData, {
        params: {
          viewerId: currentUser.id,
          viewerRole: currentUser.role
        }
      });

      showSuccess('캠페인이 성공적으로 수정되었습니다.');
      onSave();
    } catch (error) {
      console.error('캠페인 수정 실패:', error);
      showError(error?.response?.data?.message || '캠페인 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <h3 className="text-xl font-bold mb-6">캠페인 수정 - {campaign?.name}</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 캠페인 매출 */}
          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
              💰 캠페인 매출 (선택사항)
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
            <p className="mt-1 text-xs text-gray-500">캠페인 계약 매출을 입력하세요. (숫자만)</p>
          </div>

          {/* 주의사항 및 특이사항 */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              ⚠️ 주의사항 및 특이사항
            </label>
            <textarea 
              name="notes" 
              id="notes" 
              value={formData.notes} 
              onChange={handleInputChange} 
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md resize-none" 
              placeholder="클라이언트 요구사항, 주의할 점, 특별 지침 등을 입력하세요..."
            />
            <p className="mt-1 text-xs text-gray-500">담당자가 꼭 알아야 할 중요 사항을 기록하세요.</p>
          </div>

          {/* 리마인드 사항 */}
          <div>
            <label htmlFor="reminders" className="block text-sm font-medium text-gray-700">
              🔔 리마인드 사항
            </label>
            <textarea 
              name="reminders" 
              id="reminders" 
              value={formData.reminders} 
              onChange={handleInputChange} 
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md resize-none" 
              placeholder="정기 체크 포인트, 마감일, 보고 일정 등을 입력하세요..."
            />
            <p className="mt-1 text-xs text-gray-500">진행 중 놓치면 안 될 일정이나 체크사항을 기록하세요.</p>
          </div>

          {/* 재무 관리 필드들 */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="invoiceIssued"
                  name="invoiceIssued"
                  checked={formData.invoiceIssued}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="invoiceIssued" className="ml-2 block text-sm text-gray-900">
                  📄 계산서 발행 완료
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="paymentCompleted"
                  name="paymentCompleted"
                  checked={formData.paymentCompleted}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="paymentCompleted" className="ml-2 block text-sm text-gray-900">
                  💰 입금 완료
                </label>
              </div>
            </div>
            
            {/* 예정일 입력 필드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="invoiceDueDate" className="block text-sm font-medium text-gray-700">
                  📅 계산서 발행 예정일
                </label>
                <input
                  type="date"
                  id="invoiceDueDate"
                  name="invoiceDueDate"
                  value={formData.invoiceDueDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="paymentDueDate" className="block text-sm font-medium text-gray-700">
                  💸 입금 예정일
                </label>
                <input
                  type="date"
                  id="paymentDueDate"
                  name="paymentDueDate"
                  value={formData.paymentDueDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
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