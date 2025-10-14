import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Badge component for displaying contract radicado number
 * @param {Object} props
 * @param {number|string} props.radicado - The contract ID/radicado number
 * @param {string} props.position - Position of badge: 'center' or 'topRight'
 * @param {string} props.className - Additional CSS classes
 */
export const Badge = ({ radicado, position = 'center', className }) => {
  if (radicado == null) return null;

  const positionClasses = {
    center: 'top-2 left-1/2 transform -translate-x-1/2',
    topRight: 'top-2 right-4'
  };

  return (
    <div 
      className={cn(
        'absolute z-10 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold shadow',
        positionClasses[position] || positionClasses.center,
        className
      )}
    >
      Radicado: {radicado}
    </div>
  );
};

export default Badge;
