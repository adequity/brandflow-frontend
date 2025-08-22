// Performance optimization utilities
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Debounce hook for search inputs and API calls
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized component wrapper for preventing unnecessary re-renders
export const withMemo = (Component, areEqual) => {
  return React.memo(Component, areEqual);
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  return {
    visibleItems,
    visibleStart,
    totalHeight: items.length * itemHeight,
    offsetY: visibleStart * itemHeight,
    setScrollTop
  };
};

// API request caching
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export const useApiCache = (key, fetcher, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const cacheKey = JSON.stringify({ key, dependencies });
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await fetcher();
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};

// Lazy image loading hook
export const useLazyImage = (src, placeholder = '') => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const image = new Image();
          image.onload = () => setLoaded(true);
          image.onerror = () => setError(true);
          image.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);
    return () => observer.disconnect();
  }, [src]);

  return { loaded, error, imgRef };
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const end = performance.now();
      console.log(`🔥 ${name}: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`❌ ${name} 실패 (${(end - start).toFixed(2)}ms):`, error);
      throw error;
    }
  };
};

// Batch API requests
export const batchRequests = (requests, batchSize = 3) => {
  const batches = [];
  for (let i = 0; i < requests.length; i += batchSize) {
    batches.push(requests.slice(i, i + batchSize));
  }
  
  return batches.reduce(async (previousBatch, currentBatch) => {
    await previousBatch;
    return Promise.all(currentBatch);
  }, Promise.resolve());
};

export default {
  useDebounce,
  withMemo,
  useVirtualScrolling,
  useApiCache,
  useLazyImage,
  measurePerformance,
  batchRequests
};