import React, { Suspense, lazy } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';

// 페이지 컴포넌트들을 lazy loading으로 최적화
// 우선순위별 그룹화: 핵심 페이지는 prefetch, 관리 페이지는 지연 로딩
export const Dashboard = lazy(() => 
  import(/* webpackChunkName: "dashboard" */ '../pages/Dashboard')
);
export const CampaignListPage = lazy(() => 
  import(/* webpackChunkName: "campaign-list" */ '../pages/CampaignListPage')
);
export const CampaignDetailPage = lazy(() => 
  import(/* webpackChunkName: "campaign-detail" */ '../pages/CampaignDetailPage')
);
export const CampaignManagement = lazy(() => 
  import(/* webpackChunkName: "campaign-mgmt" */ '../pages/CampaignManagement')
);

// 관리자 전용 페이지들 - 필요시에만 로딩
export const UserManagement = lazy(() => 
  import(/* webpackChunkName: "admin-user" */ '../pages/UserManagement')
);
export const ProductManagement = lazy(() => 
  import(/* webpackChunkName: "admin-product" */ '../pages/ProductManagement')
);
export const PurchaseRequestsPage = lazy(() => 
  import(/* webpackChunkName: "purchase-requests" */ '../pages/PurchaseRequestsPage')
);
export const OrderManagement = lazy(() => 
  import(/* webpackChunkName: "order-mgmt" */ '../pages/OrderManagement')
);
export const SalesRegistration = lazy(() => 
  import(/* webpackChunkName: "sales-simple" */ '../pages/SalesRegistration')
);
export const SalesRegistrationEnhanced = lazy(() => 
  import(/* webpackChunkName: "sales-enhanced" */ '../pages/SalesRegistrationEnhanced')
);
export const SystemSettings = lazy(() => 
  import(/* webpackChunkName: "system-settings" */ '../pages/SystemSettings')
);
export const MonthlyIncentives = lazy(() => 
  import(/* webpackChunkName: "incentives" */ '../pages/MonthlyIncentives')
);
export const CalendarPage = lazy(() => 
  import(/* webpackChunkName: "calendar" */ '../pages/CalendarPage')
);

// 사용자 역할별 메인 화면
export const AdminUI = lazy(() => 
  import(/* webpackChunkName: "admin-ui" */ '../pages/AdminUI')
);
export const ClientUI = lazy(() => 
  import(/* webpackChunkName: "client-ui" */ '../pages/ClientUI')
);

// HOC for lazy loading with consistent loading state
export const withLazyLoading = (Component, loadingText = '페이지를 불러오는 중...') => {
  return (props) => (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner 
          size="large" 
          color="blue" 
          text={loadingText}
          overlay={false}
        />
      </div>
    }>
      <Component {...props} />
    </Suspense>
  );
};

export default {
  Dashboard: withLazyLoading(Dashboard, '대시보드 로딩 중...'),
  CampaignListPage: withLazyLoading(CampaignListPage, '캠페인 목록 로딩 중...'),
  CampaignDetailPage: withLazyLoading(CampaignDetailPage, '캠페인 상세 로딩 중...'),
  CampaignManagement: withLazyLoading(CampaignManagement, '캠페인 관리 로딩 중...'),
  UserManagement: withLazyLoading(UserManagement, '사용자 관리 로딩 중...'),
  ProductManagement: withLazyLoading(ProductManagement, '상품 관리 로딩 중...'),
  PurchaseRequestsPage: withLazyLoading(PurchaseRequestsPage, '구매 요청 로딩 중...'),
  OrderManagement: withLazyLoading(OrderManagement, '발주 관리 로딩 중...'),
  SalesRegistration: withLazyLoading(SalesRegistration, '매출 등록 로딩 중...'),
  SalesRegistrationEnhanced: withLazyLoading(SalesRegistrationEnhanced, '매출 관리 로딩 중...'),
  SystemSettings: withLazyLoading(SystemSettings, '시스템 설정 로딩 중...'),
  MonthlyIncentives: withLazyLoading(MonthlyIncentives, '월간 인센티브 로딩 중...'),
  CalendarPage: withLazyLoading(CalendarPage, '캘린더 로딩 중...'),
  AdminUI: withLazyLoading(AdminUI, '관리자 화면 로딩 중...'),
  ClientUI: withLazyLoading(ClientUI, '클라이언트 화면 로딩 중...')
};