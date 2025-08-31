# 도메인 관리 가이드

BrandFlow 프론트엔드는 유연한 도메인 설정 시스템을 사용합니다.

## 🌐 백엔드 URL 결정 순서

1. **환경변수** (최우선)
   - `VITE_API_BASE_URL` 설정 시 해당 URL 사용
   
2. **개발 환경**
   - `npm run dev` 실행 시 Vite 프록시 사용 (빈 문자열)
   
3. **도메인 매핑** (자동 감지)
   - `src/config/domains.js`에서 현재 도메인에 맞는 백엔드 URL 자동 선택
   
4. **기본값**
   - 위 모든 방법이 실패할 경우 Railway 기본 URL 사용

## 🔧 새로운 도메인 추가 방법

### 1. 도메인 매핑 파일 수정
`src/config/domains.js`에서 `DOMAIN_MAPPINGS`에 새 도메인 추가:

```javascript
export const DOMAIN_MAPPINGS = {
  'new-domain.netlify.app': {
    backend: 'https://brandflow-backend-production.railway.app',
    environment: 'production'
  },
  // 기존 도메인들...
};
```

### 2. Netlify 환경변수 설정 (권장)
Netlify 대시보드에서 환경변수 추가:
- Key: `VITE_API_BASE_URL`
- Value: `https://your-backend-url.com`

### 3. CSP 정책 업데이트
`_headers` 파일에서 새 도메인 허용:
```
connect-src 'self' https://new-backend-domain.com;
```

## 🚀 배포 시나리오별 가이드

### Netlify 도메인 변경
1. `src/config/domains.js`에 새 도메인 추가
2. `_headers`, `netlify.toml` CSP 정책 업데이트
3. Git 커밋 & 푸시 → 자동 배포

### Railway 백엔드 도메인 변경
1. `src/config/domains.js`에서 백엔드 URL 업데이트
2. 또는 Netlify 환경변수 `VITE_API_BASE_URL` 수정
3. Git 커밋 & 푸시 → 자동 배포

### 스테이징 환경 추가
1. 새 Netlify 사이트 생성
2. 환경변수 `VITE_API_BASE_URL`에 스테이징 백엔드 URL 설정
3. 자동으로 올바른 백엔드 연결

## 🔍 디버깅

브라우저 콘솔에서 다음 로그 확인:
- `🔧 환경변수에서 백엔드 URL 사용`
- `🌐 도메인 매핑: domain → backend`  
- `⚠️ 알 수 없는 도메인: domain`

## 📋 현재 설정된 도메인

- `brandflo.netlify.app` → Railway 프로덕션
- `singular-peony-ea66d2.netlify.app` → Railway 프로덕션
- `localhost` → 로컬 개발 서버