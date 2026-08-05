import React from 'react';

export function CardSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse w-full">
      <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full w-24 mb-4"></div>
      <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full max-w-[360px] mb-2.5"></div>
      <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full mb-2.5"></div>
      <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full max-w-[330px] mb-2.5"></div>
      <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full max-w-[300px] mb-2.5"></div>
      <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full max-w-[360px]"></div>
      <div className="flex items-center justify-between mt-4">
        <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full w-32"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-700 w-8 rounded-full"></div>
      </div>
    </div>
  );
}

// Export with different name for backward compatibility
export const LawyerCardSkeleton = CardSkeleton;

export default CardSkeleton;
