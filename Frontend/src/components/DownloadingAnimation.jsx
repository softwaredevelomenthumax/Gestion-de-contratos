import React from 'react';
import Lottie from 'lottie-react';
import downloadingAnimation from '../assets/animations/downloading.json';

const DownloadingAnimation = ({
  isVisible = false,
  size = 'medium',
  message = 'Descargando archivo...',
  className = ''
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 120, height: 120 };
      case 'large':
        return { width: 300, height: 300 };
      case 'medium':
      default:
        return { width: 200, height: 200 };
    }
  };

  const sizeConfig = getSize();

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center space-y-4 max-w-sm mx-4">
        <Lottie
          animationData={downloadingAnimation}
          style={{
            width: sizeConfig.width,
            height: sizeConfig.height,
          }}
          loop={true}
          autoplay={true}
        />
        <p className="text-gray-700 dark:text-gray-300 font-medium text-center">
          {message}
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default DownloadingAnimation;
