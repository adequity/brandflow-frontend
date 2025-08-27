import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { approvalAPI } from '../api/client';
import { getCurrentUser, shouldShowApprovalButtons } from '../utils/permissions';

const ApprovalButtons = ({ 
  resourceType, 
  resource, 
  onApproved = () => {}, 
  onRejected = () => {},
  compact = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');

  const currentUser = getCurrentUser();

  // 승인 버튼 표시 여부 확인
  if (!shouldShowApprovalButtons(currentUser, resourceType, resource)) {
    return null;
  }

  // 승인 불가능한 상태인지 확인
  const isApprovable = () => {
    switch (resourceType) {
      case 'post':
        return ['주제 승인 대기', '개요 승인 대기'].includes(resource.topicStatus || resource.outlineStatus);
      case 'purchase_request':
        return resource.status === '승인 대기';
      case 'incentive':
        return resource.status === '검토대기';
      default:
        return false;
    }
  };

  const handleApprove = async () => {
    if (!isApprovable()) return;
    
    setIsLoading(true);
    try {
      let response;
      
      switch (resourceType) {
        case 'post':
          response = await approvalAPI.approvePost(resource.id, '승인됨');
          break;
        case 'purchase_request':
          response = await approvalAPI.approvePurchaseRequest(
            resource.id, 
            '승인완료',
            adjustmentAmount,
            adjustmentReason,
            paymentMemo
          );
          break;
        case 'incentive':
          response = await approvalAPI.approveIncentive(
            resource.id,
            '승인완료',
            adjustmentAmount,
            adjustmentReason,
            paymentMemo
          );
          break;
      }

      onApproved(response.data);
      setIsExpanded(false);
      setAdjustmentAmount(0);
      setAdjustmentReason('');
      setPaymentMemo('');
      
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!isApprovable() || !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    try {
      let response;
      
      switch (resourceType) {
        case 'post':
          response = await approvalAPI.approvePost(resource.id, '반려됨', rejectionReason);
          break;
        case 'purchase_request':
          response = await approvalAPI.approvePurchaseRequest(resource.id, '반려', 0, rejectionReason);
          break;
        case 'incentive':
          response = await approvalAPI.approveIncentive(resource.id, '취소', 0, rejectionReason);
          break;
      }

      onRejected(response.data);
      setIsExpanded(false);
      setRejectionReason('');
      
    } catch (error) {
      console.error('반려 실패:', error);
      alert('반려에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 승인 불가능한 상태면 버튼 표시 안함
  if (!isApprovable()) {
    return null;
  }

  const getResourceTypeName = () => {
    switch (resourceType) {
      case 'post': return '업무';
      case 'purchase_request': return '발주요청';
      case 'incentive': return '인센티브';
      default: return '항목';
    }
  };

  return (
    <div className="approval-buttons">
      {compact ? (
        // 간단한 버튼 표시 (목록에서 사용)
        <div className="flex space-x-2">
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
          >
            <Check className="w-4 h-4" />
            <span>승인</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={isLoading}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>반려</span>
          </button>
        </div>
      ) : (
        // 상세한 승인/반려 인터페이스 (상세보기에서 사용)
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">
              {getResourceTypeName()} 승인/반려
            </h4>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-800"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {isExpanded && (
            <div className="space-y-4">
              {/* 발주요청이나 인센티브인 경우 금액 조정 옵션 */}
              {(resourceType === 'purchase_request' || resourceType === 'incentive') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      조정 금액
                    </label>
                    <input
                      type="number"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      조정 사유
                    </label>
                    <input
                      type="text"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="조정 사유 입력"
                    />
                  </div>
                </div>
              )}

              {/* 결제 메모 (발주요청, 인센티브) */}
              {(resourceType === 'purchase_request' || resourceType === 'incentive') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제 메모
                  </label>
                  <input
                    type="text"
                    value={paymentMemo}
                    onChange={(e) => setPaymentMemo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="결제 관련 메모"
                  />
                </div>
              )}

              {/* 반려 사유 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반려 사유 (반려 시 필수)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="반려 사유를 입력해주세요"
                />
              </div>

              {/* 버튼들 */}
              <div className="flex space-x-3">
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>승인</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleReject}
                  disabled={isLoading || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>반려</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 간단한 승인/반려 버튼 (펼치기 전) */}
          {!isExpanded && (
            <div className="flex space-x-3">
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>승인</span>
              </button>
              
              <button
                onClick={() => setIsExpanded(true)}
                disabled={isLoading}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>반려</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalButtons;