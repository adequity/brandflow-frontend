// src/components/modals/PurchaseRequestModal.jsx
import React, { useState, useEffect } from 'react';
import purchaseRequestApi from '../../api/purchaseRequestApi';
import { useToast } from '../../contexts/ToastContext';
import { formatNumberWithCommas, removeCommas } from '../../utils/dataUtils';
import { RESOURCE_TYPES } from '../../constants/purchaseRequestTypes';
import { API_BASE_URL } from '../../api/client';

const PurchaseRequestModal = ({ isOpen, onClose, onSuccess, loggedInUser, request = null, initialData = null }) => {
  const { showError } = useToast();

  // RESOURCE_TYPES 안전하게 초기화
  const defaultResourceType = Array.isArray(RESOURCE_TYPES) && RESOURCE_TYPES.length > 0
    ? RESOURCE_TYPES[0]
    : '기자재 구매';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    vendor: '',  // ✅ 공급업체 필드 추가
    resourceType: defaultResourceType,
    priority: '보통',
    dueDate: '',
    status: '승인 대기',
    approverComment: '',
    rejectReason: ''
  });
  const [isUrgentRequest, setIsUrgentRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);



  useEffect(() => {
    if (request) {
      const dueDate = request.dueDate ? new Date(request.dueDate).toISOString().split('T')[0] : '';
      const today = new Date().toISOString().split('T')[0];

      setFormData({
        title: request.title || '',
        description: request.description || '',
        amount: request.amount ? formatNumberWithCommas(request.amount.toString()) : '',
        vendor: request.vendor || '',  // ✅ 공급업체 추가
        resourceType: request.resourceType || defaultResourceType,
        priority: request.priority || '보통',
        dueDate: dueDate,
        status: request.status || '승인 대기',
        approverComment: request.approverComment || '',
        rejectReason: request.rejectReason || ''
      });

      // 기존 영수증 미리보기 설정 (백엔드 URL 포함)
      if (request.receiptFileUrl) {
        const fullImageUrl = request.receiptFileUrl.startsWith('http')
          ? request.receiptFileUrl
          : `${API_BASE_URL}${request.receiptFileUrl}`;
        setReceiptPreview(fullImageUrl);
        console.log('[PurchaseRequestModal] 영수증 미리보기 설정:', fullImageUrl);
      }

      // 기존 요청의 완료일이 오늘 날짜와 같으면 당일요청으로 설정
      setIsUrgentRequest(dueDate === today);
    } else if (initialData) {
      // 초기 데이터가 있는 경우
      setFormData(prev => ({
        ...prev,
        title: initialData.title || ''
      }));
      setIsUrgentRequest(false);
    } else {
      // 새 요청인 경우 초기화
      setIsUrgentRequest(false);
    }
  }, [request, initialData, defaultResourceType]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(removeCommas(formData.amount)),
        dueDate: formData.dueDate || null
      };

      const params = {
        viewerId: loggedInUser.id,
        viewerRole: loggedInUser.role
      };

      if (request) {
        await purchaseRequestApi.update(request.id, submitData, params);
      } else {
        await purchaseRequestApi.create(submitData, params);
      }

      onSuccess();
    } catch (error) {
      console.error('[PurchaseRequestModal] 구매요청 저장 실패:', error);
      showError('저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 금액 필드인 경우 콤마 처리
    if (name === 'amount') {
      const numericValue = removeCommas(value);
      const formattedValue = formatNumberWithCommas(numericValue);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleReceiptFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      showError('jpg, jpeg, png 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setReceiptFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !request) {
      showError('영수증 파일을 선택해주세요.');
      return;
    }

    setIsUploadingReceipt(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', receiptFile);

      const data = await purchaseRequestApi.uploadReceipt(
        request.id,
        uploadFormData,
        {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      );

      if (data.success) {
        // 백엔드 URL을 포함한 전체 이미지 URL 생성
        const fullImageUrl = data.fileUrl.startsWith('http')
          ? data.fileUrl
          : `${API_BASE_URL}${data.fileUrl}`;
        setReceiptPreview(fullImageUrl);
        setReceiptFile(null);
        console.log('[PurchaseRequestModal] 영수증 업로드 성공:', fullImageUrl);
        alert('영수증이 업로드되었습니다.');
      }
    } catch (error) {
      console.error('[PurchaseRequestModal] 영수증 업로드 실패:', error);
      showError('영수증 업로드에 실패했습니다.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const isAdminRole = loggedInUser?.role === 'AGENCY_ADMIN' || loggedInUser?.role === 'SUPER_ADMIN';

  if (!isOpen) return null;

  console.log('[PurchaseRequestModal] Rendering - isOpen:', isOpen, 'request:', request);
  console.log('[PurchaseRequestModal] loggedInUser:', loggedInUser);
  console.log('[PurchaseRequestModal] RESOURCE_TYPES:', RESOURCE_TYPES);
  console.log('[PurchaseRequestModal] formData:', formData);

  // 안전성 체크
  if (!loggedInUser || !loggedInUser.id) {
    console.error('[PurchaseRequestModal] loggedInUser 없음!');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md">
          <h3 className="text-xl font-bold text-red-600 mb-4">오류</h3>
          <p className="text-gray-700 mb-4">사용자 정보를 불러올 수 없습니다.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(RESOURCE_TYPES) || RESOURCE_TYPES.length === 0) {
    console.error('[PurchaseRequestModal] RESOURCE_TYPES 오류!', RESOURCE_TYPES);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md">
          <h3 className="text-xl font-bold text-red-600 mb-4">오류</h3>
          <p className="text-gray-700 mb-4">리소스 타입을 불러올 수 없습니다.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
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
                {RESOURCE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">공급업체</label>
              <input
                type="text"
                name="vendor"
                value={formData.vendor}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="공급업체명을 입력하세요"
              />
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

            {/* 영수증 업로드 */}
            <div className="md:col-span-2 border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📸 영수증 파일 (jpg, jpeg, png)
              </label>

                <div className="space-y-3">
                  {/* 파일 선택 */}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      capture="environment"
                      onChange={handleReceiptFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100
                        cursor-pointer"
                    />
                    {receiptFile && (
                      <button
                        type="button"
                        onClick={handleUploadReceipt}
                        disabled={isUploadingReceipt}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {isUploadingReceipt ? '업로드 중...' : '업로드'}
                      </button>
                    )}
                  </div>

                  {/* 미리보기 */}
                  {receiptPreview && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">미리보기:</p>
                      <img
                        src={receiptPreview}
                        alt="영수증 미리보기"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300"
                      />
                    </div>
                  )}
                </div>

              <p className="text-xs text-gray-500 mt-2">
                💡 모바일에서 카메라로 바로 촬영하여 업로드할 수 있습니다
              </p>
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