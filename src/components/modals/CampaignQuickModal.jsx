import React from 'react';
import { X, ExternalLink, Edit3, Calendar, User, DollarSign, Target } from 'lucide-react';

const CampaignQuickModal = ({ campaign, isOpen, onClose, onEdit }) => {
  if (!isOpen || !campaign) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case '승인': return 'text-green-600 bg-green-100';
      case '대기': return 'text-yellow-600 bg-yellow-100';
      case '거절': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getWorkTypeColor = (workType) => {
    switch (workType) {
      case '블로그': return 'bg-blue-500';
      case '인스타그램': return 'bg-pink-500';
      case '유튜브': return 'bg-red-500';
      case '페이스북': return 'bg-blue-600';
      default: return 'bg-gray-500';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">캠페인 상세</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 캠페인 기본 정보 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">{campaign.name}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">클라이언트:</span>
                <span className="font-medium">{campaign.client}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">생성일:</span>
                <span className="font-medium">{formatDate(campaign.createdAt)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">예상 수익:</span>
                <span className="font-medium text-green-600">{formatCurrency(campaign.revenue || 0)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">총 포스트:</span>
                <span className="font-medium">{campaign.post_count || campaign.posts?.length || 0}개</span>
              </div>
            </div>
          </div>

          {/* 담당자 정보 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">담당자</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-sm font-medium">{campaign.manager_name || campaign.User?.name || '미정'}</span>
            </div>
          </div>

          {/* 포스트 현황 */}
          {campaign.posts && campaign.posts.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">포스트 현황</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {campaign.posts.map((post, index) => (
                  <div key={post.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`w-3 h-3 rounded-full ${getWorkTypeColor(post.workType)}`}
                        title={post.workType}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{post.title}</div>
                        <div className="text-xs text-gray-500">{post.workType}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.topicStatus)}`}>
                      {post.topicStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 결제 상태 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">결제 현황</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">인보이스 발행:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  campaign.invoiceIssued ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {campaign.invoiceIssued ? '완료' : '미완료'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">결제 완료:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  campaign.paymentCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {campaign.paymentCompleted ? '완료' : '미완료'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={() => onEdit(campaign)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>캠페인 수정하러 가기</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignQuickModal;