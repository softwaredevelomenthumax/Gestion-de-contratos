import React from 'react';

/**
 * OtrosiBadge component for indicating contracts with otrosí
 * @param {Object} props
 * @param {boolean} props.hasOtrosi - Whether the contract has otrosí
 * @param {string} props.size - Size variant: 'small' or 'normal'
 */
export const OtrosiBadge = ({ hasOtrosi, size = 'normal' }) => {
  if (!hasOtrosi) return null;

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    normal: 'px-2.5 py-0.5 text-xs'
  };

  const iconSizeClasses = {
    small: 'h-3 w-3',
    normal: 'h-3 w-3'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`inline-flex items-center rounded-full font-medium bg-purple-600 text-purple-50 border border-purple-500/20 ${sizeClasses[size] || sizeClasses.normal}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${iconSizeClasses[size] || iconSizeClasses.normal} mr-1`}
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M12 18v-6" />
          <path d="M9 15l3 3 3-3" />
        </svg>
        Tiene Otrosí
      </div>
    </div>
  );
};

export default OtrosiBadge;
