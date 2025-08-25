// src/pages/SalesRegistration.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp, DollarSign, Calendar, User, Package, FileText, Download, FileImage, ShoppingCart, Send } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useOrder } from '../contexts/OrderContext';
import ConfirmModal from '../components/ui/ConfirmModal';

const SalesRegistration = ({ loggedInUser }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const { createOrderRequest } = useOrder();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [employees, setEmployees] = useState([]); // 대행사 어드민용 직원 목록
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, sale: null });
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingSales: 0,
    approvedSales: 0,
    totalRevenue: 0,
    totalMargin: 0,
    totalIncentives: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    productCategory: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [incentiveSettings, setIncentiveSettings] = useState({
    showIncentiveToStaff: true,
    showIncentiveToAgencyAdmin: true
  });

  const fetchSales = async () => {
    if (!loggedInUser?.id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // 실제 캠페인 데이터에서 매출 정보 가져오기
      const campaignsResponse = await api.get('/api/campaigns');
      const campaignsData = campaignsResponse.data?.results || [];
      
      // 각 캠페인의 요약 정보를 가져와서 매출 데이터로 변환
      const salesPromises = campaignsData.map(async (campaign) => {
        try {
          const summaryResponse = await api.get(`/api/campaigns/${campaign.id}/financial_summary`);
          const summary = summaryResponse.data;
          
          return {
            id: campaign.id,
            saleNumber: `S${new Date().getFullYear()}-${String(campaign.id).padStart(3, '0')}`,
            projectName: campaign.name,
            projectBudget: summary.total_revenue || campaign.budget,
            clientName: campaign.client,
            clientContact: '담당자', // 기본값
            staffName: campaign.manager_name || campaign.User?.name || '담당자',
            agencyName: '대행사A', // 기본값
            sellingPrice: summary.total_revenue || parseInt(campaign.budget) || 0,
            costPrice: summary.total_cost || 0,
            marginRate: summary.margin_rate || 0,
            incentiveAmount: Math.round((summary.total_profit || 0) * 0.1), // 10% 인센티브
            status: campaign.invoice_issued ? (campaign.payment_completed ? '승인' : '검토중') : '등록',
            invoiceStatus: campaign.invoice_issued ? '발행완료' : '미발행',
            paymentStatus: campaign.payment_completed ? '입금완료' : '입금대기',
            registrationDate: campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
            category: '캠페인 매출',
            completion_rate: summary.completion_rate || 0,
            tasks_completed: summary.completed_tasks || 0,
            tasks_total: summary.total_tasks || 0
          };
        } catch (error) {
          console.error(`캠페인 ${campaign.id} 요약 정보 로드 실패:`, error);
          // 기본 정보만으로 매출 데이터 생성
          return {
            id: campaign.id,
            saleNumber: `S${new Date().getFullYear()}-${String(campaign.id).padStart(3, '0')}`,
            projectName: campaign.name,
            projectBudget: campaign.budget || 0,
            clientName: campaign.client,
            clientContact: '담당자',
            staffName: campaign.manager_name || campaign.User?.name || '담당자',
            agencyName: '대행사A',
            sellingPrice: parseInt(campaign.budget) || 0,
            costPrice: 0,
            marginRate: 0,
            incentiveAmount: 0,
            status: '등록',
            invoiceStatus: campaign.invoice_issued ? '발행완료' : '미발행',
            paymentStatus: campaign.payment_completed ? '입금완료' : '입금대기',
            registrationDate: campaign.created_at ? new Date(campaign.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
            category: '캠페인 매출',
            completion_rate: 0,
            tasks_completed: 0,
            tasks_total: 0
          };
        }
      });
      
      const salesData = await Promise.all(salesPromises);
      
      // API에서 매출 데이터 로드 (현재는 빈 배열)
      setSales(salesData);
      
      // 통계 계산
      const totalSales = salesData.length;
      const pendingSales = salesData.filter(s => s.status === '등록').length;
      const approvedSales = salesData.filter(s => s.status === '승인').length;
      const totalRevenue = salesData.reduce((sum, s) => sum + (s.sellingPrice || 0), 0);
      const totalCosts = salesData.reduce((sum, s) => sum + (s.costPrice || 0), 0);
      const totalMargin = totalRevenue - totalCosts;
      const totalIncentives = salesData.reduce((sum, s) => sum + (s.incentiveAmount || 0), 0);
      
      setStats({
        totalSales,
        pendingSales,
        approvedSales,
        totalRevenue,
        totalMargin,
        totalIncentives
      });
    } catch (error) {
      console.error('매출 목록 로딩 실패:', error);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // API에서 상품 데이터 로드 (현재는 빈 배열)
      const productsData = [];
      setProducts(productsData);
    } catch (error) {
      console.error('상품 목록 로딩 실패:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      // API에서 캠페인 데이터 로드 (현재는 빈 배열)
      const campaignsData = [];
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('캠페인 목록 로딩 실패:', error);
    }
  };

  // 통계는 fetchSales에서 계산되므로 별도 함수 불필요

  const fetchIncentiveSettings = async () => {
    try {
      // 더미 인센티브 설정
      setIncentiveSettings({
        showIncentiveToStaff: true,
        showIncentiveToAgencyAdmin: true
      });
    } catch (error) {
      console.error('인센티브 설정 로딩 실패:', error);
    }
  };

  // 직원 목록 조회 (대행사 어드민용)
  const fetchEmployees = async () => {
    if (loggedInUser?.role !== '대행사 어드민') return;
    
    try {
      // API에서 직원 데이터 로드 (현재는 빈 배열)
      const employeesData = [];
      setEmployees(employeesData);
    } catch (error) {
      console.error('직원 목록 로딩 실패:', error);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchCampaigns();
    fetchIncentiveSettings();
    fetchEmployees();
  }, [loggedInUser, filters]);

  const handleCreateSale = async (saleData) => {
    try {
      const response = await api.post('/api/sales', saleData, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser?.role || 'guest'
        }
      });
      
      const createdSale = response.data;
      
      fetchSales();
        setCreateModalOpen(false);
      
      // 매출 등록 성공 후 문서 생성 옵션 표시
      if (confirm('매출이 등록되었습니다!\n거래명세서/견적서를 생성하시겠습니까?')) {
        generateSalesDocuments(createdSale);
      }
    } catch (error) {
      console.error('매출 등록 실패:', error);
      showError(error.response?.data?.message || '매출 등록에 실패했습니다.');
    }
  };

  const handleUpdateSale = async (saleId, saleData) => {
    try {
      await api.put(`/api/sales/${saleId}`, saleData, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser?.role || 'guest'
        }
      });
      fetchSales();
        setEditModalOpen(false);
      setSelectedSale(null);
    } catch (error) {
      console.error('매출 수정 실패:', error);
      showError(error.response?.data?.message || '매출 수정에 실패했습니다.');
    }
  };

  const handleDeleteSale = async (saleId) => {
    if (!confirm('정말로 이 매출을 삭제하시겠습니까?')) return;
    
    try {
      await api.delete(`/api/sales/${saleId}`, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser?.role || 'guest'
        }
      });
      fetchSales();
      } catch (error) {
      console.error('매출 삭제 실패:', error);
      showError(error.response?.data?.message || '매출 삭제에 실패했습니다.');
    }
  };

  // 발주요청 생성 함수
  const handleCreateOrderRequest = async (sale) => {
    try {
      // 매출 정보를 기반으로 발주요청 데이터 생성
      const orderData = {
        title: `매출 발주: ${sale.productName || '업무 발주'}`,
        description: `매출 ID ${sale.id}에 대한 발주요청\n클라이언트: ${sale.clientName}\n금액: ${sale.actualSellingPrice?.toLocaleString()}원`,
        amount: sale.actualSellingPrice || 0,
        resourceType: '업무 발주',
        priority: '보통',
        dueDate: null,
        linkedCampaignId: sale.campaignId,
        linkedPostId: null,
        linkedSaleId: sale.id
      };

      await createOrderRequest(orderData);
      showSuccess('발주요청이 성공적으로 생성되었습니다! 발주관리 페이지에서 확인하세요.');
    } catch (error) {
      console.error('발주요청 생성 실패:', error);
      showError('발주요청 생성에 실패했습니다.');
    }
  };

  // 구매요청 생성 함수
  const createPurchaseRequest = async (sale) => {
    try {
      const description = prompt(`구매요청 설명을 입력하세요:`, `${sale.product?.name || '상품'} - ${sale.clientName} (매출번호: ${sale.saleNumber})`);
      if (!description) return;

      const response = await api.post(`/api/sales/${sale.id}/create-purchase-request`, {
        description,
        requestDate: new Date().toISOString()
      }, {
        params: {
          viewerId: loggedInUser.id,
          viewerRole: loggedInUser?.role || 'guest'
        }
      });

      showSuccess('구매요청이 성공적으로 생성되었습니다!');
      console.log('생성된 구매요청:', response.data);
    } catch (error) {
      console.error('구매요청 생성 실패:', error);
      showError(error.response?.data?.message || '구매요청 생성에 실패했습니다.');
    }
  };

  // 거래명세서/견적서 생성 함수
  const generateSalesDocuments = (sale) => {
    const product = products.find(p => p.id === sale.productId);
    
    // HTML 기반 문서 생성
    const documentHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>거래명세서/견적서</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company-info { text-align: right; margin-bottom: 30px; }
          .client-info { margin-bottom: 30px; }
          .details { border-collapse: collapse; width: 100%; margin-bottom: 30px; }
          .details th, .details td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .details th { background-color: #f5f5f5; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>거래명세서 / 견적서</h1>
          <p>Transaction Statement / Quotation</p>
        </div>
        
        <div class="company-info">
          <strong>발행회사: ${loggedInUser.company || 'BrandFlow'}</strong><br>
          담당자: ${loggedInUser.name}<br>
          발행일: ${new Date().toLocaleDateString('ko-KR')}
        </div>
        
        <div class="client-info">
          <strong>거래처: ${sale.clientName}</strong><br>
          계약기간: ${sale.contractStartDate || '-'} ~ ${sale.contractEndDate || '-'}
        </div>
        
        <table class="details">
          <thead>
            <tr>
              <th>상품명</th>
              <th>카테고리</th>
              <th>수량</th>
              <th>단가</th>
              <th>총액</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${product?.name || '상품명'}</td>
              <td>${product?.category || '-'}</td>
              <td>${sale.quantity}${product?.unit || '건'}</td>
              <td>${Number(sale.actualSellingPrice).toLocaleString()}원</td>
              <td>${(Number(sale.actualSellingPrice) * Number(sale.quantity)).toLocaleString()}원</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total">
          <p>총 공급가액: <span style="color: #2563eb;">${(Number(sale.actualSellingPrice) * Number(sale.quantity)).toLocaleString()}원</span></p>
        </div>
        
        <div class="footer">
          <p><strong>특이사항:</strong> ${sale.memo || '없음'}</p>
          <p style="color: #666; font-size: 12px;">
            본 문서는 BrandFlow 시스템에서 자동 생성되었습니다.<br>
            문의사항이 있으시면 담당자에게 연락 바랍니다.
          </p>
        </div>
      </body>
      </html>
    `;
    
    // 새 창에서 문서 열기
    const newWindow = window.open('', '_blank');
    newWindow.document.write(documentHTML);
    newWindow.document.close();
    
    // 인쇄 및 저장 옵션 제공
    setTimeout(() => {
      if (confirm('문서를 인쇄하시겠습니까?\n인쇄 후 PDF로 저장하거나 이미지로 캡처할 수 있습니다.')) {
        newWindow.print();
      }
    }, 500);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      '등록': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      '검토중': { bg: 'bg-blue-100', text: 'text-blue-800' },
      '승인': { bg: 'bg-green-100', text: 'text-green-800' },
      '거절': { bg: 'bg-red-100', text: 'text-red-800' },
      '정산완료': { bg: 'bg-purple-100', text: 'text-purple-800' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`px-2 py-1 ${config.bg} ${config.text} rounded-full text-xs`}>
        {status}
      </span>
    );
  };

  const canRegisterSales = ['직원', '대행사 어드민'].includes(loggedInUser?.role);
  const canManageSales = ['슈퍼 어드민', '대행사 어드민'].includes(loggedInUser?.role);
  const canRegisterForOthers = loggedInUser?.role === '대행사 어드민'; // 대행사 어드민만 다른 직원 대신 등록 가능
  
  // 인센티브 표시 여부 확인
  const shouldShowIncentive = () => {
    if (loggedInUser?.role === '슈퍼 어드민') return true;
    if (loggedInUser?.role === '대행사 어드민') return incentiveSettings.showIncentiveToAgencyAdmin;
    if (loggedInUser?.role === '직원') return incentiveSettings.showIncentiveToStaff;
    return false;
  };

  if (isLoading) {
    return <div className="p-8 text-center">매출 목록을 불러오는 중...</div>;
  }

  if (!loggedInUser) {
    return <div className="p-8 text-center text-red-600">사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.</div>;
  }

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

      {/* 통계 카드 */}
      <div className={shouldShowIncentive() 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
      }>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">대기중</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">승인됨</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.approvedSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 매출액</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalRevenue?.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 마진</p>
              <p className="text-lg font-semibold text-gray-900">{stats.totalMargin?.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {shouldShowIncentive() && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <User className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 인센티브</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalIncentives?.toLocaleString()}원</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap gap-4">
          {/* 년도/월 필터 */}
          <div className="flex gap-2 items-center">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>{year}년</option>
                );
              })}
            </select>
            
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value={0}>전체 월</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}월</option>
              ))}
            </select>
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">전체 상태</option>
            <option value="등록">등록</option>
            <option value="검토중">검토중</option>
            <option value="승인">승인</option>
            <option value="거절">거절</option>
            <option value="정산완료">정산완료</option>
          </select>
          
          <select
            value={filters.productCategory}
            onChange={(e) => setFilters(prev => ({ ...prev, productCategory: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">전체 카테고리</option>
            <option value="SNS 광고">SNS 광고</option>
            <option value="검색 광고">검색 광고</option>
            <option value="크리에이티브">크리에이티브</option>
            <option value="웹사이트">웹사이트</option>
            <option value="브랜딩">브랜딩</option>
            <option value="컨설팅">컨설팅</option>
            <option value="기타">기타</option>
          </select>
        </div>
      </div>

      {/* 매출 목록 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매출번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로젝트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">클라이언트</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계산서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">입금</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">판매금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마진율</th>
                {shouldShowIncentive() && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">인센티브</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
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
                      <div className="text-sm font-medium text-gray-900">{sale.projectName || sale.product?.name}</div>
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
                      <div className="text-sm font-medium text-gray-900">{sale.staffName || sale.assignedEmployee?.name || sale.salesPersonName}</div>
                      <div className="text-sm text-gray-500">{sale.agencyName || sale.assignedEmployee?.company}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(sale.sellingPrice || sale.totalSales)?.toLocaleString()}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-600">
                      {sale.marginRate}%
                    </span>
                  </td>
                  {shouldShowIncentive() && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.incentiveAmount?.toLocaleString()}원
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(sale.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.registrationDate || new Date(sale.saleDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {/* 발주요청 버튼 - 승인된 매출에서만 사용 가능 */}
                      {sale.status === '승인' && (
                        <button
                          onClick={() => handleCreateOrderRequest(sale)}
                          className="text-purple-600 hover:text-purple-900"
                          title="발주요청"
                        >
                          <Send size={16} />
                        </button>
                      )}
                      
                      {/* 구매요청 생성 버튼 (승인된 매출, 캠페인 연결된 경우만) */}
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
                      
                      {(sale.status === '등록' && sale.salesPersonId === loggedInUser?.id) || canManageSales ? (
                        <button
                          onClick={() => {
                            setSelectedSale(sale);
                            setEditModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="수정"
                        >
                          <Edit size={16} />
                        </button>
                      ) : null}
                      
                      {(sale.status === '등록' && sale.salesPersonId === loggedInUser?.id) || canManageSales ? (
                        <button
                          onClick={() => handleDeleteSale(sale.id)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sales.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            등록된 매출이 없습니다.
          </div>
        )}
      </div>

      {/* 매출 등록 모달 */}
      {isCreateModalOpen && (
        <SaleModal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSale}
          products={products}
          campaigns={campaigns}
          title="새 매출 등록"
        />
      )}

      {/* 매출 수정 모달 */}
      {isEditModalOpen && selectedSale && (
        <SaleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSale(null);
          }}
          onSubmit={(data) => handleUpdateSale(selectedSale.id, data)}
          products={products}
          campaigns={campaigns}
          sale={selectedSale}
          title="매출 수정"
          canChangeStatus={canManageSales}
        />
      )}

    </div>
  );
};

// 매출 모달 컴포넌트
const SaleModal = ({ isOpen, onClose, onSubmit, products, campaigns, sale = null, title, canChangeStatus = false }) => {
  const [formData, setFormData] = useState({
    productId: sale?.productId || '',
    quantity: sale?.quantity || 1,
    actualCostPrice: sale?.actualCostPrice || '',
    actualSellingPrice: sale?.actualSellingPrice || '',
    clientName: sale?.clientName || '',
    clientContact: sale?.clientContact || '',
    clientEmail: sale?.clientEmail || '',
    saleDate: sale?.saleDate ? new Date(sale.saleDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    contractStartDate: sale?.contractStartDate ? new Date(sale.contractStartDate).toISOString().split('T')[0] : '',
    contractEndDate: sale?.contractEndDate ? new Date(sale.contractEndDate).toISOString().split('T')[0] : '',
    campaignId: sale?.campaignId || '',
    memo: sale?.memo || '',
    status: sale?.status || '등록',
    reviewComment: sale?.reviewComment || ''
  });

  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (formData.productId) {
      const product = products.find(p => p.id === parseInt(formData.productId));
      setSelectedProduct(product);
      if (product && !sale) {
        setFormData(prev => ({
          ...prev,
          actualCostPrice: product.costPrice,
          actualSellingPrice: product.sellingPrice
        }));
      }
    }
  }, [formData.productId, products, sale]);

  const calculateMargin = () => {
    const cost = parseFloat(formData.actualCostPrice) || 0;
    const selling = parseFloat(formData.actualSellingPrice) || 0;
    if (cost === 0) return 0;
    return (((selling - cost) / cost) * 100).toFixed(2);
  };

  const calculateIncentive = () => {
    const cost = parseFloat(formData.actualCostPrice) || 0;
    const selling = parseFloat(formData.actualSellingPrice) || 0;
    const quantity = parseInt(formData.quantity) || 0;
    const margin = (selling - cost) * quantity;
    const incentiveRate = selectedProduct?.incentiveRate || 0;
    return Math.round(margin * incentiveRate / 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.clientName || !formData.actualCostPrice || !formData.actualSellingPrice) {
      showWarning('필수 필드를 모두 입력해주세요.');
      return;
    }

    if (parseFloat(formData.actualSellingPrice) <= parseFloat(formData.actualCostPrice)) {
      showWarning('판매가는 원가보다 높아야 합니다.');
      return;
    }

    const submitData = { ...formData };
    if (submitData.campaignId === '') delete submitData.campaignId;
    if (submitData.contractStartDate === '') delete submitData.contractStartDate;
    if (submitData.contractEndDate === '') delete submitData.contractEndDate;

    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                min={selectedProduct?.minQuantity || 1}
                max={selectedProduct?.maxQuantity || undefined}
                required
              />
              {selectedProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  최소: {selectedProduct.minQuantity}{selectedProduct.unit}
                  {selectedProduct.maxQuantity && `, 최대: ${selectedProduct.maxQuantity}${selectedProduct.unit}`}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          {/* 계산된 정보 표시 */}
          {formData.actualCostPrice && formData.actualSellingPrice && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className={`grid grid-cols-${shouldShowIncentive() ? '3' : '2'} gap-4 text-sm`}>
                <div>
                  <span className="font-medium">마진율:</span>
                  <span className="ml-2 text-green-600">{calculateMargin()}%</span>
                </div>
                <div>
                  <span className="font-medium">총 판매액:</span>
                  <span className="ml-2">{(parseFloat(formData.actualSellingPrice) * parseInt(formData.quantity || 1)).toLocaleString()}원</span>
                </div>
                {shouldShowIncentive() && (
                  <div>
                    <span className="font-medium">예상 인센티브:</span>
                    <span className="ml-2 text-blue-600">{calculateIncentive().toLocaleString()}원</span>
                  </div>
                )}
              </div>
            </div>
          )}

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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">매출 발생일</label>
              <input
                type="date"
                value={formData.saleDate}
                onChange={(e) => setFormData(prev => ({ ...prev, saleDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">계약 시작일</label>
              <input
                type="date"
                value={formData.contractStartDate}
                onChange={(e) => setFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">계약 종료일</label>
              <input
                type="date"
                value={formData.contractEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연관 캠페인</label>
            <select
              value={formData.campaignId}
              onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">선택 안함</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
            />
          </div>

          {canChangeStatus && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="등록">등록</option>
                  <option value="검토중">검토중</option>
                  <option value="승인">승인</option>
                  <option value="거절">거절</option>
                  <option value="정산완료">정산완료</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">검토 의견</label>
                <textarea
                  value={formData.reviewComment}
                  onChange={(e) => setFormData(prev => ({ ...prev, reviewComment: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
            </div>
          )}

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

export default SalesRegistration;