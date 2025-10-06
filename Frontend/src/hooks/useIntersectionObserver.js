import { useEffect, useRef, useState } from 'react';

/**
 * Hook para detectar cuando un elemento es visible en el viewport
 * Útil para scroll infinito, lazy loading, animaciones on-scroll, etc.
 * 
 * @param {Object} options - Opciones del Intersection Observer
 * @returns {Array} [ref, isIntersecting, entry]
 * 
 * @example
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 0.5 });
 * 
 * <div ref={ref}>
 *   {isVisible && <ExpensiveComponent />}
 * </div>
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Crear observer
    observerRef.current = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    });

    // Observar elemento
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [options.threshold, options.rootMargin, options.root]);

  return [elementRef, isIntersecting, entry];
};

/**
 * Hook para scroll infinito
 * Detecta cuando el usuario llega al final de la lista
 * 
 * @param {Function} callback - Función a ejecutar cuando llegue al final
 * @param {Object} options - Opciones de configuración
 * @returns {Object} ref y estado de loading
 * 
 * @example
 * const { ref, loading } = useInfiniteScroll(() => loadMoreItems(), { hasMore: true });
 * 
 * <div>
 *   {items.map(item => <Item key={item.id} />)}
 *   <div ref={ref}>Loading more...</div>
 * </div>
 */
export const useInfiniteScroll = (callback, { hasMore = true, threshold = 0.1 } = {}) => {
  const [loading, setLoading] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver({ threshold });

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      setLoading(true);
      
      Promise.resolve(callback())
        .then(() => {
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error loading more items:', error);
          setLoading(false);
        });
    }
  }, [isIntersecting, hasMore, loading, callback]);

  return { ref, loading };
};

/**
 * Hook para lazy loading de imágenes
 * Carga imágenes solo cuando están cerca del viewport
 * 
 * @param {string} src - URL de la imagen
 * @param {Object} options - Opciones del observer
 * @returns {Object} Estado y ref de la imagen
 * 
 * @example
 * const { ref, src: loadedSrc, isLoading } = useLazyImage('/path/to/image.jpg');
 * 
 * <img ref={ref} src={loadedSrc} alt="..." />
 */
export const useLazyImage = (src, options = {}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver(options);

  useEffect(() => {
    if (!isIntersecting || !src) return;

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isIntersecting, src]);

  return {
    ref,
    src: imageSrc,
    isLoading,
    hasError,
  };
};

export default useIntersectionObserver;
