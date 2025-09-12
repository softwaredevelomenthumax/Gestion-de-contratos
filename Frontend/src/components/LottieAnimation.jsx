import React from 'react';
import Lottie from 'lottie-react';

const LottieAnimation = ({ 
  animationData, 
  loop = true, 
  autoplay = true, 
  speed = 1,
  width = '100%', 
  height = '100%',
  className = '',
  style = {},
  ...props 
}) => {
  return (
    <div 
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
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        speed={speed}
        style={{ width: '100%', height: '100%' }}
        {...props}
      />
    </div>
  );
};

export default LottieAnimation;
