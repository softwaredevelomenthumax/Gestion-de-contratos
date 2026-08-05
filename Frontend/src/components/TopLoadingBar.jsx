import React, { useState, useEffect } from 'react';
import { useNavigation } from 'react-router-dom';

/**
 * Barra de carga simple en la parte superior que aparece durante la navegación
 */
const TopLoadingBar = () => {
  const navigation = useNavigation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (navigation.state === 'loading') {
      setProgress(0);
      
      // Progreso gradual mientras carga
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 20;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      // Completar al 100% cuando termina
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 300);
      return () => clearTimeout(timer);
    }
  }, [navigation.state]);

  if (progress === 0) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-1 bg-cyan-500 z-[9999] transition-all duration-300"
      style={{ 
        width: `${progress}%`,
        boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)'
      }}
    />
  );
};

export default TopLoadingBar;
