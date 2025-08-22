// src/components/modals/PurchaseRequestModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

const PurchaseRequestModal = ({ isOpen, onClose, onSuccess, loggedInUser, request = null, initialData = null }) => {
  const { showError } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    resourceType: '비품 구매',
    priority: '보통',
    dueDate: '',
    campaignId: '',
    postId: '',
    status: '승인 대기',
    approverComment: '',
    rejectReason: ''
  });
  const [isUrgentRequest, setIsUrgentRequest] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignPosts, setCampaignPosts] = useState([]);
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

  useEffect(() => {
    if (request) {
      const dueDate = request.dueDate ? new Date(request.dueDate).toISOString().split('T')[0] : '';
      const today = new Date().toISOString().split('T')[0];
      
      setFormData({
        title: request.title || '',
        description: request.description || '',
        amount: request.amount ? formatNumberWithCommas(request.amount.toString()) : '',
        resourceType: request.resourceType || '광고비',
        priority: request.priority || '보통',
        dueDate: dueDate,
        campaignId: request.campaignId || '',
        postId: request.postId || '',
        status: request.status || '승인 대기',
        approverComment: request.approverComment || '',
        rejectReason: request.rejectReason || ''
      });
      
      // 기존 요청의 완료일이 오늘 날짜와 같으면 당일요청으로 설정
      setIsUrgentRequest(dueDate === today);
    } else if (initialData) {
      // 캠페인 상세에서 호출된 경우
      setFormData(prev => ({
        ...prev,
        title: initialData.title || '',
        campaignId: initialData.campaignId || '',
        postId: initialData.postId || ''
      }));
      setIsUrgentRequest(false);
    } else {
      // 새 요청인 경우 초기화
      setIsUrgentRequest(false);
    }
    
    // 캠페인 목록 로드
    fetchCampaigns();
  }, [request, initialData]);

  const fetchCampaigns = async () => {
    try {
      const { data } = await api.get('/api/campaigns', {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      setCampaigns(data || []);
    } catch (error) {
      console.error('캠페인 목록 로딩 실패:', error);
    }
  };

  const fetchCampaignCosts = async (campaignId) => {
    if (!campaignId) return 0;
    
    try {
      const { data } = await api.get(`/api/campaigns/${campaignId}/financial-summary`, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      
      // 캠페인의 총 원가를 계산
      const totalCost = data.totalCost || 0;
      console.log(`캠페인 ${campaignId}의 원가:`, totalCost);
      return totalCost;
    } catch (error) {
      console.error('캠페인 원가 조회 실패:', error);
      return 0;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(removeCommas(formData.amount)),
        campaignId: formData.campaignId || null,
        postId: formData.postId || null,
        dueDate: formData.dueDate || null
      };

      if (request) {
        await api.put(`/api/purchase-requests/${request.id}`, submitData, {
          params: {
            viewerId: loggedInUser.id,
            viewerRole: loggedInUser.role
          }
        });
      } else {
        await api.post('/api/purchase-requests', submitData, {
          params: {
            viewerId: loggedInUser.id,
            viewerRole: loggedInUser.role
          }
        });
      }

      onSuccess();
    } catch (error) {
      console.error('구매요청 저장 실패:', error);
      showError('저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // 금액 필드인 경우 콤마 처리
    if (name === 'amount') {
      const numericValue = removeCommas(value);
      const formattedValue = formatNumberWithCommas(numericValue);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // 캠페인이 선택되면 자동으로 원가 계산
    if (name === 'campaignId' && value) {
      const campaignCost = await fetchCampaignCosts(value);
      if (campaignCost > 0) {
        const formattedCost = formatNumberWithCommas(campaignCost.toString());
        setFormData(prev => ({ ...prev, amount: formattedCost }));
      }
    } else if (name === 'campaignId' && !value) {
      // 캠페인 선택 해제 시 금액 초기화
      setFormData(prev => ({ ...prev, amount: '' }));
    }
  };

  const handleUrgentRequestChange = (e) => {
    const isChecked = e.target.checked;
    setIsUrgentRequest(isChecked);
    
    if (isChecked) {
      // 당일요청 체크 시 오늘 날짜로 설정
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, dueDate: today }));
    } else {
      // 당일요청 해제 시 날짜 초기화
      setFormData(prev => ({ ...prev, dueDate: '' }));
    }
  };

  const isAdminRole = loggedInUser?.role === '대행사 어드민' || loggedInUser?.role === '슈퍼 어드민';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-6">
          {request ? '구매요청 수정' : '새 구매요청 작성'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="구매요청 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">리소스 종류 *</label>
              <select
                name="resourceType"
                value={formData.resourceType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="비품 구매">비품 구매</option>
                <option value="사무용품">사무용품</option>
                <option value="컴퓨터/주변기기">컴퓨터/주변기기</option>
                <option value="소프트웨어">소프트웨어</option>
                <option value="사무기기">사무기기</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">긴급도</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="낮음">낮음</option>
                <option value="보통">보통</option>
                <option value="높음">높음</option>
                <option value="긴급">긴급</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">금액 (원) *</label>
              <input
                type="text"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                pattern="[0-9,]*"
                required
              />
              <p className="text-xs text-blue-600 mt-1">
                💡 연관 캠페인 선택 시 해당 캠페인의 업무 원가가 자동으로 설정됩니다
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">희망 완료일</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                disabled={isUrgentRequest}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                  isUrgentRequest ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              <div className="mt-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={isUrgentRequest}
                    onChange={handleUrgentRequestChange}
                    className="form-checkbox h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-red-600 font-medium">🚨 당일 요청</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  당일 요청 시 오늘 날짜로 자동 설정됩니다
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연관 캠페인</label>
              <select
                name="campaignId"
                value={formData.campaignId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">선택하지 않음</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                캠페인 선택 시 해당 캠페인의 업무 원가 총합이 금액에 자동 반영됩니다
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="구매요청에 대한 상세한 설명을 입력하세요"
              />
            </div>
          </div>

          {/* 관리자 전용 필드 */}
          {isAdminRole && request && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">관리자 승인/거절</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="승인 대기">승인 대기</option>
                    <option value="검토 중">검토 중</option>
                    <option value="승인됨">승인됨</option>
                    <option value="거절됨">거절됨</option>
                    <option value="보류">보류</option>
                    <option value="구매 완료">구매 완료</option>
                    <option value="정산 완료">정산 완료</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">승인자 코멘트</label>
                  <textarea
                    name="approverComment"
                    value={formData.approverComment}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="승인 또는 거절에 대한 코멘트를 입력하세요"
                  />
                </div>

                {formData.status === '거절됨' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">거절 사유 *</label>
                    <textarea
                      name="rejectReason"
                      value={formData.rejectReason}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                      placeholder="거절 사유를 상세히 입력하세요"
                      required={formData.status === '거절됨'}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? '저장 중...' : (request ? '수정' : '작성')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseRequestModal;