// src/pages/SalesRegistrationEnhanced.jsx - 개선된 매출 등록 시스템
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp, DollarSign, Calendar, User, Package, FileText, ShoppingCart, Send } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';

const SalesRegistrationEnhanced = ({ loggedInUser }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [employees, setEmployees] = useState([]); // AGENCY_ADMIN용 STAFF 목록
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingSales: 0,
    approvedSales: 0,
    totalRevenue: 0,
    totalMargin: 0,
    totalIncentives: 0
  });

  // 권한 확인
  const canRegisterSales = ['STAFF', 'AGENCY_ADMIN'].includes(loggedInUser?.role);
  const canManageSales = ['SUPER_ADMIN', 'AGENCY_ADMIN'].includes(loggedInUser?.role);
  const canRegisterForOthers = loggedInUser?.role === 'AGENCY_ADMIN'; // AGENCY_ADMIN만 다른 STAFF 대신 등록 가능

  // STAFF 목록 조회 (AGENCY_ADMIN용)
  const fetchEmployees = async () => {
    if (loggedInUser?.role !== 'AGENCY_ADMIN') return;
    
    try {
      const { data } = await api.get('/api/users', {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role,
          role: 'STAFF' // STAFF만 조회
        }
      });
      setEmployees(data.filter(user => user.company === loggedInUser.company));
    } catch (error) {
      console.error('STAFF 목록 로딩 실패:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [loggedInUser]);

  // 매출에서 발주요청 생성
  const createOrderRequest = async (sale) => {
    try {
      const description = prompt(
        `발주요청 설명을 입력하세요:`, 
        `${sale.projectName || sale.product?.name} - ${sale.clientName} (매출번호: ${sale.saleNumber})`
      );
      if (!description) return;

      // 발주요청 생성 - AGENCY_ADMIN의 승인 대기 상태로 생성
      const response = await api.post('/api/sales/create-order-request', {
        saleId: sale.id,
        title: `매출 연동 발주요청 - ${sale.saleNumber}`,
        description,
        amount: sale.actualCostPrice * sale.quantity, // 원가 기준으로 발주금액 계산
        resourceType: '매출 연동 발주',
        priority: '보통',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
        requesterId: loggedInUser.id,
        agencyAdminId: getAgencyAdminId(loggedInUser), // 해당 대행사의 어드민 ID
        status: '발주 대기' // 새로운 상태
      }, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser.role
        }
      });

      showSuccess('발주요청이 대행사 관리자에게 전송되었습니다!');
      console.log('생성된 발주요청:', response.data);
    } catch (error) {
      console.error('발주요청 생성 실패:', error);
      showError(error.response?.data?.message || '발주요청 생성에 실패했습니다.');
    }
  };

  // AGENCY_ADMIN ID 찾기
  const getAgencyAdminId = (user) => {
    // 현재 사용자가 STAFF인 경우, 같은 회사의 AGENCY_ADMIN ID를 반환
    // 백엔드에서 처리하거나 사전에 저장된 정보 사용
    return user.agencyAdminId || null;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">매출 관리</h1>
        {canRegisterSales && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            매출 등록
          </button>
        )}
      </div>

      {/* 매출 목록 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">매출번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">클라이언트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">계산서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">입금</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sale.saleNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.projectName}</div>
                      <div className="text-sm text-gray-500">예산: {sale.projectBudget?.toLocaleString()}원</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.clientName}</div>
                      <div className="text-sm text-gray-500">{sale.clientContact}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{sale.assignedEmployee?.name}</div>
                      <div className="text-sm text-gray-500">{sale.assignedEmployee?.company}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sale.invoiceIssued ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {sale.invoiceIssued ? '발행완료' : '미발행'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      sale.paymentCompleted ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {sale.paymentCompleted ? '입금완료' : '입금대기'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(sale.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* 발주요청 버튼 - 승인된 매출에서만 사용 가능 */}
                      {sale.status === '승인' && (
                        <button
                          onClick={() => createOrderRequest(sale)}
                          className="text-purple-600 hover:text-purple-900"
                          title="발주요청"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      
                      {/* 구매요청 생성 버튼 (기존) */}
                      {sale.status === '승인' && sale.campaignId && (
                        <button
                          onClick={() => createPurchaseRequest(sale)}
                          className="text-purple-600 hover:text-purple-900"
                          title="구매요청 생성"
                        >
                          <ShoppingCart size={16} />
                        </button>
                      )}
                      
                      {/* 문서 생성 버튼 */}
                      <button
                        onClick={() => generateSalesDocuments(sale)}
                        className="text-green-600 hover:text-green-900"
                        title="거래명세서/견적서 생성"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 개선된 매출 등록 모달 */}
      {isCreateModalOpen && (
        <EnhancedSaleModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSale}
          products={products}
          campaigns={campaigns}
          employees={employees}
          loggedInUser={loggedInUser}
          canRegisterForOthers={canRegisterForOthers}
          title="새 매출 등록"
        />
      )}
    </div>
  );
};

// 개선된 매출 등록 모달 컴포넌트
const EnhancedSaleModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  products, 
  campaigns, 
  employees,
  loggedInUser,
  canRegisterForOthers,
  sale = null, 
  title 
}) => {
  const [formData, setFormData] = useState({
    // 기존 필드들
    productId: sale?.productId || '',
    quantity: sale?.quantity || 1,
    actualCostPrice: sale?.actualCostPrice || '',
    actualSellingPrice: sale?.actualSellingPrice || '',
    clientName: sale?.clientName || '',
    clientContact: sale?.clientContact || '',
    clientEmail: sale?.clientEmail || '',
    
    // 새로 추가된 필드들
    projectName: sale?.projectName || '', // 프로젝트명
    projectBudget: sale?.projectBudget || '', // 프로젝트 예산
    projectCreatedAt: sale?.projectCreatedAt ? 
      new Date(sale.projectCreatedAt).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0], // 프로젝트 생성일자
    assignedEmployeeId: sale?.assignedEmployeeId || loggedInUser?.id, // 담당자 (기본값: 로그인 사용자)
    invoiceIssued: sale?.invoiceIssued || false, // 계산서 발행 여부
    paymentCompleted: sale?.paymentCompleted || false, // 입금완료 여부
    
    // 기존 필드들
    saleDate: sale?.saleDate ? 
      new Date(sale.saleDate).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0],
    contractStartDate: sale?.contractStartDate ? 
      new Date(sale.contractStartDate).toISOString().split('T')[0] : '',
    contractEndDate: sale?.contractEndDate ? 
      new Date(sale.contractEndDate).toISOString().split('T')[0] : '',
    campaignId: sale?.campaignId || '',
    memo: sale?.memo || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.productId || !formData.clientName || !formData.projectName) {
      showWarning('상품, 클라이언트명, 프로젝트명은 필수 입력 항목입니다.');
      return;
    }
    
    if (!formData.actualCostPrice || !formData.actualSellingPrice) {
      showWarning('원가와 판매가를 입력해주세요.');
      return;
    }

    if (parseFloat(formData.actualSellingPrice) <= parseFloat(formData.actualCostPrice)) {
      showWarning('판매가는 원가보다 높아야 합니다.');
      return;
    }

    const submitData = {
      ...formData,
      // 담당자 설정 로직
      assignedEmployeeId: canRegisterForOthers ? 
        formData.assignedEmployeeId : 
        loggedInUser?.id, // STAFF은 본인만 가능
      
      // 등록자 정보 (실제 등록한 사람)
      registeredBy: loggedInUser?.id,
      registeredByName: loggedInUser?.name
    };

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 프로젝트 정보 섹션 */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-medium mb-3">📋 프로젝트 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트명 *</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="프로젝트명을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 예산</label>
                <input
                  type="number"
                  value={formData.projectBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectBudget: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="예산을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 생성일자</label>
                <input
                  type="date"
                  value={formData.projectCreatedAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectCreatedAt: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              
              {canRegisterForOthers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">담당자 *</label>
                  <select
                    value={formData.assignedEmployeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedEmployeeId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">담당자를 선택하세요</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 상품 및 금액 정보 */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-medium mb-3">💰 상품 및 금액 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상품 선택 *</label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  <option value="">상품을 선택하세요</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      [{product.category}] {product.name} - {product.sellingPrice?.toLocaleString()}원
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수량 *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">실제 원가 *</label>
                <input
                  type="number"
                  value={formData.actualCostPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualCostPrice: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">실제 판매가 *</label>
                <input
                  type="number"
                  value={formData.actualSellingPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, actualSellingPrice: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* 계산서 및 입금 관리 */}
          <div className="border-b pb-4 mb-4">
            <h3 className="text-lg font-medium mb-3">📄 계산서 및 입금 관리</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="invoiceIssued"
                  checked={formData.invoiceIssued}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceIssued: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="invoiceIssued" className="text-sm font-medium text-gray-700">
                  계산서 발행 완료
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="paymentCompleted"
                  checked={formData.paymentCompleted}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentCompleted: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="paymentCompleted" className="text-sm font-medium text-gray-700">
                  입금 완료
                </label>
              </div>
            </div>
          </div>

          {/* 클라이언트 정보 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">클라이언트명 *</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
              <input
                type="text"
                value={formData.clientContact}
                onChange={(e) => setFormData(prev => ({ ...prev, clientContact: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {sale ? '수정' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesRegistrationEnhanced;