
import { useEffect } from 'react';

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Only monitor in production
    if (process.env.NODE_ENV !== 'production') return;

    // Core Web Vitals monitoring
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          console.log(`Page Load Time: ${entry.duration}ms`);
        }
        
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          console.log(`First Contentful Paint: ${entry.startTime}ms`);
        }
        
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`Largest Contentful Paint: ${entry.startTime}ms`);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }

    return () => observer.disconnect();
  }, []);
};
