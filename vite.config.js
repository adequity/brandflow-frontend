import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 기본 React 라이브러리
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }
          
          // UI 라이브러리
          if (id.includes('lucide-react') || id.includes('@tailwindcss')) {
            return 'ui-vendor';
          }
          
          // API 관련
          if (id.includes('axios') || id.includes('api')) {
            return 'api-vendor';
          }
          
          // 페이지별 분할 (대용량 페이지)
          if (id.includes('/pages/AdminUI') || id.includes('/pages/Dashboard')) {
            return 'admin-pages';
          }
          
          if (id.includes('/pages/Campaign') || id.includes('/components/campaigns/')) {
            return 'campaign-pages';
          }
          
          if (id.includes('/pages/Order') || id.includes('/pages/Product') || id.includes('/pages/Sales')) {
            return 'business-pages';
          }
          
          // 모달 컴포넌트들
          if (id.includes('/components/modals/')) {
            return 'modals';
          }
          
          // 유틸리티
          if (id.includes('/utils/') || id.includes('/hooks/')) {
            return 'utils';
          }
          
          // 기타 vendor 패키지들
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0'
  }
})