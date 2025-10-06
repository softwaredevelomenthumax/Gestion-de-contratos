import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce
 * Útil para optimizar búsquedas y reducir llamadas API innecesarias
 * 
 * @param {any} value - El valor a hacer debounce
 * @param {number} delay - El delay en milisegundos (default: 500ms)
 * @returns {any} El valor con debounce aplicado
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     // Hacer llamada API solo después del delay
 *     fetchSearchResults(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Establecer un timeout para actualizar el valor después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timeout si el valor cambia antes del delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para throttle (limita la frecuencia de ejecución)
 * Útil para eventos de scroll, resize, etc.
 * 
 * @param {Function} callback - Función a ejecutar
 * @param {number} delay - Delay mínimo entre ejecuciones
 * @returns {Function} Función con throttle aplicado
 */
export const useThrottle = (callback, delay = 500) => {
  const [lastRun, setLastRun] = useState(Date.now());

  return (...args) => {
    const now = Date.now();
    
    if (now - lastRun >= delay) {
      callback(...args);
      setLastRun(now);
    }
  };
};

export default useDebounce;
