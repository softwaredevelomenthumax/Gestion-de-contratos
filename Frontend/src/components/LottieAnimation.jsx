import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

/**
 * Componente Lottie optimizado con carga diferida
 * Solo carga la animación cuando el componente es visible
 */
const LottieAnimation = ({ 
  animationData, 
  loop = true, 
  autoplay = true, 
  speed = 1,
  width = '100%', 
  height = '100%',
  className = '',
  style = {},
  lazy = true, // Nueva prop para controlar lazy loading
  ...props 
}) => {
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!lazy) return;

    // Intersection Observer para detectar cuando el componente es visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldLoad) {
            setShouldLoad(true);
            setIsInView(true);
          }
        });
      },
      {
        rootMargin: '50px', // Cargar 50px antes de que sea visible
        threshold: 0.1,
      }
    );

    const element = document.getElementById(`lottie-${animationData?.nm || 'animation'}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [lazy, shouldLoad, animationData]);

  return (
    <div 
      id={`lottie-${animationData?.nm || 'animation'}`}
      className={className}
      style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        ...style 
      }}
    >
      {shouldLoad ? (
        <Lottie
          animationData={animationData}
          loop={loop}
          autoplay={autoplay}
          speed={speed}
          style={{ width: '100%', height: '100%' }}
          {...props}
        />
      ) : (
        // Placeholder mientras se carga
        <div 
          className="bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};

export default LottieAnimation;
