// src/components/modals/EnhancedPurchaseRequestModal.jsx - 발주 연동 구매요청 모달
import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign, Calendar, Package, FileText } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

const EnhancedPurchaseRequestModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  loggedInUser, 
  request = null, 
  initialData = null,
  linkedSale = null, // 매출 연동 시 사용
  mode = 'create' // 'create', 'edit', 'order_request'
}) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    resourceType: '광고비',
    priority: '보통',
    dueDate: '',
    campaignId: '',
    postId: '',
    status: '승인 대기',
    approverComment: '',
    rejectReason: '',
    // 발주요청 관련 추가 필드
    isOrderRequest: mode === 'order_request',
    linkedSaleId: linkedSale?.id || '',
    agencyAdminId: '', // 발주요청 시 대상 대행사 어드민
    orderType: '매출 연동 발주' // 발주 유형
  });

  const [isUrgentRequest, setIsUrgentRequest] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignPosts, setCampaignPosts] = useState([]);
  const [agencyAdmins, setAgencyAdmins] = useState([]); // 발주요청 시 사용
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  // 숫자 포맷팅 함수들
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const numericValue = value.toString().replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const removeCommas = (value) => {
    return value.toString().replace(/,/g, '');
  };

  // 초기 데이터 설정
  useEffect(() => {
    if (request) {
      const dueDate = request.dueDate ? new Date(request.dueDate).toISOString().split('T')[0] : '';
      
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
        rejectReason: request.rejectReason || '',
        isOrderRequest: request.isOrderRequest || false,
        linkedSaleId: request.linkedSaleId || '',
        agencyAdminId: request.agencyAdminId || '',
        orderType: request.orderType || '일반 구매요청'
      });

      const today = new Date().toISOString().split('T')[0];
      setIsUrgentRequest(dueDate === today);
    } else if (linkedSale) {
      // 매출 연동 시 초기값 설정
      const costAmount = (linkedSale.actualCostPrice || 0) * (linkedSale.quantity || 1);
      setFormData(prev => ({
        ...prev,
        title: `매출 연동 발주 - ${linkedSale.projectName || linkedSale.saleNumber}`,
        description: `매출번호: ${linkedSale.saleNumber}\n프로젝트: ${linkedSale.projectName}\n클라이언트: ${linkedSale.clientName}\n담당자: ${linkedSale.assignedEmployee?.name}\n\n원가 기준 발주요청입니다.`,
        amount: formatNumberWithCommas(costAmount.toString()),
        resourceType: '매출 연동 발주',
        linkedSaleId: linkedSale.id,
        isOrderRequest: true,
        orderType: '매출 연동 발주'
      }));
      setCalculatedAmount(costAmount);
    } else if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        amount: initialData.amount ? formatNumberWithCommas(initialData.amount.toString()) : ''
      }));
    }
  }, [request, linkedSale, initialData]);

  // 캠페인 목록 조회
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

  // 대행사 어드민 목록 조회 (발주요청용)
  const fetchAgencyAdmins = async () => {
    if (mode !== 'order_request') return;
    
    try {
      const { data } = await api.get('/api/users/agency-admins', {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role,
          company: loggedInUser.company // 같은 회사의 대행사 어드민만
        }
      });
      setAgencyAdmins(data || []);
      
      // 기본값으로 첫 번째 대행사 어드민 선택
      if (data.length > 0 && !formData.agencyAdminId) {
        setFormData(prev => ({ ...prev, agencyAdminId: data[0].id }));
      }
    } catch (error) {
      console.error('대행사 어드민 목록 로딩 실패:', error);
    }
  };

  // 캠페인 포스트 조회
  const fetchCampaignPosts = async (campaignId) => {
    if (!campaignId) {
      setCampaignPosts([]);
      return;
    }

    try {
      const { data } = await api.get(`/api/campaigns/${campaignId}/posts`, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      setCampaignPosts(data || []);
    } catch (error) {
      console.error('캠페인 포스트 로딩 실패:', error);
      setCampaignPosts([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCampaigns();
      fetchAgencyAdmins();
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (formData.campaignId) {
      fetchCampaignPosts(formData.campaignId);
    }
  }, [formData.campaignId]);

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(removeCommas(formData.amount)),
        dueDate: formData.dueDate || null,
        campaignId: formData.campaignId || null,
        postId: formData.postId || null,
        isUrgent: isUrgentRequest,
        requesterId: loggedInUser.id,
        requesterName: loggedInUser.name,
        requesterEmail: loggedInUser.email
      };

      let endpoint = '/api/purchase-requests';
      let method = 'post';

      if (mode === 'order_request') {
        // 발주요청 생성
        endpoint = '/api/order-requests';
        submitData.status = '발주 대기';
      } else if (request) {
        // 기존 요청 수정
        endpoint = `/api/purchase-requests/${request.id}`;
        method = 'put';
      }

      const response = await api[method](endpoint, submitData, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });

      if (mode === 'order_request') {
        showSuccess('발주요청이 대행사 관리자에게 전송되었습니다!');
      } else {
        showSuccess(request ? '요청이 수정되었습니다!' : '요청이 등록되었습니다!');
      }

      if (onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    } catch (error) {
      console.error('요청 처리 실패:', error);
      showError(error.response?.data?.message || '요청 처리에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = mode === 'order_request' ? '발주요청' : request ? '구매요청 수정' : '새 구매요청';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center">
            {mode === 'order_request' ? <Package className="mr-2" /> : <FileText className="mr-2" />}
            {modalTitle}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* 발주요청 안내 */}
        {mode === 'order_request' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="text-blue-600 mr-2 mt-0.5" size={16} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">발주요청 안내</p>
                <p>이 요청은 대행사 관리자의 승인 후 본사 지출에 자동으로 반영됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* 연동된 매출 정보 표시 */}
        {linkedSale && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-2 flex items-center">
              <DollarSign className="mr-2" size={16} />
              연동된 매출 정보
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">매출번호:</span> {linkedSale.saleNumber}</div>
              <div><span className="font-medium">프로젝트:</span> {linkedSale.projectName}</div>
              <div><span className="font-medium">클라이언트:</span> {linkedSale.clientName}</div>
              <div><span className="font-medium">담당자:</span> {linkedSale.assignedEmployee?.name}</div>
              <div><span className="font-medium">원가:</span> {(linkedSale.actualCostPrice * linkedSale.quantity).toLocaleString()}원</div>
              <div><span className="font-medium">수량:</span> {linkedSale.quantity}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 기본 정보 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
              placeholder="요청 제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={4}
              required
              placeholder="요청 내용을 자세히 작성해주세요"
            />
          </div>

          {/* 금액 및 유형 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                금액 * {calculatedAmount > 0 && <span className="text-blue-600">(자동 계산됨)</span>}
              </label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: formatNumberWithCommas(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
                placeholder="0"
                disabled={calculatedAmount > 0} // 자동 계산된 경우 수정 불가
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">리소스 유형</label>
              <select
                value={formData.resourceType}
                onChange={(e) => setFormData(prev => ({ ...prev, resourceType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {mode === 'order_request' ? (
                  <>
                    <option value="매출 연동 발주">매출 연동 발주</option>
                    <option value="광고비">광고비</option>
                    <option value="콘텐츠 제작비">콘텐츠 제작비</option>
                    <option value="기타">기타</option>
                  </>
                ) : (
                  <>
                    <option value="광고비">광고비</option>
                    <option value="콘텐츠 제작비">콘텐츠 제작비</option>
                    <option value="도구 구독료">도구 구독료</option>
                    <option value="외부 용역비">외부 용역비</option>
                    <option value="소재 구매비">소재 구매비</option>
                    <option value="기타">기타</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* 우선순위 및 완료일 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="낮음">낮음</option>
                <option value="보통">보통</option>
                <option value="높음">높음</option>
                <option value="긴급">긴급</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                희망 완료일
                {isUrgentRequest && (
                  <span className="text-red-600 ml-2 text-xs">⚡ 당일 요청</span>
                )}
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, dueDate: e.target.value }));
                  const today = new Date().toISOString().split('T')[0];
                  setIsUrgentRequest(e.target.value === today);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* 발주요청 전용: 대행사 어드민 선택 */}
          {mode === 'order_request' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">승인 관리자 *</label>
              <select
                value={formData.agencyAdminId}
                onChange={(e) => setFormData(prev => ({ ...prev, agencyAdminId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">관리자를 선택하세요</option>
                {agencyAdmins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} ({admin.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 캠페인 연결 (선택사항) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연관 캠페인</label>
              <select
                value={formData.campaignId}
                onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value, postId: '' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">선택 안함</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} - {campaign.client}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연관 포스트</label>
              <select
                value={formData.postId}
                onChange={(e) => setFormData(prev => ({ ...prev, postId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                disabled={!formData.campaignId}
              >
                <option value="">선택 안함</option>
                {campaignPosts.map(post => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white rounded-lg hover:opacity-90 ${
                mode === 'order_request' ? 'bg-purple-600' : 'bg-blue-600'
              }`}
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : 
               mode === 'order_request' ? '발주요청 전송' : 
               request ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedPurchaseRequestModal;