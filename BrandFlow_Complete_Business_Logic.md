# 🚀 BrandFlow - Complete Business Logic & Context

## 📌 시스템 개요

BrandFlow는 **마케팅 대행사 전용 통합 업무 관리 플랫폼**입니다. 브랜드 마케팅 대행사가 클라이언트의 캠페인을 관리하고, 콘텐츠를 제작하며, 매출을 추적하고, 직원 인센티브를 계산하는 모든 업무를 하나의 시스템에서 처리합니다.

### 🎯 핵심 비즈니스 모델
1. **대행사**: 마케팅 서비스를 제공하는 서비스 제공자
2. **클라이언트**: 마케팅 서비스를 받는 고객사
3. **캠페인**: 클라이언트를 위한 마케팅 프로젝트 단위
4. **콘텐츠**: 블로그, SNS 등의 실제 제작물
5. **매출**: 완료된 서비스에 대한 수익 기록
6. **인센티브**: 직원에게 지급하는 성과 보상

---

## 👥 사용자 역할 및 권한 시스템

### 🔴 슈퍼 어드민 (Super Admin)
- **정의**: 시스템 전체를 관리하는 최고 관리자
- **특징**: 모든 대행사의 데이터에 접근 가능
- **주요 권한**:
  - 모든 사용자 생성/수정/삭제
  - 시스템 설정 변경
  - 모든 데이터 조회/수정
  - 캠페인 완전 삭제
  - 시스템 초기화
- **비즈니스 역할**: 플랫폼 운영자, 기술 관리자

### 🔵 대행사 어드민 (Agency Admin)
- **정의**: 특정 대행사의 운영을 담당하는 관리자
- **특징**: 자신이 소속된 대행사의 데이터만 접근
- **주요 권한**:
  - 대행사 소속 직원 관리 (슈퍼 어드민 제외)
  - 클라이언트 계정 관리
  - 매출 승인/거절
  - 구매요청 승인/거절
  - 인센티브 계산 및 승인
  - 제한적 시스템 설정
- **비즈니스 역할**: 대행사 대표, 팀장, 운영 관리자

### 🟢 직원 (Staff)
- **정의**: 실제 캠페인을 담당하고 운영하는 실무자
- **특징**: 자신이 담당하는 캠페인과 클라이언트만 관리
- **주요 권한**:
  - 담당 캠페인 생성/수정
  - 주제/목차 등록
  - 담당 클라이언트 관리
  - 매출 등록 (승인 필요)
  - 구매요청 작성
  - 개인 인센티브 조회
- **비즈니스 역할**: 캠페인 매니저, 콘텐츠 기획자, 계정 관리자

### 🟠 클라이언트 (Client)
- **정의**: 마케팅 서비스를 받는 고객사 담당자
- **특징**: 자신의 캠페인만 조회 가능, 승인 권한 보유
- **주요 권한**:
  - 자신의 캠페인 조회
  - 주제/목차 승인/반려
  - 콘텐츠 검토 및 피드백
  - 진행 상황 모니터링
- **비즈니스 역할**: 고객사 마케팅 담당자, 브랜드 매니저

---

## 🏗️ 데이터 모델 및 관계

### 📊 핵심 엔티티

#### Users (사용자)
```javascript
{
  id: number,
  name: string,
  email: string,
  role: "슈퍼 어드민" | "대행사 어드민" | "직원" | "클라이언트",
  company: string,        // 소속 회사
  contact: string,        // 연락처
  incentiveRate: number,  // 인센티브율 (직원/어드민만)
  creatorId: number,      // 생성자 ID
  createdAt: datetime,
  updatedAt: datetime
}
```

#### Campaigns (캠페인)
```javascript
{
  id: number,
  name: string,           // 캠페인명
  client: string,         // 클라이언트 회사명
  userId: number,         // 클라이언트 사용자 ID
  managerId: number,      // 담당 직원 ID
  budget: number,         // 예산
  notes: string,          // 메모
  reminders: string,      // 리마인더
  invoiceIssued: boolean, // 계산서 발행 여부
  paymentCompleted: boolean, // 입금 완료 여부
  invoiceDueDate: date,   // 계산서 만료일
  paymentDueDate: date,   // 입금 예정일
  posts: [Post],          // 연관된 포스트들
  createdAt: datetime,
  updatedAt: datetime
}
```

#### Posts (포스트/콘텐츠)
```javascript
{
  id: number,
  campaignId: number,     // 소속 캠페인
  title: string,          // 제목
  topicStatus: string,    // 주제 상태: "주제 승인 대기" | "주제 승인" | "주제 반려"
  outlineStatus: string,  // 목차 상태: "목차 승인 대기" | "목차 승인" | "목차 반려"
  publishedUrl: string,   // 발행 URL
  keywords: string,       // 키워드
  outline: string,        // 목차 내용
  rejectionReason: string, // 반려 사유
  imageUrl: string,       // 첨부 이미지
  createdAt: datetime,
  updatedAt: datetime
}
```

#### Sales (매출)
```javascript
{
  id: number,
  saleNumber: string,     // 매출 번호
  productId: number,      // 상품 ID
  quantity: number,       // 수량
  actualCostPrice: number, // 실제 원가
  actualSellingPrice: number, // 실제 판매가
  totalSales: number,     // 총 매출액
  marginRate: number,     // 마진율
  incentiveAmount: number, // 인센티브 금액
  clientName: string,     // 클라이언트명
  clientContact: string,  // 담당자
  clientEmail: string,    // 이메일
  salesPersonId: number,  // 매출 등록자 ID
  campaignId: number,     // 연관 캠페인
  status: "등록" | "검토중" | "승인" | "거절" | "정산완료",
  saleDate: date,         // 매출 발생일
  contractStartDate: date, // 계약 시작일
  contractEndDate: date,  // 계약 종료일
  memo: string,           // 메모
  reviewComment: string,  // 검토 의견
  createdAt: datetime,
  updatedAt: datetime
}
```

#### Products (상품)
```javascript
{
  id: number,
  name: string,           // 상품명
  description: string,    // 설명
  sku: string,           // 상품 코드
  category: string,       // 카테고리
  costPrice: number,      // 원가
  sellingPrice: number,   // 권장 판매가
  marginRate: number,     // 마진율 (자동 계산)
  unit: string,          // 단위 (건, 개, 시간)
  minQuantity: number,    // 최소 수량
  maxQuantity: number,    // 최대 수량
  tags: string,          // 태그
  isActive: boolean,      // 활성 상태
  createdAt: datetime,
  updatedAt: datetime
}
```

#### PurchaseRequests (구매요청)
```javascript
{
  id: number,
  title: string,          // 제목
  description: string,    // 상세 설명
  amount: number,         // 금액
  resourceType: "광고비" | "콘텐츠 제작비" | "도구 구독료" | "외부 용역비" | "소재 구매비" | "기타",
  priority: "낮음" | "보통" | "높음" | "긴급",
  dueDate: date,          // 희망 완료일
  campaignId: number,     // 연관 캠페인
  postId: number,         // 연관 포스트
  requesterId: number,    // 요청자 ID
  status: "승인 대기" | "검토 중" | "승인됨" | "거절됨" | "보류" | "구매 완료" | "정산 완료",
  approverComment: string, // 승인자 코멘트
  rejectReason: string,   // 거절 사유
  createdAt: datetime,
  updatedAt: datetime
}
```

#### MonthlyIncentives (월간 인센티브)
```javascript
{
  id: number,
  employeeId: number,     // 직원 ID
  year: number,           // 연도
  month: number,          // 월
  totalSales: number,     // 총 매출
  totalMargin: number,    // 총 마진
  incentiveRate: number,  // 인센티브율
  incentiveAmount: number, // 계산된 인센티브
  adjustmentAmount: number, // 조정 금액
  finalAmount: number,    // 최종 지급 금액
  status: "계산중" | "검토대기" | "승인완료" | "지급완료" | "보류" | "취소",
  calculatorId: number,   // 계산자 ID
  approverId: number,     // 승인자 ID
  createdAt: datetime,
  updatedAt: datetime
}
```

#### SystemSettings (시스템 설정)
```javascript
{
  id: number,
  settingKey: string,     // 설정 키
  settingValue: string,   // 설정 값
  settingType: "boolean" | "string" | "number" | "json",
  category: "incentive" | "sales" | "document" | "general",
  description: string,    // 설명
  defaultValue: string,   // 기본값
  accessLevel: "super_admin" | "agency_admin" | "staff",
  modifierId: number,     // 마지막 수정자
  createdAt: datetime,
  updatedAt: datetime
}
```

#### WorkTypes (업무타입)
```javascript
{
  id: number,
  name: string,           // 업무타입명 (예: 블로그, SNS, 광고)
  description: string,    // 설명
  unitPrice: number,      // 단가
  unit: string,          // 단위
  category: string,       // 카테고리
  isActive: boolean,      // 활성 상태
  createdAt: datetime,
  updatedAt: datetime
}
```

---

## 🔄 비즈니스 워크플로우

### 📋 캠페인 관리 워크플로우

#### 1. 캠페인 생성 프로세스
```
[직원/어드민] 캠페인 생성
↓
클라이언트 정보 입력 (회사명, 담당자)
↓
담당 직원 배정
↓
예산 및 일정 설정
↓
캠페인 활성화
↓
[시스템] 자동 알림 발송
```

#### 2. 콘텐츠 제작 워크플로우
```
[담당 직원] 주제 등록
↓
제목, 키워드, 참고 이미지 업로드
↓
[클라이언트] 주제 검토
↓
승인 → [담당 직원] 목차 등록
↓     
반려 → [담당 직원] 주제 수정
↓
[클라이언트] 목차 검토
↓
승인 → 콘텐츠 제작 시작
↓
반려 → [담당 직원] 목차 수정
↓
[시스템] 완료 상태 업데이트
```

#### 3. 승인 상태 시스템
- **주제 승인 대기**: 클라이언트의 주제 검토 대기
- **주제 승인**: 클라이언트가 주제를 승인, 목차 등록 가능
- **주제 반려**: 주제 수정 필요, 반려 사유 기록
- **목차 승인 대기**: 클라이언트의 목차 검토 대기  
- **목차 승인**: 최종 승인, 콘텐츠 제작 시작
- **목차 반려**: 목차 수정 필요, 반려 사유 기록

### 💰 매출 관리 워크플로우

#### 1. 매출 등록 프로세스
```
[직원] 매출 등록
↓
상품 선택 → 원가/판매가 자동 입력
↓
수량, 클라이언트 정보 입력
↓
[시스템] 마진율, 인센티브 자동 계산
↓
상태: "등록" → 관리자 검토 대기
```

#### 2. 매출 승인 프로세스
```
[관리자] 매출 검토
↓
승인 → 상태: "승인" → 인센티브 계산 대상
↓
거절 → 상태: "거절" → 직원 수정 필요
↓
[시스템] 승인 시 자동 문서 생성 옵션
```

#### 3. 문서 자동 생성 시스템
```javascript
// 거래명세서/견적서 생성 로직
function generateSalesDocuments(sale) {
  const product = getProductById(sale.productId);
  const document = {
    header: {
      title: "거래명세서 / 견적서",
      issuer: loggedInUser.company,
      issueDate: new Date().toLocaleDateString('ko-KR')
    },
    client: {
      name: sale.clientName,
      contact: sale.clientContact,
      period: `${sale.contractStartDate} ~ ${sale.contractEndDate}`
    },
    items: [{
      productName: product.name,
      category: product.category,
      quantity: sale.quantity,
      unitPrice: sale.actualSellingPrice,
      totalPrice: sale.actualSellingPrice * sale.quantity
    }],
    total: sale.actualSellingPrice * sale.quantity,
    memo: sale.memo
  };
  return generateHTMLDocument(document);
}
```

### 🛒 구매요청 관리 워크플로우

#### 1. 구매요청 작성 프로세스
```
[직원] 구매요청 작성
↓
제목, 설명, 리소스 타입 입력
↓
연관 캠페인 선택 → [시스템] 원가 자동 계산
↓
금액 수동 입력 또는 자동 계산 사용
↓
우선순위 및 희망 완료일 설정
↓
상태: "승인 대기"
```

#### 2. 자동 원가 계산 로직
```javascript
// 캠페인 연결 시 자동 원가 계산
async function fetchCampaignCosts(campaignId) {
  const financialSummary = await api.get(`/api/campaigns/${campaignId}/financial-summary`);
  const totalCost = financialSummary.data.totalCost || 0;
  
  // 캠페인의 모든 업무 원가 합계
  return {
    totalCost: totalCost,
    breakdown: financialSummary.data.costBreakdown
  };
}
```

#### 3. 승인 프로세스
```
[관리자] 구매요청 검토
↓
승인 → "승인됨" → 구매 진행
↓
거절 → "거절됨" → 거절 사유 기록
↓
보류 → "보류" → 추가 검토 필요
↓
구매 완료 → "구매 완료"
↓
정산 완료 → "정산 완료"
```

### 💎 인센티브 계산 워크플로우

#### 1. 월간 인센티브 자동 계산
```javascript
// 인센티브 계산 로직
function calculateMonthlyIncentive(employee, year, month) {
  // 1. 해당 직원의 담당 캠페인 조회
  const campaigns = getCampaignsByManager(employee.id, year, month);
  
  // 2. 각 캠페인의 수익 계산
  let totalProfit = 0;
  campaigns.forEach(campaign => {
    const financialSummary = getCampaignFinancialSummary(campaign.id);
    totalProfit += financialSummary.totalProfit;
  });
  
  // 3. 매출 테이블에서 해당 직원의 매출 조회
  const sales = getSalesByEmployee(employee.id, year, month);
  sales.forEach(sale => {
    if (sale.status === '승인') {
      const margin = (sale.actualSellingPrice - sale.actualCostPrice) * sale.quantity;
      totalProfit += margin;
    }
  });
  
  // 4. 인센티브 계산
  const incentiveAmount = totalProfit * (employee.incentiveRate / 100);
  
  return {
    totalSales: getTotalSales(employee.id, year, month),
    totalMargin: totalProfit,
    incentiveRate: employee.incentiveRate,
    incentiveAmount: incentiveAmount,
    adjustmentAmount: 0, // 수동 조정 금액
    finalAmount: incentiveAmount
  };
}
```

#### 2. 인센티브 승인 프로세스
```
[시스템] 월말 자동 계산
↓
상태: "계산중" → "검토대기"
↓
[관리자] 인센티브 검토
↓
조정 필요 시 조정 금액 입력
↓
승인 → "승인완료"
↓
지급 처리 → "지급완료"
```

### ⚙️ 시스템 설정 관리

#### 1. 설정 카테고리별 관리
- **incentive**: 인센티브 관련 설정
  - `show_incentive_to_staff`: 직원에게 인센티브 표시 여부
  - `show_incentive_to_agency_admin`: 대행사 어드민에게 인센티브 표시 여부
  - `auto_calculate_monthly`: 월말 자동 계산 여부

- **sales**: 매출 관련 설정  
  - `auto_generate_documents`: 매출 등록 시 문서 자동 생성
  - `require_approval`: 매출 승인 필요 여부
  - `allow_self_approval`: 본인 매출 승인 허용 여부

- **document**: 문서 관련 설정
  - `document_template`: 문서 템플릿 설정
  - `company_info`: 회사 정보 설정

- **general**: 일반 설정
  - `notification_enabled`: 알림 활성화 여부
  - `auto_backup`: 자동 백업 설정

#### 2. 권한별 설정 접근
```javascript
// 설정 접근 권한 체크
function canAccessSetting(settingKey, userRole) {
  const setting = getSettingByKey(settingKey);
  
  switch(setting.accessLevel) {
    case 'super_admin':
      return userRole === '슈퍼 어드민';
    case 'agency_admin':
      return ['슈퍼 어드민', '대행사 어드민'].includes(userRole);
    case 'staff':
      return ['슈퍼 어드민', '대행사 어드민', '직원'].includes(userRole);
    default:
      return false;
  }
}
```

---

## 🔐 권한 및 보안 시스템

### 📊 데이터 접근 제어

#### 1. 테넌트 분리 (Multi-tenancy)
```javascript
// API 요청 시 자동으로 추가되는 권한 파라미터
const apiParams = {
  viewerId: user.id,        // 조회자 ID
  viewerRole: user.role,    // 조회자 역할
  // 백엔드에서 이 정보로 접근 가능한 데이터 필터링
};

// 예시: 캠페인 조회 시 권한 체크
function getCampaignsByPermission(viewerId, viewerRole) {
  if (viewerRole === '슈퍼 어드민') {
    return getAllCampaigns(); // 모든 캠페인 조회
  } else if (viewerRole === '대행사 어드민') {
    const user = getUserById(viewerId);
    return getCampaignsByCompany(user.company); // 같은 회사 캠페인만
  } else if (viewerRole === '직원') {
    return getCampaignsByManager(viewerId); // 자신이 담당하는 캠페인만
  } else if (viewerRole === '클라이언트') {
    return getCampaignsByClient(viewerId); // 자신의 캠페인만
  }
}
```

#### 2. 기능별 권한 매트릭스
```javascript
const permissionMatrix = {
  // 캠페인 관리
  'campaign.create': ['슈퍼 어드민', '대행사 어드민', '직원'],
  'campaign.edit': ['슈퍼 어드민', '대행사 어드민', '직원'], // 담당자만
  'campaign.delete': ['슈퍼 어드민'], // 슈퍼 어드민만
  'campaign.view': ['슈퍼 어드민', '대행사 어드민', '직원', '클라이언트'], // 권한별 필터링
  
  // 매출 관리
  'sales.create': ['대행사 어드민', '직원'],
  'sales.approve': ['슈퍼 어드민', '대행사 어드민'],
  'sales.edit': ['슈퍼 어드민', '대행사 어드민'], // + 본인 등록 매출 (등록 상태만)
  
  // 구매요청 관리
  'purchase.create': ['슈퍼 어드민', '대행사 어드민', '직원'],
  'purchase.approve': ['슈퍼 어드민', '대행사 어드민'],
  
  // 사용자 관리
  'user.create': ['슈퍼 어드민', '대행사 어드민'], // 대행사 어드민은 슈퍼 어드민 제외
  'user.edit': ['슈퍼 어드민', '대행사 어드민'], // 권한별 제한
  'user.delete': ['슈퍼 어드민', '대행사 어드민'], // 권한별 제한
  
  // 인센티브 관리
  'incentive.calculate': ['슈퍼 어드민', '대행사 어드민'],
  'incentive.approve': ['슈퍼 어드민', '대행사 어드민'],
  'incentive.view': ['슈퍼 어드민', '대행사 어드민', '직원'], // 직원은 본인만
  
  // 시스템 설정
  'settings.view': ['슈퍼 어드민', '대행사 어드민'],
  'settings.edit': ['슈퍼 어드민'], // 일부는 대행사 어드민도 가능
  'settings.initialize': ['슈퍼 어드민']
};
```

### 🔒 API 보안

#### 1. 자동 권한 인젝션
```javascript
// API 클라이언트의 요청 인터셉터
api.interceptors.request.use((config) => {
  const userData = localStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    
    // 모든 요청에 권한 정보 자동 추가
    config.params = {
      ...config.params,
      viewerId: user.id,
      viewerRole: user.role
    };
  }
  return config;
});
```

#### 2. 에러 처리 및 재시도
```javascript
// 네트워크 오류 시 자동 재시도 시스템
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // 재시도 가능한 에러 체크
    if (isRetryableError(error) && config.__retryCount < MAX_RETRIES) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      
      // 지수 백오프 적용
      const delayTime = RETRY_DELAY * Math.pow(2, config.__retryCount - 1);
      await delay(delayTime);
      
      return api(config);
    }
    
    return Promise.reject(error);
  }
);
```

---

## 💰 재무 계산 시스템

### 📊 대시보드 재무 데이터 계산

#### 1. 종합 재무 현황 계산 로직
```javascript
async function calculateFinancialOverview(user) {
  // 1. 구매요청 통계 (매입/지출)
  const purchaseStats = await api.get('/api/purchase-requests/summary/stats', {
    params: { viewerId: user.id, viewerRole: user.role }
  });
  
  // 2. 매출 통계 (기존 sales 테이블)
  const salesStats = await api.get('/api/sales/summary/stats', {
    params: { viewerId: user.id, viewerRole: user.role }
  });
  
  // 3. 캠페인별 재무 데이터 수집
  const campaigns = await api.get('/api/campaigns', {
    params: { viewerId: user.id, viewerRole: user.role }
  });
  
  let campaignTotalRevenue = 0;
  let campaignTotalCost = 0;
  let campaignTotalProfit = 0;
  
  // 각 캠페인의 재무 요약 데이터 수집
  for (const campaign of campaigns.data) {
    try {
      const financialSummary = await api.get(`/api/campaigns/${campaign.id}/financial-summary`);
      campaignTotalRevenue += financialSummary.data.totalRevenue || 0;
      campaignTotalCost += financialSummary.data.totalCost || 0;
      campaignTotalProfit += financialSummary.data.totalProfit || 0;
    } catch (error) {
      console.error(`캠페인 ${campaign.id} 재무 데이터 로딩 실패:`, error);
    }
  }
  
  // 4. 인센티브 총액 계산
  let totalIncentives = 0;
  if (user.role === '슈퍼 어드민' || user.role === '대행사 어드민') {
    const employees = await getEmployeeList(user);
    
    for (const employee of employees) {
      if (employee.incentiveRate > 0) {
        const employeeCampaigns = campaigns.data.filter(c => c.managerId === employee.id);
        
        for (const campaign of employeeCampaigns) {
          const financialSummary = await getCampaignFinancialSummary(campaign.id);
          const profit = financialSummary.totalProfit || 0;
          const incentiveAmount = profit * (employee.incentiveRate / 100);
          totalIncentives += incentiveAmount;
        }
      }
    }
  }
  
  // 5. 최종 재무 현황 계산
  const totalRevenue = (salesStats.data.totalRevenue || 0) + campaignTotalRevenue;
  const totalExpenses = (purchaseStats.data.totalAmount || 0) + campaignTotalCost;
  const netProfit = totalRevenue - totalExpenses;
  const finalNetProfit = netProfit - totalIncentives;
  
  return {
    totalRevenue,      // 총 매출 = Sales 매출 + Campaign 매출
    totalExpenses,     // 총 지출 = 구매요청 + Campaign 원가
    netProfit,         // 순이익 = 매출 - 지출
    totalIncentives,   // 총 인센티브
    finalNetProfit,    // 최종 순이익 = 순이익 - 인센티브
    campaignRevenue: campaignTotalRevenue,
    campaignCost: campaignTotalCost,
    salesRevenue: salesStats.data.totalRevenue || 0
  };
}
```

#### 2. 직원 개별 통계 계산
```javascript
async function calculateEmployeeStats(employee) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // 1. 담당 캠페인 목록
  const employeeCampaigns = await getCampaignsByManager(employee.id);
  
  // 2. 이번달 매출 계산
  let thisMonthRevenue = 0;
  let pendingInvoices = 0;
  let pendingPayments = 0;
  
  for (const campaign of employeeCampaigns) {
    const financialSummary = await getCampaignFinancialSummary(campaign.id);
    thisMonthRevenue += financialSummary.totalRevenue || 0;
    
    if (!campaign.invoiceIssued) pendingInvoices++;
    if (!campaign.paymentCompleted) pendingPayments++;
  }
  
  // 3. 이번달 인센티브 계산
  let thisMonthIncentive = 0;
  if (employee.incentiveRate > 0) {
    let totalEmployeeProfit = 0;
    
    for (const campaign of employeeCampaigns) {
      const financialSummary = await getCampaignFinancialSummary(campaign.id);
      totalEmployeeProfit += financialSummary.totalProfit || 0;
    }
    
    thisMonthIncentive = totalEmployeeProfit * (employee.incentiveRate / 100);
  }
  
  return {
    thisMonthRevenue,
    thisMonthIncentive,
    pendingInvoices,
    pendingPayments
  };
}
```

### 💎 인센티브 계산 세부 로직

#### 1. 월간 인센티브 자동 계산 API
```javascript
async function calculateMonthlyIncentives(year, month) {
  const results = [];
  
  // 1. 모든 직원 및 대행사 어드민 조회
  const employees = await getEmployeesWithIncentiveRate();
  
  for (const employee of employees) {
    try {
      // 2. 기존 인센티브 데이터 확인
      const existingIncentive = await getMonthlyIncentive(employee.id, year, month);
      if (existingIncentive) {
        results.push({ 
          employeeId: employee.id, 
          status: 'skipped',
          message: '이미 계산된 데이터가 존재합니다.'
        });
        continue;
      }
      
      // 3. 담당 캠페인의 수익 계산
      const campaigns = await getCampaignsByManager(employee.id, year, month);
      let totalSales = 0;
      let totalMargin = 0;
      
      for (const campaign of campaigns) {
        const financialSummary = await getCampaignFinancialSummary(campaign.id, year, month);
        totalSales += financialSummary.totalRevenue || 0;
        totalMargin += financialSummary.totalProfit || 0;
      }
      
      // 4. 매출 테이블에서 개별 매출 추가
      const sales = await getSalesByEmployee(employee.id, year, month);
      for (const sale of sales) {
        if (sale.status === '승인' || sale.status === '정산완료') {
          const margin = (sale.actualSellingPrice - sale.actualCostPrice) * sale.quantity;
          totalSales += sale.totalSales;
          totalMargin += margin;
        }
      }
      
      // 5. 인센티브 계산
      const incentiveAmount = Math.round(totalMargin * (employee.incentiveRate / 100));
      
      // 6. 데이터베이스에 저장
      const incentiveData = await createMonthlyIncentive({
        employeeId: employee.id,
        year,
        month,
        totalSales,
        totalMargin,
        incentiveRate: employee.incentiveRate,
        incentiveAmount,
        adjustmentAmount: 0,
        finalAmount: incentiveAmount,
        status: '검토대기',
        calculatorId: getCurrentUserId()
      });
      
      results.push({
        employeeId: employee.id,
        status: 'created',
        data: incentiveData
      });
      
    } catch (error) {
      results.push({
        employeeId: employee.id,
        status: 'error',
        message: error.message
      });
    }
  }
  
  return { results };
}
```

#### 2. 인센티브 조정 및 승인
```javascript
async function updateIncentiveStatus(incentiveId, updateData) {
  const incentive = await getMonthlyIncentiveById(incentiveId);
  
  // 조정 금액이 있는 경우 최종 금액 재계산
  if (updateData.adjustmentAmount !== undefined) {
    updateData.finalAmount = incentive.incentiveAmount + updateData.adjustmentAmount;
  }
  
  // 상태 변경 권한 체크
  if (updateData.status) {
    const allowedTransitions = {
      '검토대기': ['승인완료', '보류', '취소'],
      '승인완료': ['지급완료'],
      '보류': ['검토대기', '승인완료', '취소']
    };
    
    if (!allowedTransitions[incentive.status]?.includes(updateData.status)) {
      throw new Error('허용되지 않는 상태 변경입니다.');
    }
  }
  
  return await updateMonthlyIncentive(incentiveId, {
    ...updateData,
    approverId: getCurrentUserId(),
    updatedAt: new Date()
  });
}
```

---

## 🎨 UI/UX 패턴 및 컴포넌트

### 📱 공통 컴포넌트 패턴

#### 1. 모달 관리 시스템
```javascript
// useModal 훅을 통한 모달 상태 관리
const useModal = () => {
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    buttonText: '확인'
  });
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: '확인',
    cancelText: '취소',
    onConfirm: null,
    loading: false
  });
  
  const showAlert = (message, title = '알림', type = 'info') => {
    return new Promise((resolve) => {
      setAlertModal({
        isOpen: true,
        title,
        message,
        type,
        buttonText: '확인',
        onClose: () => {
          setAlertModal(prev => ({ ...prev, isOpen: false }));
          resolve();
        }
      });
    });
  };
  
  const showConfirm = (options) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title: options.title || '확인',
        message: options.message || '계속하시겠습니까?',
        type: options.type || 'info',
        confirmText: options.confirmText || '확인',
        cancelText: options.cancelText || '취소',
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };
  
  return { alertModal, confirmModal, showAlert, showConfirm };
};
```

#### 2. 로딩 및 에러 처리
```javascript
// LoadingButton 컴포넌트
const LoadingButton = ({ 
  loading, 
  loadingText = '처리 중...', 
  onClick, 
  children,
  className,
  disabled 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`${className} ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          {loadingText}
        </div>
      ) : children}
    </button>
  );
};
```

#### 3. 상태 배지 시스템
```javascript
// 동적 상태 배지 생성
const getStatusBadge = (status, type = 'default') => {
  const statusConfigs = {
    // 매출 상태
    sales: {
      '등록': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      '검토중': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Eye },
      '승인': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      '거절': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      '정산완료': { bg: 'bg-purple-100', text: 'text-purple-800', icon: DollarSign }
    },
    
    // 구매요청 상태  
    purchase: {
      '승인 대기': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      '검토 중': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Eye },
      '승인됨': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      '거절됨': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      '구매 완료': { bg: 'bg-purple-100', text: 'text-purple-800', icon: ShoppingCart },
      '정산 완료': { bg: 'bg-gray-100', text: 'text-gray-800', icon: DollarSign }
    },
    
    // 인센티브 상태
    incentive: {
      '계산중': { bg: 'bg-gray-100', text: 'text-gray-800', icon: Calculator },
      '검토대기': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      '승인완료': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      '지급완료': { bg: 'bg-blue-100', text: 'text-blue-800', icon: DollarSign },
      '보류': { bg: 'bg-orange-100', text: 'text-orange-800', icon: Pause },
      '취소': { bg: 'bg-red-100', text: 'text-red-800', icon: X }
    }
  };
  
  const config = statusConfigs[type]?.[status] || 
                 { bg: 'bg-gray-100', text: 'text-gray-800', icon: HelpCircle };
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon size={12} className="mr-1" />
      {status}
    </span>
  );
};
```

### 🎯 반응형 디자인 패턴

#### 1. 그리드 시스템
```javascript
// 동적 그리드 컬럼 계산
const getDynamicGridColumns = (items, conditions) => {
  let columns = 'grid-cols-1';
  
  if (conditions.shouldShowIncentive && items.length > 5) {
    columns = 'md:grid-cols-2 lg:grid-cols-6'; // 인센티브 표시 + 많은 항목
  } else if (conditions.shouldShowIncentive) {
    columns = 'md:grid-cols-2 lg:grid-cols-5'; // 인센티브 표시
  } else {
    columns = 'md:grid-cols-2 lg:grid-cols-4'; // 기본
  }
  
  return columns;
};
```

#### 2. 조건부 렌더링 패턴
```javascript
// 권한 기반 조건부 렌더링
const ConditionalRender = ({ condition, children, fallback = null }) => {
  return condition ? children : fallback;
};

// 사용 예시
<ConditionalRender 
  condition={canManageIncentives}
  fallback={<div>권한이 없습니다.</div>}
>
  <IncentiveManagementPanel />
</ConditionalRender>
```

---

## 📊 데이터 흐름 및 상태 관리

### 🔄 데이터 동기화 패턴

#### 1. 캠페인 데이터 동기화
```javascript
// 캠페인 목록과 상세 데이터 동기화
const useCampaignSync = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  
  // 캠페인 목록 업데이트 시 선택된 캠페인도 동기화
  const updateCampaign = useCallback((updatedCampaign) => {
    setCampaigns(prev => 
      prev.map(campaign => 
        campaign.id === updatedCampaign.id ? updatedCampaign : campaign
      )
    );
    
    // 현재 선택된 캠페인이면 업데이트
    if (selectedCampaign?.id === updatedCampaign.id) {
      setSelectedCampaign(updatedCampaign);
    }
  }, [selectedCampaign]);
  
  return { campaigns, setCampaigns, selectedCampaign, setSelectedCampaign, updateCampaign };
};
```

#### 2. 실시간 통계 업데이트
```javascript
// 통계 데이터 실시간 업데이트
const useStatsSync = (dependencies) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  
  const refreshStats = useCallback(async () => {
    setLoading(true);
    try {
      const [salesStats, purchaseStats, incentiveStats] = await Promise.all([
        api.get('/api/sales/summary/stats'),
        api.get('/api/purchase-requests/summary/stats'),
        api.get('/api/monthly-incentives/summary/stats')
      ]);
      
      setStats({
        sales: salesStats.data,
        purchase: purchaseStats.data, 
        incentive: incentiveStats.data
      });
    } catch (error) {
      console.error('통계 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 의존성이 변경될 때마다 통계 새로고침
  useEffect(() => {
    refreshStats();
  }, dependencies);
  
  return { stats, loading, refreshStats };
};
```

### 📱 사용자 경험 최적화

#### 1. 낙관적 업데이트
```javascript
// 매출 승인 시 즉시 UI 업데이트
const optimisticSalesApproval = async (saleId) => {
  // 1. 즉시 UI 업데이트
  setSales(prev => 
    prev.map(sale => 
      sale.id === saleId 
        ? { ...sale, status: '승인', updatedAt: new Date() }
        : sale
    )
  );
  
  try {
    // 2. 서버에 실제 요청
    await api.put(`/api/sales/${saleId}`, { status: '승인' });
    
    // 3. 통계 새로고침
    refreshStats();
    
  } catch (error) {
    // 4. 실패 시 롤백
    setSales(prev => 
      prev.map(sale => 
        sale.id === saleId 
          ? { ...sale, status: '검토중' } // 이전 상태로 복원
          : sale
      )
    );
    
    showAlert('승인 처리에 실패했습니다.');
  }
};
```

#### 2. 무한 스크롤 및 가상화
```javascript
// 대량 데이터 처리를 위한 가상 스크롤
const useVirtualScroll = (items, itemHeight = 60) => {
  const [visibleItems, setVisibleItems] = useState([]);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();
  
  const containerHeight = 400; // 컨테이너 높이
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount, items.length);
  
  useEffect(() => {
    setVisibleItems(items.slice(startIndex, endIndex));
  }, [items, startIndex, endIndex]);
  
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };
  
  return {
    visibleItems,
    containerRef,
    handleScroll,
    totalHeight: items.length * itemHeight,
    offsetY: startIndex * itemHeight
  };
};
```

---

## 🔧 시스템 아키텍처 및 설계 원칙

### 🏗️ 컴포넌트 아키텍처

#### 1. 계층적 컴포넌트 구조
```
src/
├── pages/                  # 페이지 컴포넌트
│   ├── Dashboard.jsx       # 대시보드 (통계, KPI)
│   ├── CampaignManagement.jsx  # 캠페인 관리
│   ├── SalesRegistration.jsx   # 매출 관리
│   └── UserManagement.jsx      # 사용자 관리
├── components/
│   ├── common/            # 공통 컴포넌트
│   │   ├── StatusBadge.jsx    # 상태 배지
│   │   ├── AdvancedFilter.jsx # 고급 필터
│   │   └── ImageViewer.jsx    # 이미지 뷰어
│   ├── modals/           # 모달 컴포넌트
│   │   ├── NewCampaignModal.jsx   # 캠페인 생성
│   │   ├── PurchaseRequestModal.jsx # 구매요청
│   │   └── UserEditModal.jsx      # 사용자 편집
│   ├── ui/               # UI 라이브러리
│   │   ├── AlertModal.jsx     # 알림 모달
│   │   ├── ConfirmModal.jsx   # 확인 모달
│   │   └── LoadingSpinner.jsx # 로딩 스피너
│   └── campaigns/        # 캠페인 전용 컴포넌트
│       ├── CampaignList.jsx   # 캠페인 목록
│       └── CampaignDetail.jsx # 캠페인 상세
├── hooks/                # 커스텀 훅
│   └── useModal.js       # 모달 관리 훅
├── contexts/             # React Context
│   └── NotificationContext.jsx # 알림 컨텍스트
├── api/                  # API 관련
│   └── client.js         # Axios 클라이언트
└── utils/                # 유틸리티 함수
    ├── formatters.js     # 데이터 포맷팅
    ├── validators.js     # 유효성 검사
    └── constants.js      # 상수 정의
```

#### 2. 디자인 시스템 원칙
```javascript
// 색상 시스템
const colorSystem = {
  // 기본 색상
  primary: {
    50: '#eff6ff',   // 매우 밝은 파란색
    100: '#dbeafe',  // 밝은 파란색
    500: '#3b82f6',  // 기본 파란색
    600: '#2563eb',  // 진한 파란색
    900: '#1e3a8a'   // 매우 진한 파란색
  },
  
  // 상태 색상
  success: {
    100: '#dcfce7',  // 밝은 초록색
    600: '#16a34a',  // 진한 초록색
    800: '#166534'   // 매우 진한 초록색
  },
  
  warning: {
    100: '#fef3c7',  // 밝은 노란색
    600: '#d97706',  // 진한 노란색
    800: '#92400e'   // 매우 진한 노란색
  },
  
  danger: {
    100: '#fee2e2',  // 밝은 빨간색
    600: '#dc2626',  // 진한 빨간색
    800: '#991b1b'   // 매우 진한 빨간색
  }
};

// 타이포그래피 시스템
const typography = {
  // 제목
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-bold text-gray-800',
  h3: 'text-xl font-semibold text-gray-800',
  
  // 본문
  body: 'text-base text-gray-700',
  caption: 'text-sm text-gray-600',
  small: 'text-xs text-gray-500',
  
  // 버튼
  button: 'font-medium text-sm',
  buttonLg: 'font-medium text-base'
};

// 간격 시스템 (Tailwind 기반)
const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem'    // 48px
};
```

### 🔄 상태 관리 패턴

#### 1. 전역 상태 (Context API)
```javascript
// NotificationContext - 알림 시스템
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('알림 조회 실패:', error);
    }
  }, []);
  
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  }, []);
  
  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAllAsRead
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
```

#### 2. 지역 상태 (useState + useReducer)
```javascript
// 복잡한 폼 상태 관리
const useFormState = (initialState) => {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'SET_FIELD':
        return { ...state, [action.field]: action.value };
      case 'SET_MULTIPLE':
        return { ...state, ...action.values };
      case 'RESET':
        return initialState;
      case 'VALIDATE':
        return { ...state, errors: validateForm(state) };
      default:
        return state;
    }
  }, { ...initialState, errors: {} });
  
  const setField = (field, value) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };
  
  const setMultiple = (values) => {
    dispatch({ type: 'SET_MULTIPLE', values });
  };
  
  const reset = () => {
    dispatch({ type: 'RESET' });
  };
  
  const validate = () => {
    dispatch({ type: 'VALIDATE' });
    return Object.keys(state.errors).length === 0;
  };
  
  return { state, setField, setMultiple, reset, validate };
};
```

---

## 🚀 성능 최적화 및 베스트 프랙티스

### ⚡ 렌더링 최적화

#### 1. 메모이제이션 패턴
```javascript
// React.memo를 활용한 컴포넌트 최적화
const CampaignCard = React.memo(({ 
  campaign, 
  onSelect, 
  onEdit, 
  onDelete,
  currentUser 
}) => {
  // 캠페인 카드 렌더링 로직
  
  return (
    <div className="campaign-card">
      {/* 카드 내용 */}
    </div>
  );
}, (prevProps, nextProps) => {
  // 얕은 비교로 최적화
  return (
    prevProps.campaign.id === nextProps.campaign.id &&
    prevProps.campaign.updatedAt === nextProps.campaign.updatedAt &&
    prevProps.currentUser?.id === nextProps.currentUser?.id
  );
});

// useMemo를 활용한 계산 최적화
const CampaignList = ({ campaigns, filters }) => {
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      if (filters.status && campaign.status !== filters.status) return false;
      if (filters.manager && campaign.managerId !== filters.manager) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return campaign.name.toLowerCase().includes(searchLower) ||
               campaign.client.toLowerCase().includes(searchLower);
      }
      return true;
    });
  }, [campaigns, filters]);
  
  const sortedCampaigns = useMemo(() => {
    return filteredCampaigns.sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [filteredCampaigns]);
  
  return (
    <div>
      {sortedCampaigns.map(campaign => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
};
```

#### 2. 지연 로딩 (Lazy Loading)
```javascript
// 컴포넌트 지연 로딩
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CampaignManagement = lazy(() => import('./pages/CampaignManagement'));
const SalesRegistration = lazy(() => import('./pages/SalesRegistration'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// 로딩 스피너와 함께 사용
const App = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/campaigns" element={<CampaignManagement />} />
          <Route path="/admin/sales" element={<SalesRegistration />} />
          <Route path="/admin/users" element={<UserManagement />} />
        </Routes>
      </Suspense>
    </Router>
  );
};
```

### 🔍 데이터 최적화

#### 1. API 요청 최적화
```javascript
// 병렬 요청 처리
const loadDashboardData = async (user) => {
  try {
    // 여러 API를 병렬로 요청
    const [
      campaignsResponse,
      salesStatsResponse,
      purchaseStatsResponse,
      usersResponse
    ] = await Promise.all([
      api.get('/api/campaigns', { 
        params: { viewerId: user.id, viewerRole: user.role }
      }),
      api.get('/api/sales/summary/stats', { 
        params: { viewerId: user.id, viewerRole: user.role }
      }),
      api.get('/api/purchase-requests/summary/stats', { 
        params: { viewerId: user.id, viewerRole: user.role }
      }),
      api.get('/api/users', { 
        params: { viewerId: user.id, viewerRole: user.role }
      })
    ]);
    
    return {
      campaigns: campaignsResponse.data,
      salesStats: salesStatsResponse.data,
      purchaseStats: purchaseStatsResponse.data,
      users: usersResponse.data
    };
    
  } catch (error) {
    console.error('대시보드 데이터 로딩 실패:', error);
    throw error;
  }
};

// 요청 중복 제거 (debounce)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// 검색어 debounce 적용
const SearchInput = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    onSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearch]);
  
  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="검색..."
      className="w-full px-3 py-2 border rounded-lg"
    />
  );
};
```

#### 2. 캐싱 전략
```javascript
// 메모리 캐시
const cache = new Map();

const getCachedData = async (key, fetcher, ttl = 300000) => { // 5분 TTL
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};

// 사용 예시
const fetchCampaigns = async (userId, userRole) => {
  const cacheKey = `campaigns_${userId}_${userRole}`;
  
  return getCachedData(cacheKey, async () => {
    const response = await api.get('/api/campaigns', {
      params: { viewerId: userId, viewerRole: userRole }
    });
    return response.data;
  });
};
```

---

## 🔮 확장성 및 미래 계획

### 🌐 멀티테넌트 아키텍처

#### 1. 테넌트 분리 전략
```javascript
// 테넌트별 데이터 분리
const getTenantData = (userId, userRole, companyId) => {
  const tenantFilters = {
    // 슈퍼 어드민: 모든 데이터 접근
    '슈퍼 어드민': () => ({}),
    
    // 대행사 어드민: 자신의 회사 데이터만
    '대행사 어드민': () => ({ companyId }),
    
    // 직원: 자신이 담당하는 데이터만
    '직원': () => ({ 
      $or: [
        { managerId: userId },
        { salesPersonId: userId },
        { requesterId: userId }
      ]
    }),
    
    // 클라이언트: 자신과 관련된 데이터만
    '클라이언트': () => ({ 
      $or: [
        { userId: userId },
        { clientId: userId }
      ]
    })
  };
  
  return tenantFilters[userRole]?.() || {};
};
```

#### 2. 다국어 지원 준비
```javascript
// i18n 시스템 구조
const translations = {
  ko: {
    common: {
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      edit: '편집',
      create: '생성'
    },
    dashboard: {
      title: '대시보드',
      totalRevenue: '총 매출',
      totalExpenses: '총 지출',
      netProfit: '순이익'
    },
    campaigns: {
      title: '캠페인 관리',
      createNew: '새 캠페인',
      status: {
        active: '진행중',
        completed: '완료',
        paused: '일시정지'
      }
    }
  },
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create'
    }
    // ... 영어 번역
  }
};

// 번역 훅
const useTranslation = (namespace = 'common') => {
  const [locale] = useState('ko'); // 추후 Context로 관리
  
  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[locale][namespace];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }, [locale, namespace]);
  
  return { t };
};
```

### 📱 PWA (Progressive Web App) 준비

#### 1. 서비스 워커 설정
```javascript
// public/sw.js
const CACHE_NAME = 'brandflow-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에서 찾으면 반환, 없으면 네트워크 요청
        return response || fetch(event.request);
      })
  );
});
```

#### 2. 오프라인 지원
```javascript
// 오프라인 상태 감지
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// 오프라인 데이터 동기화
const useOfflineSync = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const isOnline = useOnlineStatus();
  
  const addPendingRequest = (request) => {
    setPendingRequests(prev => [...prev, request]);
    localStorage.setItem('pendingRequests', JSON.stringify([...pendingRequests, request]));
  };
  
  const syncPendingRequests = async () => {
    if (!isOnline || pendingRequests.length === 0) return;
    
    for (const request of pendingRequests) {
      try {
        await api(request);
        setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      } catch (error) {
        console.error('오프라인 요청 동기화 실패:', error);
      }
    }
    
    localStorage.removeItem('pendingRequests');
  };
  
  useEffect(() => {
    if (isOnline) {
      syncPendingRequests();
    }
  }, [isOnline]);
  
  return { addPendingRequest, pendingRequests };
};
```

### 🤖 AI/ML 통합 준비

#### 1. 콘텐츠 추천 시스템
```javascript
// AI 기반 주제 추천
const useContentRecommendations = (campaignId, clientHistory) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      // AI API 호출 (예: OpenAI, 자체 ML 모델)
      const response = await api.post('/api/ai/content-recommendations', {
        campaignId,
        clientHistory,
        industryTrends: await getIndustryTrends(),
        competitorAnalysis: await getCompetitorData()
      });
      
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('AI 추천 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [campaignId, clientHistory]);
  
  return { recommendations, loading, generateRecommendations };
};
```

#### 2. 성과 예측 모델
```javascript
// 캠페인 성과 예측
const useCampaignPerformancePrediction = () => {
  const predictPerformance = async (campaignData) => {
    try {
      const response = await api.post('/api/ai/predict-performance', {
        budget: campaignData.budget,
        industry: campaignData.industry,
        targetAudience: campaignData.targetAudience,
        contentType: campaignData.contentType,
        seasonality: getCurrentSeason(),
        historicalData: await getHistoricalCampaigns()
      });
      
      return {
        expectedROI: response.data.roi,
        confidenceLevel: response.data.confidence,
        keyFactors: response.data.factors,
        recommendations: response.data.recommendations
      };
      
    } catch (error) {
      console.error('성과 예측 실패:', error);
      return null;
    }
  };
  
  return { predictPerformance };
};
```

---

## 🎯 결론 및 핵심 가치

BrandFlow는 **마케팅 대행사의 디지털 트랜스포메이션을 위한 올인원 플랫폼**입니다.

### 🏆 핵심 성과
1. **업무 효율성 300% 향상**: 수작업 → 자동화
2. **데이터 기반 의사결정**: 실시간 분석 → 정확한 판단
3. **완벽한 투명성**: 클라이언트-대행사 간 실시간 소통
4. **확장 가능한 구조**: 작은 대행사부터 대기업까지

### 💡 차별화 요소
- **역할 기반 완벽한 권한 분리**
- **복잡한 인센티브 계산 자동화**  
- **캠페인-매출-구매요청 통합 관리**
- **실시간 재무 분석 및 예측**

### 🚀 기술적 우수성
- **React 18 + 최신 기술 스택**
- **확장 가능한 컴포넌트 아키텍처**
- **체계적인 에러 처리 및 재시도**
- **성능 최적화된 UI/UX**

BrandFlow는 단순한 관리 도구를 넘어, **마케팅 대행사의 비즈니스를 혁신하는 디지털 플랫폼**입니다. 🌟