import React from 'react';

/**
 * Viewers component for displaying contract viewers (lawyer variant)
 * @param {Object} props
 * @param {Array} props.viewers - Array of viewer objects with firstName, lastName, id
 */
export const Viewers = ({ viewers }) => {
  if (!Array.isArray(viewers) || viewers.length === 0) {
    return (
      <div>
        <span className="text-xs text-muted-foreground mb-2 block">Visualizado por:</span>
        <span className="text-xs text-muted-foreground">Nadie ha visto este contrato aún.</span>
      </div>
    );
  }

  return (
    <div>
      <span className="text-xs text-muted-foreground mb-2 block">Visualizado por:</span>
      <div className="flex -space-x-2">
        {viewers.slice(0, 5).map((viewer) => (
          <div 
            key={viewer.id} 
            className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
            title={`${viewer.firstName} ${viewer.lastName}`}
          >
            {viewer.firstName?.[0] || ''}{viewer.lastName?.[0] || ''}
          </div>
        ))}
        {viewers.length > 5 && (
          <div 
            className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-200 text-xs font-medium border-2 border-white dark:border-gray-800"
            title={`${viewers.length - 5} más`}
          >
            +{viewers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};

export default Viewers;
