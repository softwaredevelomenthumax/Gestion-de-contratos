import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Indicador visual de navegación REAL que aparece cuando cambia la ruta
 * Se oculta solo cuando la página realmente ha cargado completamente
 */
const NavigationIndicator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();
  const isFirstRender = useRef(true);
  const progressIntervalRef = useRef(null);
  const loadStartTimeRef = useRef(0);
  const navigationStartedRef = useRef(false);

  // Función para limpiar timers
  const clearTimers = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Función para iniciar el indicador
  const startLoading = useCallback(() => {
    if (navigationStartedRef.current) return; // Prevenir múltiples activaciones
    
    console.log('🚀 Iniciando carga REAL - esperando a que la página cargue');
    navigationStartedRef.current = true;
    loadStartTimeRef.current = Date.now();
    
    clearTimers();
    setIsLoading(true);
    setProgress(10);

    // Progreso gradual pero más lento (NO completa automáticamente)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        // Progreso más lento: máximo 90%, nunca llega a 100 automáticamente
        if (prev >= 90) return 90;
        return prev + Math.random() * 8;
      });
    }, 150);
  }, [clearTimers]);

  // Función para completar el indicador cuando la página realmente cargó
  const completeLoading = useCallback(() => {
    if (!navigationStartedRef.current) return;
    
    const loadTime = Date.now() - loadStartTimeRef.current;
    console.log('✅ Página cargada completamente en', loadTime, 'ms');
    
    clearTimers();
    setProgress(100);
    
    // Ocultar después de un breve delay
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
      navigationStartedRef.current = false;
      console.log('👋 Indicador ocultado');
    }, 300);
  }, [clearTimers]);

  // Escuchar clicks en TODOS los links de la página
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a');
      if (link && link.href && !link.target) {
        const currentUrl = window.location.href;
        const targetUrl = link.href;
        
        if (targetUrl.startsWith(window.location.origin) && targetUrl !== currentUrl) {
          console.log('🖱️ Click en link:', link.href);
          startLoading();
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
      clearTimers();
    };
  }, [startLoading, clearTimers]);

  // Detectar cuando la navegación realmente completa (location + DOM listo)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      console.log('✅ NavigationIndicator montado en:', location.pathname);
      return;
    }

    console.log('📍 Location cambió a:', location.pathname);
    
    // Si no se había iniciado la carga, iniciarla ahora
    if (!navigationStartedRef.current) {
      startLoading();
    }

    // Timeout de seguridad: si después de 3 segundos no ha cargado, forzar el cierre
    const safetyTimeout = setTimeout(() => {
      if (navigationStartedRef.current) {
        console.log('⚠️ Timeout de seguridad: forzando cierre del indicador');
        completeLoading();
      }
    }, 3000);

    // Esperar a que React termine de renderizar y el DOM esté listo
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Verificar si hay imágenes cargando
        const images = document.images;
        const imagesLoaded = Array.from(images).every(img => img.complete);
        
        if (imagesLoaded) {
          clearTimeout(safetyTimeout);
          completeLoading();
        } else {
          // Esperar a que todas las imágenes carguen
          Promise.all(
            Array.from(images)
              .filter(img => !img.complete)
              .map(
                img =>
                  new Promise(resolve => {
                    img.onload = img.onerror = resolve;
                  })
              )
          ).then(() => {
            clearTimeout(safetyTimeout);
            completeLoading();
          });
        }
      }, 100); // Pequeño delay para asegurar que React Suspense terminó
    });

    return () => clearTimeout(safetyTimeout);
  }, [location.pathname, location.search, location.hash, startLoading, completeLoading])

  if (!isLoading) return null;

  return (
    <>
      {/* Barra de progreso superior */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 z-[9999] transition-all duration-200 ease-out"
        style={{ 
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.4)'
        }}
      />
      
      {/* Indicador flotante opcional */}
      <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-500 border-t-transparent" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Cargando...
          </span>
        </div>
      </div>
    </>
  );
};

export default NavigationIndicator;
