import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { formatNumberWithCommas, removeCommas } from '../../utils/dataUtils';
import { AlertTriangle, Upload, X, FileText } from 'lucide-react';


const CampaignCancelModal = ({ campaign, onConfirm, onClose, currentUser }) => {
  const { showSuccess, showError } = useToast();
  const [refundType, setRefundType] = useState('전액환불');
  const [refundAmount, setRefundAmount] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelPosts, setCancelPosts] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cancelInvoiceFile, setCancelInvoiceFile] = useState(null);

  // 총 예산 계산 (활성 포스트 기준)
  const totalBudget = campaign?.posts
    ? campaign.posts.reduce((sum, post) => {
        if (post.is_active !== false && !post.is_cancelled) {
          return sum + (post.budget || 0);
        }
        return sum;
      }, 0)
    : (campaign?.budget || 0);

  const activePosts = campaign?.posts
    ? campaign.posts.filter(p => p.is_active !== false && !p.is_cancelled)
    : [];

  const handleRefundAmountChange = (e) => {
    const value = e.target.value;
    setRefundAmount(formatNumberWithCommas(value));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showError('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
      }
      setCancelInvoiceFile(file);
    }
  };

  const handleSubmit = async () => {
    // 부분환불 시 금액 검증
    if (refundType === '부분환불') {
      const amount = parseFloat(removeCommas(refundAmount));
      if (!amount || amount <= 0) {
        showError('부분환불 금액을 입력해주세요.');
        return;
      }
      if (amount > totalBudget) {
        showError(`환불 금액(${formatNumberWithCommas(amount.toString())}원)이 총 예산(${formatNumberWithCommas(totalBudget.toString())}원)을 초과할 수 없습니다.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      // 1. 캠페인 취소 API 호출
      const cancelData = {
        cancellation_reason: cancellationReason,
        refund_type: refundType,
        refund_amount: refundType === '부분환불' ? parseFloat(removeCommas(refundAmount)) : null,
        cancel_posts: cancelPosts
      };

      const response = await api.post(`/api/campaigns/${campaign.id}/cancel`, cancelData);

      // 2. 취소 계산서 파일 업로드 (있으면)
      if (cancelInvoiceFile && response.data) {
        try {
          // 환불 내역에서 첫 번째 campaign refund ID를 조회
          const refundsResponse = await api.get(`/api/campaigns/${campaign.id}/refunds`);
          const campaignRefunds = refundsResponse.data?.campaign_refunds || [];
          if (campaignRefunds.length > 0) {
            const latestRefundId = campaignRefunds[0].id;
            const formData = new FormData();
            formData.append('file', cancelInvoiceFile);
            await api.post(
              `/api/campaigns/${campaign.id}/refunds/${latestRefundId}/upload-cancel-invoice`,
              formData,
              { params: { refund_target: 'campaign' } }
            );
          }
        } catch (uploadError) {
          console.error('취소 계산서 업로드 실패:', uploadError);
          // 취소는 성공했으므로 업로드 실패는 경고로 처리
          showError('캠페인 취소는 완료되었으나, 취소 계산서 업로드에 실패했습니다. 나중에 다시 업로드해주세요.');
        }
      }

      const actualRefundAmount = refundType === '전액환불' ? totalBudget : parseFloat(removeCommas(refundAmount));
      showSuccess(`캠페인이 취소되었습니다. 환불금액: ${formatNumberWithCommas(actualRefundAmount.toString())}원`);

      if (onConfirm) onConfirm();
    } catch (error) {
      console.error('캠페인 취소 실패:', error);
      const errorMessage = error?.response?.data?.detail || '캠페인 취소에 실패했습니다.';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        {/* 헤더 */}
        <div className="bg-red-50 p-5 rounded-t-lg border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800">캠페인 취소</h3>
                <p className="text-sm text-red-600">{campaign?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* 캠페인 정보 요약 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">총 예산</span>
                <p className="font-semibold text-gray-900">{formatNumberWithCommas(totalBudget.toString())}원</p>
              </div>
              <div>
                <span className="text-gray-500">활성 업무</span>
                <p className="font-semibold text-gray-900">{activePosts.length}건</p>
              </div>
            </div>
          </div>

          {/* 환불 유형 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">환불 유형</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRefundType('전액환불')}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  refundType === '전액환불'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                전액환불
              </button>
              <button
                type="button"
                onClick={() => setRefundType('부분환불')}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                  refundType === '부분환불'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                부분환불
              </button>
            </div>
          </div>

          {/* 부분환불 금액 입력 */}
          {refundType === '부분환불' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">환불 금액</label>
              <div className="relative">
                <input
                  type="text"
                  value={refundAmount}
                  onChange={handleRefundAmountChange}
                  placeholder="환불 금액을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-12 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  pattern="[0-9,]*"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 text-sm">
                  원
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                최대 환불 가능 금액: {formatNumberWithCommas(totalBudget.toString())}원
              </p>
            </div>
          )}

          {/* 취소 사유 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">취소 사유</label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="취소 사유를 입력하세요 (선택사항)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* 업무 취소 옵션 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cancelPosts"
              checked={cancelPosts}
              onChange={(e) => setCancelPosts(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="cancelPosts" className="text-sm text-gray-700">
              모든 업무도 함께 취소 ({activePosts.length}건)
            </label>
          </div>

          {/* 취소 계산서 파일 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">취소 계산서 (선택)</label>
            {cancelInvoiceFile ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-blue-700 truncate flex-1">{cancelInvoiceFile.name}</span>
                <button
                  onClick={() => setCancelInvoiceFile(null)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">파일을 선택하세요 (최대 10MB)</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
              </label>
            )}
          </div>

          {/* 경고 메시지 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-medium mb-1">주의사항</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>취소된 캠페인은 매출에서 제외됩니다</li>
                  <li>환불 처리 후 되돌릴 수 없습니다</li>
                  {cancelPosts && <li>모든 업무({activePosts.length}건)가 함께 취소됩니다</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-5 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={isLoading}
          >
            돌아가기
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {isLoading ? '처리 중...' : '캠페인 취소 및 환불 처리'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignCancelModal;
