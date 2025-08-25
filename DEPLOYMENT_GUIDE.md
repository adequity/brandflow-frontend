# 🚀 BrandFlow 배포 가이드

## 📋 배포 전 준비사항

### 1. 필요한 도구
- Node.js 18+ 
- Git
- 웹서버 (Nginx/Apache) 또는 클라우드 플랫폼

### 2. 환경 설정
- 도메인명 준비
- SSL 인증서 (HTTPS 권장)
- 데이터베이스 (선택사항)

## 🎯 배포 방법

### Option 1: 클라우드 플랫폼 (추천)

#### Vercel (프론트엔드)
```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프론트엔드 배포
cd brandflow-fix
vercel

# 3. 환경변수 설정
vercel env add VITE_API_BASE_URL
# 값: https://your-backend-url.render.com
```

#### Render.com (백엔드)
```bash
# 1. GitHub에 백엔드 코드 푸시
git add .
git commit -m "Deploy backend"
git push origin main

# 2. render.com에서 연결
# - New Web Service
# - Connect GitHub repository
# - Build Command: npm install
# - Start Command: npm start
```

### Option 2: VPS/서버 배포

#### 1. 서버 설정
```bash
# Ubuntu 서버 예시
sudo apt update
sudo apt install nginx nodejs npm pm2

# Node.js 최신 버전 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. 백엔드 배포
```bash
# 서버에 코드 복사
scp -r brandflow-backend user@server:/var/www/

# 서버에서 실행
cd /var/www/brandflow-backend
npm install
pm2 start test-server.js --name brandflow-api
pm2 save
pm2 startup
```

#### 3. 프론트엔드 배포
```bash
# 로컬에서 빌드
cd brandflow-fix
npm run build

# 서버에 업로드
scp -r dist/* user@server:/var/www/brandflow/

# Nginx 설정 복사
sudo cp nginx.conf /etc/nginx/sites-available/brandflow
sudo ln -s /etc/nginx/sites-available/brandflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 중요 설정사항

### 1. SPA 라우팅 (필수!)
모든 웹서버에서 설정 필요:
- **Nginx**: `try_files $uri $uri/ /index.html;`
- **Apache**: `.htaccess` 파일 사용
- **Vercel**: `vercel.json` 사용 (이미 설정됨)

### 2. 환경변수
**프로덕션 환경**:
```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

**백엔드**:
```env
NODE_ENV=production
PORT=5004
```

### 3. CORS 설정
백엔드에서 프론트엔드 도메인 허용 필요

## ✅ 배포 후 확인사항

1. **URL 직접 접속**: `https://yourdomain.com/admin/dashboard`
2. **새로고침**: 페이지에서 F5 누를 때 404 없어야 함
3. **브라우저 뒤로가기**: 정상 작동 확인
4. **API 연결**: 로그인 및 데이터 로드 확인
5. **모바일**: 반응형 디자인 확인

## 🚨 문제 해결

### 404 오류 (가장 흔한 문제)
- **원인**: SPA 라우팅 미설정
- **해결**: 웹서버 설정에서 모든 경로를 `/index.html`로 리다이렉트

### API 연결 오류
- **원인**: 잘못된 API URL 또는 CORS
- **해결**: 환경변수 및 CORS 설정 확인

### 빌드 오류
- **원인**: 의존성 문제
- **해결**: `npm ci` 후 다시 빌드

## 📞 지원

문제 발생 시:
1. 브라우저 개발자 도구 콘솔 확인
2. 서버 로그 확인 (`pm2 logs`)
3. Nginx 로그 확인 (`sudo tail -f /var/log/nginx/error.log`)

---
**🎉 성공적인 배포를 위해 단계별로 진행하세요!**