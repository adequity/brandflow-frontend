# BrandFlow Frontend - Claude 개발 가이드

## 기술 스택
- React 18 + Vite + Tailwind CSS
- 배포: Netlify (brandflo.netlify.app)
- 백엔드 API: Railway FastAPI

## 유저 Role 체계 (절대 기준)

모든 role 값은 **대문자 영문**으로 통일. localStorage, API 파라미터, 조건문 모두 동일.

```javascript
// 공식 Role 값 - 이 값만 사용할 것
SUPER_ADMIN    // 최고 관리자
AGENCY_ADMIN   // 대행사 어드민
TEAM_LEADER    // 팀 리더
STAFF          // 직원 (permissions.js에서 ROLES.EMPLOYEE = 'STAFF')
CLIENT         // 클라이언트
```

### permissions.js ROLES 매핑
```javascript
ROLES.SUPER_ADMIN  = 'SUPER_ADMIN'
ROLES.AGENCY_ADMIN = 'AGENCY_ADMIN'
ROLES.TEAM_LEADER  = 'TEAM_LEADER'
ROLES.EMPLOYEE     = 'STAFF'      // 주의: key는 EMPLOYEE, value는 'STAFF'
ROLES.CLIENT       = 'CLIENT'
```

### 주의사항
- API 호출 시 `viewerRole` 파라미터는 반드시 대문자 전달 (예: `viewerRole: currentUser.role`)
- 소문자 변환(`'agency_admin'`) 절대 금지
- `currentUser.role`은 localStorage에서 가져온 값 그대로 사용 (이미 대문자)
- 조건문에서 role 비교 시: `user.role === 'AGENCY_ADMIN'` (대문자 직접 비교)

### 직원 선택 가능 역할
캠페인 담당자 드롭다운에 표시되는 role: `STAFF`, `TEAM_LEADER`, `AGENCY_ADMIN`

## 회사(company) 기반 필터링 원칙
- 백엔드 API가 이미 company 기준으로 필터링해서 반환함
- 프론트에서 `isSameCompany()` 중복 체크 불필요 (백엔드 신뢰)
- 단, `canSelectClient`, `canSelectEmployee` 등 permissions.js 함수는 유지 (다른 컨텍스트에서 사용)

## 캠페인 권한 요약
| 동작 | SUPER_ADMIN | AGENCY_ADMIN | TEAM_LEADER | STAFF | CLIENT |
|------|:-----------:|:------------:|:-----------:|:-----:|:------:|
| 생성 | O | O (대리 생성 가능) | O | O | X |
| 조회 | 전체 | 같은 회사 | 본인+팀원 | 본인 | 본인 |
| 수정 | 전체 | 같은 회사 | 본인+팀원 | 본인 | 본인 |
| 삭제 | O | O | O | X | X |

## 페이지 구조 (src/pages/)

| 페이지 | 파일 | 접근 role |
|--------|------|----------|
| 로그인 | `Login.jsx` | 전체 |
| 대시보드 | `Dashboard.jsx` | 관리자/직원 |
| 캠페인 목록 | `CampaignListPage.jsx` | 전체 (role별 필터) |
| 캠페인 상세 | `CampaignDetailPage.jsx` | 권한별 |
| 캠페인 관리 | `CampaignManagement.jsx` | 관리자/직원 |
| 사용자 관리 | `UserManagement.jsx` | SUPER_ADMIN, AGENCY_ADMIN |
| 구매요청 | `PurchaseRequestsPage.jsx` | 전체 (role별 필터) |
| 발주 관리 | `OrderManagement.jsx` | 관리자/직원 |
| 상품 관리 | `ProductManagement.jsx` | 관리자 |
| 매출 등록 | `SalesRegistration.jsx` | 직원 |
| 월별 인센티브 | `MonthlyIncentives.jsx` | 관리자/직원 |
| 캘린더 | `CalendarPage.jsx` | 전체 |
| 게시판 | `BoardPage.jsx` | 전체 |
| 시스템 설정 | `SystemSettings.jsx` | SUPER_ADMIN |
| 클라이언트 전용 | `ClientUI.jsx` | CLIENT |
| 관리자 전용 | `AdminUI.jsx` | SUPER_ADMIN |

## 주요 컴포넌트 (src/components/)

| 컴포넌트 | 설명 |
|----------|------|
| `Header.jsx` | 상단 네비게이션 |
| `Sidebar.jsx` | 좌측 메뉴 (role별 메뉴 표시) |
| `campaigns/CampaignList.jsx` | 캠페인 목록 + 필터 + 생성 버튼 |
| `modals/NewCampaignModal.jsx` | 새 캠페인 생성 모달 |
| `modals/CampaignEditModal.jsx` | 캠페인 수정 모달 |
| `modals/CampaignDuplicateModal.jsx` | 캠페인 복사 모달 |
| `modals/ContractUploadModal.jsx` | 계약서 업로드 |
| `modals/ChatContentModal.jsx` | 카톡 내용 모달 |
| `ApprovalButtons.jsx` | 승인/반려 버튼 (CLIENT용) |
| `WorkTypeManagement.jsx` | 업무유형 관리 |
| `TelegramSettings.jsx` | 텔레그램 알림 설정 |

## API 클라이언트 (src/api/client.js)

- 프로덕션 URL: `https://brandflow-backend-production-99ae.up.railway.app`
- 인증: `localStorage.getItem('authToken')` → `Authorization: Bearer {token}`
- 사용자 정보: `localStorage.getItem('user')` → JSON (id, name, role, company 등)
- apiEndpoints 객체로 API 호출 (예: `apiEndpoints.users.list()`, `apiEndpoints.campaigns.create()`)

## 스타일링
- Tailwind CSS 사용 (별도 CSS 파일 없음)
- 아이콘: `lucide-react`, `react-icons`
- 반응형: `md:` 브레이크포인트 기준
