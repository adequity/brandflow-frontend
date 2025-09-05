# 🔗 BrandFlow 백엔드-프론트엔드 API 완전 매핑

## 📋 백엔드 API 엔드포인트 목록

### 인증 관련 (`/api/auth`)
- **POST** `/api/auth/login` - 로그인
- **POST** `/api/auth/logout` - 로그아웃
- **POST** `/api/auth/refresh` - 토큰 갱신

### 사용자 관리 (`/api/users`)
- **GET** `/api/users/` - 사용자 목록 조회
- **POST** `/api/users/` - 사용자 생성
- **GET** `/api/users/{user_id}/` - 사용자 상세 조회
- **PUT** `/api/users/{user_id}` - 사용자 수정 (⚠️ trailing slash 제거)
- **DELETE** `/api/users/{user_id}/` - 사용자 삭제

### 캠페인 관리 (`/api/campaigns`)
- **GET** `/api/campaigns/` - 캠페인 목록 조회
- **POST** `/api/campaigns/` - 캠페인 생성
- **GET** `/api/campaigns/{campaign_id}/` - 캠페인 상세 조회
- **PUT** `/api/campaigns/{campaign_id}/` - 캠페인 수정
- **DELETE** `/api/campaigns/{campaign_id}/` - 캠페인 삭제

### 구매 요청 (`/api/purchase-requests`)
- **GET** `/api/purchase-requests/` - 구매 요청 목록
- **POST** `/api/purchase-requests/` - 구매 요청 생성
- **GET** `/api/purchase-requests/{request_id}/` - 구매 요청 상세
- **PUT** `/api/purchase-requests/{request_id}/approve` - 구매 요청 승인/반려

### 알림 시스템 (`/api/notifications`)
- **GET** `/api/notifications/` - 알림 목록
- **GET** `/api/notifications/unread-count` - 읽지 않은 알림 수 (⚠️ trailing slash 없음)
- **POST** `/api/notifications/` - 알림 생성
- **PUT** `/api/notifications/{notification_id}/read/` - 알림 읽음 처리

### 파일 업로드 (`/api/files`)
- **POST** `/api/files/upload/` - 파일 업로드
- **GET** `/api/files/{file_id}/` - 파일 다운로드

### 회사 정보 (`/api/company`)
- **GET** `/api/company/logo/` - 회사 로고
- **POST** `/api/company/logo/` - 회사 로고 업데이트

### 상품 관리 (`/api/products`)
- **GET** `/api/products/` - 상품 목록
- **POST** `/api/products/` - 상품 생성
- **GET** `/api/products/{product_id}/` - 상품 상세

### 작업 유형 (`/api/work-types`)
- **GET** `/api/work-types` - 작업 유형 목록 (⚠️ trailing slash 없음)
- **POST** `/api/work-types/` - 작업 유형 생성

### 성능 모니터링 (`/api/performance`)
- **GET** `/api/performance/dashboard/` - 성능 대시보드
- **GET** `/api/performance/metrics/` - 성능 메트릭

### 시스템 모니터링 (`/api/monitoring`)
- **GET** `/api/monitoring/health/` - 시스템 상태
- **GET** `/api/monitoring/metrics/` - 시스템 메트릭

## 🚨 Railway 배포 특이사항

### Trailing Slash 처리 규칙
```javascript
// ✅ Trailing slash 필요 (307 리다이렉트 방지)
/api/users/ 
/api/campaigns/
/api/notifications/

// ❌ Trailing slash 제거 (404 방지)  
/api/users/1          // PUT 요청 시
/api/work-types       // GET 요청 시
/api/notifications/unread-count
```

### 한글 역할명 매핑
```javascript
const roleMapping = {
  '슈퍼 어드민': 'super_admin',
  '대행사 어드민': 'agency_admin',
  '대행사 직원': 'agency_staff',  
  '클라이언트': 'client',
  '어드민': 'admin',
  '직원': 'staff'
};
```

## 🎯 프론트엔드 연결 현황

### ✅ 연결 완료
1. **인증 시스템** - JWT 토큰 기반 로그인/로그아웃
2. **사용자 관리** - 목록 조회, 생성, 수정, 삭제
3. **캠페인 관리** - CRUD 기본 기능
4. **알림 시스템** - 실시간 알림 표시 및 읽음 처리
5. **파일 업로드** - 이미지 및 문서 업로드

### ⚠️ 부분 연결 (수정 필요)
1. **사용자 데이터 표시** - API 응답은 정상이지만 UI에서 "0 users" 표시
2. **캠페인 생성 폼** - 사용자 드롭다운이 비어있음
3. **구매 요청** - 승인/반려 플로우 테스트 필요

### ❌ 미연결 
1. **대시보드 통계** - 성능 메트릭 표시
2. **실시간 웹소켓** - 실시간 알림 푸시
3. **고급 검색** - 필터링 및 정렬 기능
4. **내보내기 기능** - Excel/CSV 다운로드

## 🔧 즉시 수정 필요 사항

### 1. 사용자 데이터 파싱 문제
**현상**: API에서 데이터를 받아오지만 UI에서 표시되지 않음
**원인**: 데이터 구조 불일치 또는 상태 관리 오류
**해결**: 데이터 플로우 디버깅 필요

### 2. 캠페인 생성 폼 이슈  
**현상**: 사용자 선택 드롭다운이 비어있음
**원인**: 사용자 목록 API 호출 실패 또는 데이터 매핑 오류
**해결**: 사용자 목록 API 연동 확인

### 3. 데이터베이스 스키마 동기화
**현상**: 일부 필드 누락 또는 타입 불일치
**해결**: 백엔드 모델과 프론트엔드 타입 정의 동기화

## 📊 데이터베이스 테이블 구조

### Users 테이블
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE, 
    role TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Campaigns 테이블
```sql
CREATE TABLE campaigns (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    creator_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users (id)
);
```

### Notifications 테이블
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🚀 다음 단계 실행 계획

1. **사용자 데이터 표시 문제 해결** (최우선)
2. **캠페인 생성 플로우 완성**  
3. **실시간 알림 시스템 구현**
4. **대시보드 통계 연결**
5. **파일 업로드 고도화**