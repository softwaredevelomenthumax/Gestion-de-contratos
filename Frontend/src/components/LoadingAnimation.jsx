import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../assets/animations/Loading.json';

const LoadingAnimation = ({ 
  size = 'medium', 
  className = ''
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 160, height: 160 };
      case 'large':
        return { width: 400, height: 400 };
      case 'medium':
      default:
        return { width: 240, height: 240 };
    }
  };

  const sizeConfig = getSize();

  return (
    <div className={`flex flex-col items-center justify-center py-10 ${className}`}>
      <Lottie
        animationData={loadingAnimation}
        style={{
          width: sizeConfig.width,
          height: sizeConfig.height,
        }}
        loop={true}
        autoplay={true}
      />
      <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium text-lg">
        Cargando
      </p>
    </div>
  );
};

export default LoadingAnimation;
