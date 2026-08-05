import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente de imagen optimizada con lazy loading y placeholder
 * Reduce el impacto en network cargando imágenes solo cuando son visibles
 */
const OptimizedImage = ({ 
  src, 
  alt = '', 
  className = '',
  width,
  height,
  loading = 'lazy', // 'lazy' | 'eager'
  placeholder = 'blur', // 'blur' | 'empty' | custom component
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Si la imagen ya está en caché, marcarla como cargada inmediatamente
    if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
      setIsLoaded(true);
    }
  }, []);

  const handleLoad = (e) => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setHasError(true);
    setIsLoaded(false);
    onError?.(e);
  };

  const baseClasses = 'transition-opacity duration-300';
  const loadedClasses = isLoaded ? 'opacity-100' : 'opacity-0';
  const finalClassName = ${baseClasses}  ;

  return (
    <div 
      className="relative inline-block overflow-hidden"
      style={{ width, height }}
    >
      {/* Placeholder mientras carga */}
      {!isLoaded && !hasError && placeholder === 'blur' && (
        <div 
          className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Imagen principal */}
      {!hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          width={width}
          height={height}
          className={finalClassName}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
          {...props}
        />
      )}

      {/* Fallback si falla la carga */}
      {hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400"
          aria-label={Error cargando imagen: }
        >
          <svg 
            className="w-12 h-12" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
