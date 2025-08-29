import React from 'react';

const ContractDetailSkeleton = () => {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 animate-pulse">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header Card Skeleton */}
        <div className="bg-card rounded-3xl shadow-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-muted"></div>
              <div>
                <div className="h-8 bg-muted rounded w-64 mb-2"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 bg-muted rounded-lg w-32"></div>
              <div className="h-10 bg-muted rounded-lg w-24"></div>
            </div>
          </div>
          {/* Contract Details Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted h-24"></div>
              <div className="p-4 rounded-xl bg-muted h-24"></div>
              <div className="p-4 rounded-xl bg-muted h-24"></div>
              <div className="p-4 rounded-xl bg-muted h-24"></div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted h-24"></div>
              <div className="p-4 rounded-xl bg-muted h-24"></div>
              <div className="p-4 rounded-xl bg-muted h-24"></div>
              <div className="p-4 rounded-xl bg-muted h-24"></div>
              <div className="p-4 rounded-xl bg-muted h-24"></div>
            </div>
          </div>
        </div>
        {/* Files Section Skeleton */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 mb-8">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="space-y-3">
            <div className="h-12 bg-muted rounded-xl"></div>
            <div className="h-12 bg-muted rounded-xl"></div>
            <div className="h-12 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailSkeleton;