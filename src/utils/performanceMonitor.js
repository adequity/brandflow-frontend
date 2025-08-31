/**
 * Frontend Performance Monitoring
 * 클라이언트 사이드 성능 모니터링 및 최적화
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      componentRenders: [],
      userInteractions: []
    };
    this.isEnabled = process.env.NODE_ENV === 'production';
    
    if (this.isEnabled) {
      this.initializeMonitoring();
    }
  }

  initializeMonitoring() {
    // 페이지 로드 성능 측정
    if (window.performance && window.performance.navigation) {
      window.addEventListener('load', () => {
        setTimeout(() => this.measurePageLoad(), 100);
      });
    }

    // Core Web Vitals 측정
    if ('web-vitals' in window) {
      this.measureCoreWebVitals();
    }

    // 사용자 상호작용 추적
    this.trackUserInteractions();
  }

  measurePageLoad() {
    const navigation = window.performance.getEntriesByType('navigation')[0];
    if (!navigation) return;

    const metrics = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstByte: navigation.responseStart - navigation.requestStart,
      domComplete: navigation.domComplete - navigation.navigationStart,
      resources: window.performance.getEntriesByType('resource').length
    };

    this.metrics.pageLoads.push(metrics);
    this.sendMetrics('page_load', metrics);
  }

  measureCoreWebVitals() {
    // 이 함수는 web-vitals 라이브러리와 함께 사용
    // npm install web-vitals 후 사용 가능
    if (window.webVitals) {
      window.webVitals.getLCP(this.onVital.bind(this));
      window.webVitals.getFID(this.onVital.bind(this));
      window.webVitals.getCLS(this.onVital.bind(this));
      window.webVitals.getFCP(this.onVital.bind(this));
      window.webVitals.getTTFB(this.onVital.bind(this));
    }
  }

  onVital(vital) {
    this.sendMetrics('core_web_vital', {
      name: vital.name,
      value: vital.value,
      rating: vital.rating,
      timestamp: new Date().toISOString()
    });
  }

  trackUserInteractions() {
    // 클릭 이벤트 추적
    document.addEventListener('click', (event) => {
      this.trackInteraction('click', event.target);
    });

    // 폼 제출 추적
    document.addEventListener('submit', (event) => {
      this.trackInteraction('form_submit', event.target);
    });
  }

  trackInteraction(type, target) {
    const interaction = {
      type,
      timestamp: new Date().toISOString(),
      element: this.getElementSelector(target),
      page: window.location.pathname
    };

    this.metrics.userInteractions.push(interaction);
    
    // 즉시 전송하지 않고 배치로 처리
    if (this.metrics.userInteractions.length >= 10) {
      this.flushInteractions();
    }
  }

  getElementSelector(element) {
    if (!element) return 'unknown';
    
    // 안전한 선택자 생성
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += `#${element.id}`;
    } else if (element.className) {
      const classes = element.className.split(' ').slice(0, 2);
      selector += `.${classes.join('.')}`;
    }
    
    return selector;
  }

  // API 호출 성능 측정
  measureApiCall(url, startTime, endTime, success, statusCode) {
    const metrics = {
      url,
      duration: endTime - startTime,
      success,
      statusCode,
      timestamp: new Date().toISOString()
    };

    this.metrics.apiCalls.push(metrics);
    this.sendMetrics('api_call', metrics);
  }

  // 컴포넌트 렌더링 성능 측정
  measureComponentRender(componentName, renderTime) {
    const metrics = {
      component: componentName,
      renderTime,
      timestamp: new Date().toISOString()
    };

    this.metrics.componentRenders.push(metrics);
    
    // 느린 렌더링 경고 (100ms 이상)
    if (renderTime > 100) {
      console.warn(`⚠️ Slow component render: ${componentName} took ${renderTime}ms`);
      this.sendMetrics('slow_render', metrics);
    }
  }

  // 메트릭 서버로 전송
  sendMetrics(type, data) {
    if (!this.isEnabled) return;

    // 백그라운드에서 전송 (사용자 경험에 영향 없음)
    setTimeout(() => {
      fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          data,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(() => {
        // 메트릭 전송 실패는 조용히 처리
      });
    }, 0);
  }

  flushInteractions() {
    if (this.metrics.userInteractions.length > 0) {
      this.sendMetrics('user_interactions', this.metrics.userInteractions);
      this.metrics.userInteractions = [];
    }
  }

  // 성능 리포트 생성
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPageLoads: this.metrics.pageLoads.length,
        totalApiCalls: this.metrics.apiCalls.length,
        totalInteractions: this.metrics.userInteractions.length,
        averagePageLoad: this.calculateAverage(this.metrics.pageLoads, 'loadTime'),
        averageApiResponse: this.calculateAverage(this.metrics.apiCalls, 'duration')
      },
      details: this.metrics
    };

    return report;
  }

  calculateAverage(array, property) {
    if (array.length === 0) return 0;
    const sum = array.reduce((acc, item) => acc + (item[property] || 0), 0);
    return Math.round(sum / array.length);
  }

  // 수동 성능 측정 시작
  startMeasurement(label) {
    if (window.performance) {
      window.performance.mark(`${label}-start`);
    }
  }

  // 수동 성능 측정 종료
  endMeasurement(label) {
    if (window.performance) {
      window.performance.mark(`${label}-end`);
      window.performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measurement = window.performance.getEntriesByName(label)[0];
      if (measurement) {
        console.log(`⚡ ${label}: ${Math.round(measurement.duration)}ms`);
        return measurement.duration;
      }
    }
    return 0;
  }
}

// 글로벌 성능 모니터 인스턴스
const performanceMonitor = new PerformanceMonitor();

// React 개발자 도구에서 사용할 수 있도록 전역 객체에 추가
if (typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
}

export default performanceMonitor;