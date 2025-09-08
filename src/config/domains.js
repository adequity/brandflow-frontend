// 도메인 매핑 설정 파일
// 새로운 도메인이 생기면 여기에만 추가하면 됩니다

export const DOMAIN_MAPPINGS = {
  // Netlify 프로덕션 도메인들
  'brandflo.netlify.app': {
    backend: 'https://brandflow-backend-production-99ae.up.railway.app',
    environment: 'production'
  },
  
  // 커스텀 도메인 (미래 대비)
  'brandflow.app': {
    backend: 'https://brandflow-backend-production-99ae.up.railway.app',
    environment: 'production'
  },
  'www.brandflow.app': {
    backend: 'https://brandflow-backend-production-99ae.up.railway.app',
    environment: 'production'
  },
  
  // 개발 환경 (HTTP 완전 차단 - Railway HTTPS로 통일)
  'localhost': {
    backend: 'https://brandflow-backend-production-99ae.up.railway.app',
    environment: 'development'
  },
  '127.0.0.1': {
    backend: 'https://brandflow-backend-production-99ae.up.railway.app', 
    environment: 'development'
  },
  
  // 스테이징 환경 (미래 대비)
  'staging-brandflow.netlify.app': {
    backend: 'https://brandflow-staging.railway.app',
    environment: 'staging'
  }
};

// 기본 백엔드 URL (매핑에서 찾지 못한 경우)
export const DEFAULT_BACKEND_URL = 'https://brandflow-backend-production-99ae.up.railway.app';

// 백엔드 URL 자동 결정 함수
export const getBackendUrlByDomain = (hostname) => {
  const config = DOMAIN_MAPPINGS[hostname];
  let backendUrl;
  
  if (config) {
    console.log(`🌐 도메인 매핑: ${hostname} → ${config.backend} (${config.environment})`);
    backendUrl = config.backend;
  } else {
    console.log(`⚠️ 알 수 없는 도메인: ${hostname}, 기본 URL 사용: ${DEFAULT_BACKEND_URL}`);
    backendUrl = DEFAULT_BACKEND_URL;
  }
  
  // HTTPS만 허용 - HTTP 완전 차단
  if (backendUrl && !backendUrl.startsWith('https://')) {
    console.log(`🔒 비HTTPS URL 차단, 기본값 사용: ${backendUrl} → ${DEFAULT_BACKEND_URL}`);
    return DEFAULT_BACKEND_URL;
  }
  
  return backendUrl;
};