// src/pages/PurchaseRequestsPage.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Download, FileImage } from 'lucide-react';
import api from '../api/client';
import PurchaseRequestModal from '../components/modals/PurchaseRequestModal';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

const PurchaseRequestsPage = ({ loggedInUser }) => {
  const { showSuccess, showError, showInfo } = useToast();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, requestId: null });
  const [statusUpdateConfirm, setStatusUpdateConfirm] = useState({ isOpen: false, requestId: null, newStatus: null });
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
      const token = localStorage.getItem('authToken');
      console.log('PurchaseRequestsPage: 토큰 상태:', token ? '존재' : '없음');
      
      if (token) {
        try {
          // 실제 API 호출 - 비품 구매 요청만 필터링
          const response = await api.get('/api/purchase-requests/', {
            params: {
              viewerId: loggedInUser.id,
              viewerRole: loggedInUser.role,
              resourceType: '비품 구매' // 비품 구매 요청만 가져오기
            }
          });
          const requestsData = response.data.requests || response.data.results || response.data;
          
          // 프론트엔드 형식에 맞게 데이터 변환
          const transformedRequests = requestsData.map(request => ({
            id: request.id,
            title: request.title,
            description: request.description,
            amount: parseInt(request.amount),
            resourceType: request.resourceType || '구매요청',
            priority: request.priority || '보통',
            status: request.status,
            requesterId: request.requesterId,
            requester: request.requester || { 
              name: request.requester_name || '요청자', 
              email: request.requester_email || '' 
            },
            requestedDate: request.requestedDate || request.createdAt,
            dueDate: request.dueDate,
            campaign: request.campaign
          }));
          
          console.log('PurchaseRequestsPage: 실제 API 데이터 로드 성공');
          console.log('구매요청:', transformedRequests.length, '개');
          setRequests(transformedRequests);
        } catch (apiError) {
          console.warn('PurchaseRequestsPage: API 호출 실패', apiError);
          // API 실패시 빈 배열로 설정
          setRequests([]);
        }
      } else {
        console.warn('PurchaseRequestsPage: 인증 토큰이 없음');
        // 토큰이 없으면 빈 배열로 설정
        setRequests([]);
      }
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
      // 실제 통계 API 호출
      const response = await api.get('/api/purchase-requests/summary/stats', {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('구매요청 통계 로딩 실패:', error);
      // API 실패 시 기본값
      const defaultStats = {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        totalAmount: 0,
        thisMonthAmount: 0
      };
      setStats(defaultStats);
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

  const handleDeleteRequest = (requestId) => {
    setDeleteConfirm({ isOpen: true, requestId });
  };

  const confirmDeleteRequest = async () => {
    try {
      // 실제 API 호출로 삭제
      await api.delete(`/api/purchase-requests/${deleteConfirm.requestId}`, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });
      showSuccess('구매요청이 삭제되었습니다.');
      await fetchRequests();
      await fetchStats();
      setDeleteConfirm({ isOpen: false, requestId: null });
    } catch (error) {
      console.error('구매요청 삭제 실패:', error);
      showError('삭제에 실패했습니다.');
    }
  };

  const handleStatusUpdate = (requestId, newStatus) => {
    setStatusUpdateConfirm({ isOpen: true, requestId, newStatus });
  };

  const confirmStatusUpdate = async () => {
    const { requestId, newStatus } = statusUpdateConfirm;
    const statusName = newStatus === '승인됨' ? '승인' : newStatus === '완료됨' ? '완료' : newStatus;
    
    try {
      // 실제 API 호출로 상태 업데이트
      await api.put(`/api/purchase-requests/${requestId}`, 
        { status: newStatus },
        {
          params: {
            viewerId: loggedInUser.id,
            viewerRole: loggedInUser.role
          }
        }
      );
      
      await fetchRequests();
      await fetchStats();
      
      if (newStatus === '승인됨' || newStatus === '완료됨') {
        showInfo(`구매요청이 ${statusName} 처리되었습니다.\n연결된 캠페인의 집행 상태도 자동으로 업데이트됩니다.`);
      } else {
        showSuccess(`구매요청 상태가 '${newStatus}'로 업데이트되었습니다.`);
      }
      
      setStatusUpdateConfirm({ isOpen: false, requestId: null, newStatus: null });
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
      showError('상태 업데이트에 실했했습니다.');
    }
  };

  const handleGenerateDocuments = async (requestId, type = 'transaction') => {
    try {
      // 실제 API 호출로 문서 생성
      const response = await api.post(`/api/purchase-requests/${requestId}/generate-documents`, 
        { type },
        {
          params: {
            viewerId: loggedInUser.id,
            viewerRole: loggedInUser.role
          }
        }
      );
      
      const { files } = response.data;
      
      // PDF 다운로드
      if (files.pdf) {
        downloadFile(files.pdf.data, files.pdf.filename, files.pdf.mimeType);
      }
      
      // JPG 다운로드
      if (files.jpg) {
        downloadFile(files.jpg.data, files.jpg.filename, files.jpg.mimeType);
      }
      
      showInfo(`📄 ${type === 'quote' ? '견적서' : '거래명세서'}가 PDF와 JPG로 생성되었습니다!\n드래그해서 카카오톡으로 전송하세요! 🚀`);
      
    } catch (error) {
      console.error('문서 생성 실패:', error);
      showError('문서 생성에 실패했습니다.');
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
    // 직원은 삭제 불가 (본사가 취소하는 형태로 로그를 남겨야 함)
    if (loggedInUser?.role === '직원') return false;
    if (loggedInUser?.role === '슈퍼 어드민') return true;
    if (loggedInUser?.role === '대행사 어드민') return true;
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
                <th className="px-6 py-3">희망 완료일</th>
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
                    {request.dueDate ? (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-900">
                          {new Date(request.dueDate).toLocaleDateString('ko-KR')}
                        </span>
                        {/* 당일 요청인지 확인 */}
                        {new Date(request.dueDate).toDateString() === new Date(request.requestedDate).toDateString() && (
                          <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            🚨 당일
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
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
                      {/* 대행사 어드민 전용 승인/완료 버튼 */}
                      {loggedInUser?.role === '대행사 어드민' && (
                        <>
                          {request.status === '승인 대기' && (
                            <button
                              onClick={() => handleStatusUpdate(request.id, '승인됨')}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="승인"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          {request.status === '승인됨' && (
                            <button
                              onClick={() => handleStatusUpdate(request.id, '완료됨')}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="집행 완료"
                            >
                              <DollarSign size={16} />
                            </button>
                          )}
                        </>
                      )}
                      
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

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, requestId: null })}
        onConfirm={confirmDeleteRequest}
        title="구매요청 삭제"
        message="정말로 이 구매요청을 삭제하시겠습니까?"
        type="warning"
        confirmText="삭제"
        cancelText="취소"
      />

      {/* 상태 업데이트 확인 모달 */}
      <ConfirmModal
        isOpen={statusUpdateConfirm.isOpen}
        onClose={() => setStatusUpdateConfirm({ isOpen: false, requestId: null, newStatus: null })}
        onConfirm={confirmStatusUpdate}
        title="상태 변경 확인"
        message={`이 구매요청을 ${statusUpdateConfirm.newStatus === '승인됨' ? '승인' : statusUpdateConfirm.newStatus === '완료됨' ? '완료' : statusUpdateConfirm.newStatus} 처리하시겠습니까?`}
        type="info"
        confirmText={statusUpdateConfirm.newStatus === '승인됨' ? '승인' : statusUpdateConfirm.newStatus === '완료됨' ? '완료' : '확인'}
        cancelText="취소"
      />
    </div>
  );
};


export default PurchaseRequestsPage;