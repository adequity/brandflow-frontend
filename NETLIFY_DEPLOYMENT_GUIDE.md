# 🚀 BrandFlow Netlify 배포 가이드

## 📋 배포 준비 완료 상태

✅ **빌드 설정**: Vite 프로덕션 빌드 최적화 완료  
✅ **환경 변수**: 프로덕션 환경 설정 완료  
✅ **보안 헤더**: CSP, XSS 보호 설정 완료  
✅ **캐시 최적화**: 정적 자산 캐시 설정 완료  
✅ **SPA 라우팅**: React Router 라우팅 처리 완료  

## 🌐 Netlify 배포 방법

### 방법 1: GitHub 연동 자동 배포 (권장)

1. **GitHub에 코드 푸시**
```bash
cd C:\Users\User\Desktop\brandflow-fix
git add .
git commit -m "feat: add Netlify production deployment configuration"
git push origin main
```

2. **Netlify 사이트 생성**
   - [Netlify](https://app.netlify.com) 로그인
   - "New site from Git" 클릭
   - GitHub 저장소 연결
   - Repository: `your-repo/brandflow-fix` 선택

3. **빌드 설정 확인**
   - Build command: `npm ci && npm run build`
   - Publish directory: `dist`
   - Node version: `18`
   - 환경변수는 `netlify.toml`에서 자동 설정됨

### 방법 2: 수동 배포

1. **로컬 빌드**
```bash
cd C:\Users\User\Desktop\brandflow-fix
npm ci
npm run build
```

2. **Netlify Deploy**
```bash
# Netlify CLI 설치 (처음만)
npm install -g netlify-cli

# 로그인
netlify login

# 배포
netlify deploy --prod --dir=dist
```

### 방법 3: 드래그 앤 드롭 배포

1. **빌드 폴더 압축**
   - `dist` 폴더를 zip 파일로 압축

2. **Netlify 사이트 생성**
   - [Netlify](https://app.netlify.com) 로그인
   - "Deploy manually" 섹션에 zip 파일 드래그앤드롭

## ⚙️ 환경 변수 설정 (Netlify 대시보드)

자동 배포 사용 시 Netlify 대시보드에서 환경변수 추가:

```
VITE_API_BASE_URL=https://brandflow-backend2.onrender.com
VITE_WS_BASE_URL=wss://brandflow-backend2.onrender.com
VITE_NODE_ENV=production
VITE_FEATURE_WEBSOCKET=true
VITE_FEATURE_FILE_UPLOAD=true
VITE_FEATURE_EXPORT=true
VITE_FEATURE_ADVANCED_SEARCH=true
```

## 🔧 배포 후 확인사항

### 1. 기본 기능 테스트
- [ ] 사이트 로딩 (https://your-site.netlify.app)
- [ ] 로그인 페이지 접근
- [ ] API 연결 확인
- [ ] 라우팅 동작 (새로고침 시에도 작동)

### 2. 고급 기능 테스트  
- [ ] 실시간 알림 (WebSocket)
- [ ] 파일 업로드
- [ ] 데이터 내보내기
- [ ] 고급 검색

### 3. 성능 및 보안
- [ ] 로딩 속도 (Lighthouse 점수 90+ 목표)
- [ ] 보안 헤더 적용 확인
- [ ] HTTPS 강제 적용
- [ ] CSP 정책 동작 확인

## 🎯 배포된 사이트 URL

배포 완료 후 다음과 같은 URL로 접근 가능:

```
https://brandflow-[random-string].netlify.app
```

또는 커스텀 도메인 설정:
```
https://brandflow.yourdomain.com
```

## 🔍 문제 해결

### CORS 문제
- API 요청 시 CORS 에러 발생하면 `netlify.toml`의 프록시 설정 활용
- 또는 백엔드 서버의 CORS 설정에 프론트엔드 도메인 추가

### WebSocket 연결 문제
- WSS(SSL) 프로토콜 사용 확인
- 백엔드 서버의 WebSocket 엔드포인트 HTTPS 지원 확인

### 빌드 실패
- Node.js 버전 확인 (18+ 필요)
- 의존성 설치 확인: `npm ci`
- 메모리 부족 시: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

### 라우팅 문제
- `_redirects` 파일이 dist 폴더에 포함되었는지 확인
- React Router의 BrowserRouter 사용 확인

## 📊 성능 최적화

### 이미 적용된 최적화
- ✅ 코드 스플리팅 (청크별 분할)
- ✅ 트리 쉐이킹 (불필요한 코드 제거)
- ✅ 압축 및 minification
- ✅ 정적 자산 캐싱
- ✅ 이미지 최적화 준비

### 추가 최적화 가능사항
- [ ] PWA 설정 (Service Worker)
- [ ] 이미지 WebP 변환
- [ ] CDN 활용 (Cloudflare 등)
- [ ] 프리렌더링 (Netlify Prerendering)

## 🎉 배포 완료 체크리스트

- [ ] GitHub 저장소에 코드 푸시
- [ ] Netlify에서 자동 빌드 성공
- [ ] 프로덕션 사이트 정상 접근
- [ ] 로그인 기능 테스트
- [ ] API 통신 확인
- [ ] 모든 페이지 라우팅 테스트
- [ ] 모바일 반응형 확인
- [ ] 성능 점수 확인 (Lighthouse)
- [ ] 보안 헤더 적용 확인
- [ ] 커스텀 도메인 설정 (선택사항)

---

**배포 완료 후 URL을 공유해주시면 추가 검토 및 최적화를 도와드릴 수 있습니다!** 🚀