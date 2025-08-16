// src/pages/PurchaseRequestsPage.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Download, FileImage } from 'lucide-react';
import api from '../api/client';

const PurchaseRequestsPage = ({ loggedInUser }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalAmount: 0,
    thisMonthAmount: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    resourceType: ''
  });

  const fetchRequests = async () => {
    if (!loggedInUser?.id) return;
    
    setIsLoading(true);
    try {
      const { data } = await api.get('/api/purchase-requests', {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role,
          ...filters
        }
      });
      setRequests(data.requests || []);
    } catch (error) {
      console.error('구매요청 목록 로딩 실패:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!loggedInUser?.id) return;
    
    try {
      const { data } = await api.get('/api/purchase-requests/summary/stats', {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      setStats(data);
    } catch (error) {
      console.error('구매요청 통계 로딩 실패:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchStats();
  }, [loggedInUser, filters]);

  const handleCreateRequest = () => {
    setSelectedRequest(null);
    setCreateModalOpen(true);
  };

  const handleEditRequest = (request) => {
    setSelectedRequest(request);
    setEditModalOpen(true);
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('정말로 이 구매요청을 삭제하시겠습니까?')) return;
    
    try {
      await api.delete(`/api/purchase-requests/${requestId}`, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      await fetchRequests();
      await fetchStats();
    } catch (error) {
      console.error('구매요청 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleGenerateDocuments = async (requestId, type = 'transaction') => {
    try {
      const response = await api.post(`/api/purchase-requests/${requestId}/generate-documents`, {
        type
      }, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });

      const { files } = response.data;
      
      // PDF와 JPG 파일을 동시에 다운로드
      downloadFile(files.pdf.data, files.pdf.filename, files.pdf.mimeType);
      downloadFile(files.jpg.data, files.jpg.filename, files.jpg.mimeType);
      
      alert(`📄 ${type === 'quote' ? '견적서' : '거래명세서'}가 PDF와 JPG로 생성되었습니다!\n드래그해서 카카오톡으로 전송하세요! 🚀`);
      
    } catch (error) {
      console.error('문서 생성 실패:', error);
      alert('문서 생성에 실패했습니다.');
    }
  };

  const downloadFile = (base64Data, filename, mimeType) => {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const baseClass = 'px-2 py-1 text-xs font-medium rounded-full';
    const statusStyles = {
      '승인 대기': 'bg-yellow-100 text-yellow-800',
      '검토 중': 'bg-blue-100 text-blue-800',
      '승인됨': 'bg-green-100 text-green-800',
      '거절됨': 'bg-red-100 text-red-800',
      '보류': 'bg-orange-100 text-orange-800',
      '구매 완료': 'bg-purple-100 text-purple-800',
      '정산 완료': 'bg-gray-100 text-gray-800'
    };
    
    return `${baseClass} ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case '긴급': return <AlertCircle size={16} className="text-red-500" />;
      case '높음': return <AlertCircle size={16} className="text-orange-500" />;
      case '보통': return <Clock size={16} className="text-blue-500" />;
      case '낮음': return <Clock size={16} className="text-gray-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const canEditRequest = (request) => {
    if (loggedInUser?.role === '슈퍼 어드민') return true;
    if (loggedInUser?.role === '대행사 어드민') return true;
    if (loggedInUser?.role === '직원' && request.requesterId === loggedInUser.id && request.status === '승인 대기') return true;
    return false;
  };

  const canDeleteRequest = (request) => {
    if (loggedInUser?.role === '슈퍼 어드민') return true;
    if (loggedInUser?.role === '대행사 어드민') return true;
    if (loggedInUser?.role === '직원' && request.requesterId === loggedInUser.id && request.status === '승인 대기') return true;
    return false;
  };

  if (isLoading) {
    return <div className="p-6">구매요청 목록을 불러오는 중...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">💰 리소스 구매요청</h2>
          <p className="text-gray-600 mt-1">업무 진행을 위한 리소스 구매요청을 관리하세요</p>
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">
            💡 <strong>Tip:</strong> 승인된 요청은 거래명세서/견적서를 PDF+JPG로 생성하여 카카오톡으로 드래그 전송할 수 있습니다!
          </div>
        </div>
        {(loggedInUser?.role === '직원' || loggedInUser?.role === '대행사 어드민') && (
          <button
            onClick={handleCreateRequest}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>구매요청 작성</span>
          </button>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 요청</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalRequests}</p>
            </div>
            <FileText className="text-blue-400" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
            </div>
            <Clock className="text-yellow-400" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 완료</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedRequests}</p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 승인금액</p>
              <p className="text-lg font-bold text-purple-600">{formatAmount(stats.totalAmount)}</p>
            </div>
            <DollarSign className="text-purple-400" size={24} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">이번 달</p>
              <p className="text-lg font-bold text-indigo-600">{formatAmount(stats.thisMonthAmount)}</p>
            </div>
            <DollarSign className="text-indigo-400" size={24} />
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체</option>
              <option value="승인 대기">승인 대기</option>
              <option value="검토 중">검토 중</option>
              <option value="승인됨">승인됨</option>
              <option value="거절됨">거절됨</option>
              <option value="보류">보류</option>
              <option value="구매 완료">구매 완료</option>
              <option value="정산 완료">정산 완료</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">리소스 종류</label>
            <select
              value={filters.resourceType}
              onChange={(e) => setFilters(prev => ({ ...prev, resourceType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체</option>
              <option value="광고비">광고비</option>
              <option value="콘텐츠 제작비">콘텐츠 제작비</option>
              <option value="도구 구독료">도구 구독료</option>
              <option value="외부 용역비">외부 용역비</option>
              <option value="소재 구매비">소재 구매비</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>
      </div>

      {/* 요청 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💰</div>
            <p className="text-gray-500 mb-4">등록된 구매요청이 없습니다.</p>
            {(loggedInUser?.role === '직원' || loggedInUser?.role === '대행사 어드민') && (
              <button
                onClick={handleCreateRequest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                첫 구매요청 작성하기
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
              <tr>
                <th className="px-6 py-3">요청 정보</th>
                <th className="px-6 py-3">리소스 종류</th>
                <th className="px-6 py-3">금액</th>
                <th className="px-6 py-3">상태</th>
                <th className="px-6 py-3">요청자</th>
                <th className="px-6 py-3">요청일</th>
                <th className="px-6 py-3">문서생성</th>
                <th className="px-6 py-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {getPriorityIcon(request.priority)}
                      <div>
                        <div className="font-medium text-gray-900">{request.title}</div>
                        {request.description && (
                          <div className="text-gray-500 text-xs truncate max-w-xs">
                            {request.description}
                          </div>
                        )}
                        {request.campaign && (
                          <div className="text-blue-600 text-xs">
                            📁 {request.campaign.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {request.resourceType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {formatAmount(request.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(request.status)}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{request.requester?.name}</div>
                    <div className="text-gray-500 text-xs">{request.requester?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(request.requestedDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4">
                    {request.status === '승인됨' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleGenerateDocuments(request.id, 'transaction')}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                          title="거래명세서 생성 (PDF + JPG)"
                        >
                          <FileText size={16} />
                          <span className="sr-only">거래명세서</span>
                        </button>
                        <button
                          onClick={() => handleGenerateDocuments(request.id, 'quote')}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors group"
                          title="견적서 생성 (PDF + JPG)"
                        >
                          <FileImage size={16} />
                          <span className="sr-only">견적서</span>
                        </button>
                      </div>
                    )}
                    {request.status !== '승인됨' && (
                      <span className="text-xs text-gray-400">승인 후 생성 가능</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {canEditRequest(request) && (
                        <button
                          onClick={() => handleEditRequest(request)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="편집"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {canDeleteRequest(request) && (
                        <button
                          onClick={() => handleDeleteRequest(request.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 모달들 */}
      {isCreateModalOpen && (
        <PurchaseRequestModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            fetchRequests();
            fetchStats();
            setCreateModalOpen(false);
          }}
          loggedInUser={loggedInUser}
        />
      )}

      {isEditModalOpen && selectedRequest && (
        <PurchaseRequestModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={() => {
            fetchRequests();
            fetchStats();
            setEditModalOpen(false);
          }}
          loggedInUser={loggedInUser}
          request={selectedRequest}
        />
      )}
    </div>
  );
};

// 구매요청 생성/수정 모달
const PurchaseRequestModal = ({ isOpen, onClose, onSuccess, loggedInUser, request = null }) => {
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
    rejectReason: ''
  });
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (request) {
      setFormData({
        title: request.title || '',
        description: request.description || '',
        amount: request.amount || '',
        resourceType: request.resourceType || '광고비',
        priority: request.priority || '보통',
        dueDate: request.dueDate ? new Date(request.dueDate).toISOString().split('T')[0] : '',
        campaignId: request.campaignId || '',
        postId: request.postId || '',
        status: request.status || '승인 대기',
        approverComment: request.approverComment || '',
        rejectReason: request.rejectReason || ''
      });
    }
    
    // 캠페인 목록 로드
    fetchCampaigns();
  }, [request]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
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
      alert('저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
                <option value="광고비">광고비</option>
                <option value="콘텐츠 제작비">콘텐츠 제작비</option>
                <option value="도구 구독료">도구 구독료</option>
                <option value="외부 용역비">외부 용역비</option>
                <option value="소재 구매비">소재 구매비</option>
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
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
                step="1000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">희망 완료일</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
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

export default PurchaseRequestsPage;