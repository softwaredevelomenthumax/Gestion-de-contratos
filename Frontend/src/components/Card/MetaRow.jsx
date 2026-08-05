import React from 'react';
import { cn } from '../../lib/utils';

/**
 * MetaRow component for displaying contract metadata
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon element
 * @param {string} props.label - Label text (optional, for lawyer variant)
 * @param {string} props.value - Value to display
 * @param {string} props.className - Additional CSS classes
 */
export const MetaRow = ({ icon, label, value, className }) => {
  if (!value && value !== 0) return null;

  // Compact variant (icon + value, no label)
  if (!label) {
    return (
      <div className={cn('flex items-start gap-2 text-blue-600 dark:text-blue-400', className)}>
        {icon}
        <span className="break-words whitespace-normal">{value}</span>
      </div>
    );
  }

  // Lawyer variant (label: value)
  return (
    <div className={cn('flex items-start', className)}>
      <span className="w-24 flex-shrink-0 text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground break-words whitespace-normal min-w-0">{value}</span>
    </div>
  );
};

export default MetaRow;
