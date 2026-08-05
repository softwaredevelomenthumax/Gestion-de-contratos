import React from 'react';
import { cn } from '../../lib/utils';

/**
 * IconBlock component for displaying the contract icon
 * @param {Object} props
 * @param {string} props.size - Size variant: 'small' or 'large'
 * @param {string} props.className - Additional CSS classes
 */
export const IconBlock = ({ size = 'large', className }) => {
  const sizeClasses = {
    small: 'h-10 w-10',
    large: 'h-12 w-12'
  };

  const iconSizeClasses = {
    small: 'h-6 w-6',
    large: 'h-7 w-7'
  };

  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md',
        sizeClasses[size] || sizeClasses.large,
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconSizeClasses[size] || iconSizeClasses.large}
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
  );
};

export default IconBlock;
