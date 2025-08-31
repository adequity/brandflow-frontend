/**
 * Mobile UX Optimizer
 * 모바일 사용자 경험 최적화 유틸리티
 */

class MobileOptimizer {
  constructor() {
    this.isMobile = this.detectMobile();
    this.touchStartTime = 0;
    this.setupMobileOptimizations();
  }

  detectMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  setupMobileOptimizations() {
    if (this.isMobile) {
      this.optimizeTouchInteractions();
      this.optimizeViewport();
      this.optimizeScrolling();
      this.preventZoom();
    }
  }

  // 터치 인터랙션 최적화
  optimizeTouchInteractions() {
    // 300ms 클릭 지연 제거
    document.addEventListener('touchstart', (e) => {
      this.touchStartTime = Date.now();
    });

    document.addEventListener('touchend', (e) => {
      const touchDuration = Date.now() - this.touchStartTime;
      
      // 빠른 터치는 즉시 처리
      if (touchDuration < 200) {
        e.target.click && e.target.click();
      }
    });

    // 터치 피드백 개선
    this.addTouchFeedback();
  }

  addTouchFeedback() {
    const style = document.createElement('style');
    style.textContent = `
      .touch-feedback {
        transition: transform 0.1s ease, background-color 0.1s ease;
      }
      
      .touch-feedback:active {
        transform: scale(0.98);
        background-color: rgba(59, 130, 246, 0.1);
      }
      
      button, .btn, [role="button"] {
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        touch-action: manipulation;
      }
      
      /* 모바일 전용 스타일 */
      @media (max-width: 768px) {
        .desktop-only { display: none !important; }
        
        .table-responsive {
          font-size: 14px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .btn-mobile {
          min-height: 44px;
          min-width: 44px;
          padding: 12px 16px;
        }
        
        .form-mobile input, 
        .form-mobile select, 
        .form-mobile textarea {
          font-size: 16px; /* iOS 줌 방지 */
          min-height: 44px;
        }
        
        .sidebar-mobile {
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }
        
        .sidebar-mobile.open {
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // 뷰포트 최적화
  optimizeViewport() {
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    
    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  }

  // 스크롤 최적화
  optimizeScrolling() {
    // 관성 스크롤 활성화
    document.body.style.cssText += `
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    `;

    // 스크롤 성능 개선을 위한 패시브 리스너
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
  }

  // 의도하지 않은 줌 방지
  preventZoom() {
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    });

    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
    });

    document.addEventListener('gestureend', (e) => {
      e.preventDefault();
    });
  }

  // 테이블 모바일 최적화
  optimizeTable(tableElement) {
    if (!this.isMobile) return;

    const table = tableElement;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-mobile-wrapper';
    wrapper.style.cssText = `
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    `;

    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    
    // 모바일에서 숨길 컬럼 표시
    const headers = table.querySelectorAll('th');
    const rows = table.querySelectorAll('tbody tr');
    
    headers.forEach((header, index) => {
      if (header.classList.contains('mobile-hidden')) {
        rows.forEach(row => {
          const cell = row.cells[index];
          if (cell) cell.classList.add('mobile-hidden');
        });
      }
    });
  }

  // 모바일 네비게이션 최적화
  setupMobileNav() {
    if (!this.isMobile) return;

    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.add('sidebar-mobile');
      
      // 햄버거 메뉴 버튼 생성
      const menuButton = document.createElement('button');
      menuButton.className = 'mobile-menu-btn';
      menuButton.innerHTML = '☰';
      menuButton.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1001;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        width: 44px;
        height: 44px;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      `;

      menuButton.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });

      document.body.appendChild(menuButton);

      // 오버레이 클릭 시 사이드바 닫기
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `;

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
      });

      document.body.appendChild(overlay);
    }
  }

  // 이미지 지연 로딩 최적화
  setupLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
  }

  // 성능 메트릭 전송
  sendMetrics(type, data) {
    // 배치 처리로 서버 부하 최소화
    if (!this.metricsQueue) {
      this.metricsQueue = [];
      
      // 5초마다 배치 전송
      setInterval(() => {
        if (this.metricsQueue.length > 0) {
          fetch('/api/metrics/frontend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.metricsQueue)
          }).catch(() => {}).finally(() => {
            this.metricsQueue = [];
          });
        }
      }, 5000);
    }

    this.metricsQueue.push({ type, data, timestamp: Date.now() });
  }

  // 성능 보고서 생성
  getPerformanceReport() {
    return {
      device: {
        isMobile: this.isMobile,
        userAgent: navigator.userAgent,
        screen: {
          width: window.screen.width,
          height: window.screen.height
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      metrics: this.metrics,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    const avgPageLoad = this.calculateAverage(this.metrics.pageLoads, 'loadTime');
    if (avgPageLoad > 3000) {
      recommendations.push('페이지 로드 시간이 3초를 초과합니다. 코드 분할을 고려하세요.');
    }

    const slowApiCalls = this.metrics.apiCalls.filter(call => call.duration > 1000);
    if (slowApiCalls.length > 0) {
      recommendations.push(`${slowApiCalls.length}개의 느린 API 호출이 감지되었습니다.`);
    }

    return recommendations;
  }

  calculateAverage(array, property) {
    if (array.length === 0) return 0;
    const sum = array.reduce((acc, item) => acc + (item[property] || 0), 0);
    return sum / array.length;
  }
}

// 글로벌 인스턴스 생성
const mobileOptimizer = new MobileOptimizer();

// React 컴포넌트에서 사용할 수 있도록 내보내기
export const useMobileOptimization = () => {
  React.useEffect(() => {
    mobileOptimizer.setupLazyLoading();
    mobileOptimizer.setupMobileNav();
  }, []);

  return {
    isMobile: mobileOptimizer.isMobile,
    measureRender: mobileOptimizer.measureComponentRender.bind(mobileOptimizer),
    measureApi: mobileOptimizer.measureApiCall.bind(mobileOptimizer),
    optimizeTable: mobileOptimizer.optimizeTable.bind(mobileOptimizer)
  };
};

export default mobileOptimizer;