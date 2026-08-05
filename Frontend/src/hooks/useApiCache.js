import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para manejo optimizado de llamadas API con caché y revalidación
 * Similar a React Query pero más ligero
 * 
 * @param {Function} apiFn - Función que retorna una promesa (llamada API)
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Estado y funciones de la API
 * 
 * @example
 * const { data, loading, error, refetch } = useApiCache(
 *   () => api.get('/contracts'),
 *   { 
 *     cacheTime: 5 * 60 * 1000, // 5 minutos
 *     refetchOnMount: true,
 *     onSuccess: (data) => console.log('Success', data)
 *   }
 * );
 */
export const useApiCache = (
  apiFn,
  {
    cacheKey = null,
    cacheTime = 5 * 60 * 1000, // 5 minutos por defecto
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    enabled = true,
    onSuccess = null,
    onError = null,
    retry = 0,
    retryDelay = 1000,
  } = {}
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  // Generar cache key si no se proporciona
  const effectiveCacheKey = cacheKey || apiFn.toString();

  // Verificar si hay datos en caché válidos
  const getCachedData = useCallback(() => {
    if (!effectiveCacheKey) return null;
    
    try {
      const cached = sessionStorage.getItem(`api-cache-${effectiveCacheKey}`);
      if (!cached) return null;
      
      const { data: cachedData, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age < cacheTime) {
        return cachedData;
      }
      
      // Caché expirado, eliminarlo
      sessionStorage.removeItem(`api-cache-${effectiveCacheKey}`);
      return null;
    } catch (err) {
      console.error('Error reading cache:', err);
      return null;
    }
  }, [effectiveCacheKey, cacheTime]);

  // Guardar datos en caché
  const setCachedData = useCallback((data) => {
    if (!effectiveCacheKey) return;
    
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(`api-cache-${effectiveCacheKey}`, JSON.stringify(cacheEntry));
    } catch (err) {
      console.error('Error writing cache:', err);
    }
  }, [effectiveCacheKey]);

  // Función para hacer el fetch
  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return;
    
    // Intentar cargar desde caché primero
    const cachedData = getCachedData();
    if (cachedData && !isRetry) {
      setData(cachedData);
      setLastFetchTime(Date.now());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiFn();
      
      if (!mountedRef.current) return;
      
      // Extraer data si viene en response.data
      const responseData = result?.data || result;
      
      setData(responseData);
      setLastFetchTime(Date.now());
      setCachedData(responseData);
      retryCountRef.current = 0;
      
      if (onSuccess) {
        onSuccess(responseData);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      setError(err);
      
      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData(true);
        }, retryDelay * retryCountRef.current);
      } else {
        if (onError) {
          onError(err);
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFn, enabled, getCachedData, setCachedData, onSuccess, onError, retry, retryDelay]);

  // Función para refetch manual
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Función para invalidar caché
  const invalidateCache = useCallback(() => {
    if (effectiveCacheKey) {
      sessionStorage.removeItem(`api-cache-${effectiveCacheKey}`);
    }
  }, [effectiveCacheKey]);

  // Efecto inicial
  useEffect(() => {
    mountedRef.current = true;
    
    if (refetchOnMount || !data) {
      fetchData();
    }

    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      // Solo refetch si han pasado más de 30 segundos desde el último fetch
      if (lastFetchTime && Date.now() - lastFetchTime > 30000) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, fetchData, lastFetchTime]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache,
    isStale: lastFetchTime && Date.now() - lastFetchTime > cacheTime,
  };
};

export default useApiCache;
