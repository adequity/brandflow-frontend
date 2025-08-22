# 🚀 BrandFlow 성능 최적화 가이드

## 현재 상황
- 개발 중에는 더미 데이터 사용으로 빠른 로딩
- 실제 배포 시 백엔드 연결 필요
- 웹사이트 오픈을 위한 성능 최적화 필요

## 1. 프론트엔드 최적화

### 1.1 React Query 도입 (필수)
```bash
npm install @tanstack/react-query
```

```javascript
// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000,   // 10분
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 1.2 최적화된 API Hook 예시
```javascript
// src/hooks/useCampaigns.js
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export const useCampaigns = (filters = {}) => {
  return useQuery({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      const response = await api.get('/api/campaigns', { 
        params: { 
          ...filters,
          limit: 20,
          fields: 'id,name,status,createdAt,managerId'
        }
      });
      return response.data;
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2분간 재요청 안함
  });
};

// 사용법
const CampaignListPage = () => {
  const { data: campaigns, isLoading, error } = useCampaigns();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  
  return <CampaignList campaigns={campaigns} />;
};
```

### 1.3 페이지네이션 구현
```javascript
// src/hooks/usePaginatedData.js
export const usePaginatedCampaigns = (page = 1, filters = {}) => {
  return useQuery({
    queryKey: ['campaigns', 'paginated', page, filters],
    queryFn: () => api.get('/api/campaigns', {
      params: { 
        page, 
        limit: 20, 
        ...filters 
      }
    }),
    keepPreviousData: true, // 페이지 전환 시 이전 데이터 유지
  });
};
```

## 2. 백엔드 최적화

### 2.1 데이터베이스 최적화
```sql
-- 필수 인덱스들
CREATE INDEX idx_campaigns_status_created ON campaigns(status, created_at);
CREATE INDEX idx_users_role_company ON users(role, company_id);
CREATE INDEX idx_purchases_status_amount ON purchase_requests(status, amount);
CREATE INDEX idx_monthly_incentives_year_month ON monthly_incentives(year, month, user_id);

-- 복합 쿼리 최적화
CREATE INDEX idx_campaigns_manager_status ON campaigns(manager_id, status) WHERE deleted_at IS NULL;
```

### 2.2 API 응답 최적화
```javascript
// 백엔드 API 최적화 예시
app.get('/api/campaigns', async (req, res) => {
  const { page = 1, limit = 20, fields, ...filters } = req.query;
  
  // 필요한 필드만 선택
  const selectFields = fields ? fields.split(',') : ['id', 'name', 'status', 'created_at'];
  
  try {
    const campaigns = await Campaign.findAndCountAll({
      attributes: selectFields,
      where: buildWhereClause(filters),
      include: [{
        model: User,
        as: 'Manager',
        attributes: ['name']
      }],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      data: campaigns.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(campaigns.count / limit),
        totalItems: campaigns.count
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2.3 Redis 캐싱 구현
```javascript
// Redis 캐싱 미들웨어
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.sendResponse = res.json;
      res.json = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// 사용법
app.get('/api/campaigns', cacheMiddleware(300), getCampaigns);
```

## 3. 번들 최적화

### 3.1 Vite 설정 최적화
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
```

### 3.2 코드 분할
```javascript
// src/App.jsx
import { lazy, Suspense } from 'react';

// 페이지별 코드 분할
const CampaignListPage = lazy(() => import('./pages/CampaignListPage'));
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

const App = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/campaigns" element={<CampaignListPage />} />
      <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
      <Route path="/users" element={<UserManagement />} />
    </Routes>
  </Suspense>
);
```

## 4. 실제 구현 체크리스트

### 프론트엔드
- [ ] React Query 설치 및 설정
- [ ] API 호출을 React Query hooks로 변경
- [ ] 페이지네이션 구현
- [ ] 컴포넌트 메모이제이션 (React.memo, useMemo)
- [ ] 이미지 최적화 (lazy loading, WebP)
- [ ] 코드 분할 구현

### 백엔드
- [ ] 데이터베이스 인덱스 추가
- [ ] API 응답 필드 최적화
- [ ] Redis 캐싱 구현
- [ ] 응답 압축 (gzip)
- [ ] 데이터베이스 커넥션 풀링

### 인프라
- [ ] CDN 설정
- [ ] 이미지 압축 및 최적화
- [ ] HTTP/2 활성화
- [ ] 캐싱 헤더 설정

## 5. 성능 모니터링

### 5.1 프론트엔드 모니터링
```javascript
// src/utils/performance.js
export const measurePageLoad = (pageName) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // 분석 도구로 전송
      if (window.gtag) {
        window.gtag('event', 'page_load_time', {
          custom_parameter: loadTime,
          page_name: pageName
        });
      }
      
      console.log(`${pageName} 로드 시간: ${loadTime}ms`);
    }
  };
};
```

### 5.2 백엔드 모니터링
```javascript
// API 응답 시간 로깅
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
    
    // 느린 쿼리 감지
    if (duration > 1000) {
      console.warn(`Slow API detected: ${req.url} took ${duration}ms`);
    }
  });
  
  next();
});
```

## 6. 배포 최적화

### 6.1 빌드 최적화
```json
{
  "scripts": {
    "build": "vite build",
    "build:analyze": "vite build && npx vite-bundle-analyzer dist/stats.html",
    "preview": "vite preview"
  }
}
```

### 6.2 서버 설정 (nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    # 정적 파일 캐싱
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 캐싱
    location /api/ {
        proxy_pass http://backend;
        proxy_cache my_cache;
        proxy_cache_valid 200 5m;
    }
}
```

## 추천 도구

1. **성능 측정**: Lighthouse, WebPageTest
2. **번들 분석**: Bundle Analyzer
3. **모니터링**: Sentry, Google Analytics
4. **캐싱**: Redis, Memcached
5. **CDN**: Cloudflare, AWS CloudFront

이 가이드를 따라 구현하면 실제 백엔드 연결 시에도 빠른 로딩 속도를 유지할 수 있습니다.