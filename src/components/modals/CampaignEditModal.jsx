import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { formatNumberWithCommas, removeCommas } from '../../utils/dataUtils';
import { canEditCampaign } from '../../utils/permissions';
import { Copy } from 'lucide-react';


const CampaignEditModal = ({ campaign, onSave, onClose, currentUser, onDuplicate }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_company: '',
    budget: '',
    start_date: '',
    end_date: '',
    status: '초안',
    invoice_issued: false,
    payment_completed: false,
    UserId: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [clientMembers, setClientMembers] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);


  // 직원 목록 불러오기 (담당자 정보 표시용)
  const fetchStaffMembers = async () => {
    if (!currentUser?.id) return;
    
    setLoadingStaff(true);
    try {
      const response = await api.get('/api/campaigns/staff-list', {
        params: {
          viewerId: currentUser.id,
          viewerRole: currentUser.role
        }
      });
      setStaffMembers(response.data);
      console.log('[STAFF-MEMBERS] Loaded staff members:', response.data);
    } catch (error) {
      console.error('직원 목록 불러오기 실패:', error);
      setStaffMembers([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  // 클라이언트 목록 불러오기 - 해당 캠페인의 클라이언트와 같은 회사 클라이언트들
  const fetchClientMembers = async () => {
    if (!campaign?.id) return;
    
    setLoadingClients(true);
    try {
      const response = await api.get('/api/campaigns/client-list', {
        params: {
          campaign_id: campaign.id
        }
      });
      setClientMembers(response.data);
      console.log('[CLIENT-MEMBERS] Loaded client members for campaign:', campaign.id, response.data);
    } catch (error) {
      console.error('클라이언트 목록 불러오기 실패:', error);
      setClientMembers([]);
    } finally {
      setLoadingClients(false);
    }
  };

  // 초기값 설정
  useEffect(() => {
    if (campaign) {
      // Helper function to format date - ONLY use actual data, no defaults
      const formatDateForEdit = (dateValue) => {
        if (!dateValue || dateValue === 'null' || dateValue === null) {
          return '';
        }

        try {
          // Handle both string and Date object formats
          const dateStr = dateValue instanceof Date ? dateValue.toISOString() : dateValue.toString();
          const formattedDate = dateStr.split('T')[0];
          return formattedDate;
        } catch (error) {
          console.warn('Date parsing error:', error);
          return '';
        }
      };

      // STAFF와 TEAM_LEADER는 담당자가 없으면 본인 ID를 기본값으로 설정
      const defaultStaffId = (currentUser.role === 'STAFF' || currentUser.role === 'TEAM_LEADER') && !campaign.staff_id
        ? currentUser.id
        : (campaign.staff_id || '');

      const formattedData = {
        name: campaign.name || '',
        description: campaign.description || '',
        client_company: campaign.client_company || '',
        budget: campaign.budget ? formatNumberWithCommas(campaign.budget.toString()) : '',
        start_date: formatDateForEdit(campaign.start_date),
        end_date: formatDateForEdit(campaign.end_date),
        status: campaign.status || '초안',
        invoice_issued: campaign.invoice_issued || false,
        payment_completed: campaign.payment_completed || false,
        UserId: defaultStaffId
      };
      setFormData(formattedData);
    }
  }, [campaign]);

  // 직원 목록과 클라이언트 목록 불러오기
  useEffect(() => {
    // AGENCY_ADMIN과 SUPER_ADMIN만 직원 목록 조회 (담당자 변경 가능)
    // STAFF와 TEAM_LEADER는 본인 ID로 고정되므로 조회 불필요
    if (currentUser?.role === 'AGENCY_ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
      fetchStaffMembers();
    }
    fetchClientMembers();
  }, [currentUser]);

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
    
    // 권한 재검증
    if (!canEditCampaign(currentUser, campaign)) {
      showError('이 캠페인을 수정할 권한이 없습니다.');
      return;
    }
    
    setIsLoading(true);

    try {
      // 날짜를 ISO datetime 형식으로 변환하는 함수
      const formatDateToISO = (dateStr) => {
        if (!dateStr) return null;
        // date input에서 받은 'YYYY-MM-DD' 형식을 'YYYY-MM-DDTHH:mm:ss' 형식으로 변환
        return dateStr + 'T00:00:00';
      };

      const updateData = {
        name: formData.name,
        description: formData.description || null,
        client_company: formData.client_company || null,
        budget: formData.budget ? parseFloat(removeCommas(formData.budget)) : null,
        start_date: formatDateToISO(formData.start_date),
        end_date: formatDateToISO(formData.end_date),
        status: formData.status || '초안',
        invoice_issued: formData.invoice_issued,
        payment_completed: formData.payment_completed,
        staff_id: formData.UserId ? parseInt(formData.UserId) : null
      };

      console.log('[CAMPAIGN-EDIT-MODAL] 전송할 데이터:', {
        campaign_id: campaign.id,
        formData_UserId: formData.UserId,
        formData_UserId_type: typeof formData.UserId,
        calculated_staff_id: updateData.staff_id,
        calculated_staff_id_type: typeof updateData.staff_id,
        전체_updateData: updateData
      });

      await api.put(`/api/campaigns/${campaign.id}`, updateData, {
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

          {/* 클라이언트 회사 드롭다운 */}
          <div>
            <label htmlFor="client_company" className="block text-sm font-medium text-gray-700">
              🏢 클라이언트 회사
            </label>
            {loadingClients ? (
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                클라이언트 목록 불러오는 중...
              </div>
            ) : (
              <select
                name="client_company"
                id="client_company"
                value={formData.client_company}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">클라이언트를 선택하세요</option>
                {clientMembers.map((client) => (
                  <option key={client.id} value={`${client.name} (ID: ${client.id})`}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            )}
            {clientMembers.length === 0 && !loadingClients && (
              <p className="mt-1 text-xs text-gray-500">
                같은 회사의 클라이언트가 없습니다.
              </p>
            )}
          </div>

          {/* 담당 직원 선택 */}
          <div>
            <label htmlFor="UserId" className="block text-sm font-medium text-gray-700">
              👤 담당 직원
            </label>
            {loadingStaff ? (
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                직원 목록 불러오는 중...
              </div>
            ) : currentUser.role === 'AGENCY_ADMIN' || currentUser.role === 'SUPER_ADMIN' ? (
              <select
                name="UserId"
                id="UserId"
                value={formData.UserId}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">담당 직원을 선택하세요</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-gray-700">
                {formData.UserId && parseInt(formData.UserId) === currentUser.id ?
                  `${currentUser.name} (담당자)` :
                  '담당자 정보 없음'
                } (수정 권한 없음)
              </div>
            )}
            {staffMembers.length === 0 && !loadingStaff && (
              <p className="mt-1 text-xs text-gray-500">
                같은 회사의 직원이 없습니다.
              </p>
            )}
            {currentUser.role === 'STAFF' && (
              <p className="mt-1 text-xs text-blue-600">💡 직원 계정은 담당자 변경 권한이 없습니다.</p>
            )}
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

          {/* 캠페인 상태 */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              📊 캠페인 상태
            </label>
            <select
              name="status"
              id="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="초안">초안</option>
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
              <option value="취소">취소</option>
            </select>
          </div>

          {/* 재무 상태 */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">💰 재무 상태</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="invoice_issued"
                  name="invoice_issued"
                  checked={formData.invoice_issued}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="invoice_issued" className="ml-2 text-sm text-gray-700">
                  📄 계산서 발행 완료
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="payment_completed"
                  name="payment_completed"
                  checked={formData.payment_completed}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="payment_completed" className="ml-2 text-sm text-gray-700">
                  💳 입금 완료
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            {/* 왼쪽: 복사 버튼 */}
            <button
              type="button"
              onClick={() => {
                if (onDuplicate) {
                  onDuplicate(campaign);
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
              title="이 캠페인을 복사합니다"
            >
              <Copy size={16} />
              복사
            </button>

            {/* 오른쪽: 취소/수정 버튼 */}
            <div className="flex space-x-3">
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignEditModal;