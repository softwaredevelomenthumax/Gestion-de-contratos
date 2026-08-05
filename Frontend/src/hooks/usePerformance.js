import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para monitorear performance de componentes
 * Útil para identificar bottlenecks y optimizar
 * 
 * @param {string} componentName - Nombre del componente a monitorear
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones de performance
 * 
 * @example
 * const { measureRender, measureAsync } = usePerformance('MyComponent');
 * 
 * useEffect(() => {
 *   measureRender();
 * }, [deps]);
 */
export const usePerformance = (componentName, { enabled = process.env.NODE_ENV === 'development' } = {}) => {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    renderCountRef.current++;
    
    if (renderCountRef.current === 1) {
      mountTimeRef.current = performance.now();
    }

    // Log render info
    if (renderCountRef.current > 10) {
      console.warn(
        `⚠️ [${componentName}] Ha renderizado ${renderCountRef.current} veces. Considera usar React.memo o useMemo.`
      );
    }
  });

  // Medir tiempo de render
  const measureRender = useCallback((label = 'render') => {
    if (!enabled) return;

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16) { // Más de 16ms (60fps threshold)
        console.warn(
          `⚠️ [${componentName}] ${label} tomó ${duration.toFixed(2)}ms (esperado < 16ms para 60fps)`
        );
      } else {
        console.log(
          `✅ [${componentName}] ${label} tomó ${duration.toFixed(2)}ms`
        );
      }
    };
  }, [componentName, enabled]);

  // Medir operaciones asíncronas
  const measureAsync = useCallback(async (fn, label = 'async operation') => {
    if (!enabled) return fn();

    const startTime = performance.now();
    
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(
        `📊 [${componentName}] ${label} completó en ${duration.toFixed(2)}ms`
      );
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(
        `❌ [${componentName}] ${label} falló después de ${duration.toFixed(2)}ms`,
        error
      );
      
      throw error;
    }
  }, [componentName, enabled]);

  // Detectar re-renders innecesarios
  const whyDidYouRender = useCallback((props, prevProps) => {
    if (!enabled || !prevProps) return;

    const changedProps = Object.keys(props).filter(
      key => props[key] !== prevProps[key]
    );

    if (changedProps.length > 0) {
      console.log(
        `🔄 [${componentName}] Re-renderizó por cambios en:`,
        changedProps
      );
    }
  }, [componentName, enabled]);

  return {
    measureRender,
    measureAsync,
    whyDidYouRender,
    renderCount: renderCountRef.current,
    mountTime: mountTimeRef.current,
  };
};

/**
 * Hook para medir Web Vitals
 * Monitorea métricas clave de rendimiento
 */
export const useWebVitals = (callback) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Medir LCP (Largest Contentful Paint)
    const measureLCP = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            callback({
              name: 'LCP',
              value: lastEntry.renderTime || lastEntry.loadTime,
              rating: lastEntry.renderTime < 2500 ? 'good' : lastEntry.renderTime < 4000 ? 'needs-improvement' : 'poor',
            });
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          return () => observer.disconnect();
        } catch (e) {
          console.error('Error measuring LCP:', e);
        }
      }
    };

    // Medir FID (First Input Delay)
    const measureFID = () => {
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              callback({
                name: 'FID',
                value: entry.processingStart - entry.startTime,
                rating: entry.processingStart - entry.startTime < 100 ? 'good' : entry.processingStart - entry.startTime < 300 ? 'needs-improvement' : 'poor',
              });
            });
          });
          
          observer.observe({ entryTypes: ['first-input'] });
          
          return () => observer.disconnect();
        } catch (e) {
          console.error('Error measuring FID:', e);
        }
      }
    };

    // Medir CLS (Cumulative Layout Shift)
    const measureCLS = () => {
      if ('PerformanceObserver' in window) {
        try {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
                
                callback({
                  name: 'CLS',
                  value: clsValue,
                  rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
                });
              }
            });
          });
          
          observer.observe({ entryTypes: ['layout-shift'] });
          
          return () => observer.disconnect();
        } catch (e) {
          console.error('Error measuring CLS:', e);
        }
      }
    };

    const cleanupLCP = measureLCP();
    const cleanupFID = measureFID();
    const cleanupCLS = measureCLS();

    return () => {
      cleanupLCP?.();
      cleanupFID?.();
      cleanupCLS?.();
    };
  }, [callback]);
};

export default usePerformance;
