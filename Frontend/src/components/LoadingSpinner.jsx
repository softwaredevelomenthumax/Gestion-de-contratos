import React from 'react';

/**
 * Componente de Loading Spinner optimizado y reutilizable
 * Múltiples variantes y tamaños
 */
const LoadingSpinner = ({
  size = 'md',
  variant = 'spinner',
  color = 'primary',
  text = null,
  fullScreen = false,
  className = '',
}) => {
  // Tamaños
  const sizes = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  // Colores
  const colors = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    gray: 'border-gray-500',
    white: 'border-white',
  };

  const sizeClass = sizes[size] || sizes.md;
  const colorClass = colors[color] || colors.primary;

  // Spinner básico
  const SpinnerBasic = () => (
    <div
      className={\nimate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 \ \ border-t-transparent\}
      role="status"
      aria-label="Loading"
    />
  );

  // Spinner con pulso
  const SpinnerPulse = () => (
    <div className={\elative \\}>
      <div className={\bsolute inset-0 animate-ping rounded-full bg-current opacity-25 \\} />
      <div className={\elative animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 \ border-t-transparent\} />
    </div>
  );

  // Dots animados
  const SpinnerDots = () => (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={\ounded-full bg-current \ \ animate-bounce\}
          style={{ animationDelay: \\s\ }}
        />
      ))}
    </div>
  );

  // Bars animados
  const SpinnerBars = () => (
    <div className="flex items-end gap-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={\w-1 bg-current \ animate-pulse\}
          style={{
            height: \\px\,
            animationDelay: \\s\,
          }}
        />
      ))}
    </div>
  );

  // Seleccionar variante
  const renderSpinner = () => {
    switch (variant) {
      case 'pulse':
        return <SpinnerPulse />;
      case 'dots':
        return <SpinnerDots />;
      case 'bars':
        return <SpinnerBars />;
      case 'spinner':
      default:
        return <SpinnerBasic />;
    }
  };

  // Contenedor
  const content = (
    <div className={\lex flex-col items-center justify-center gap-3 \\}>
      {renderSpinner()}
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  // Full screen overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

/**
 * Loading Skeleton para listas
 */
export const LoadingSkeleton = ({ count = 3, height = 'h-20', className = '' }) => {
  return (
    <div className={\space-y-3 \\}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={\\ w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700\}
        />
      ))}
    </div>
  );
};

/**
 * Loading Cards para grids
 */
export const LoadingCards = ({ count = 6, className = '' }) => {
  return (
    <div className={\grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 \\}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3"
        >
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-24 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
