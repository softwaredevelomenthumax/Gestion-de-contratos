import React, { memo, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Optimized input component for Login/Register pages
const OptimizedInput = memo(({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  isValid = true,
  isTouched = false,
  errorMessage,
  successMessage,
  className = '',
  ...props
}) => {
  // Memoize styles to prevent recreation on every render
  const styles = useMemo(() => ({
    base: "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white",
    error: "border-2 border-red-500 focus:border-red-500 focus:ring-red-500",
    success: "border-2 border-green-500 focus:border-green-500 focus:ring-green-500",
    label: "block text-sm font-medium text-gray-200 mb-1",
    errorText: "text-red-400 text-sm animate-fade-in mt-1",
    successText: "text-green-400 text-sm animate-fade-in mt-1"
  }), []);

  // Memoize computed className to prevent recalculation
  const inputClassName = useMemo(() => {
    return cn(
      styles.base,
      isTouched && !isValid && styles.error,
      isTouched && isValid && successMessage && styles.success,
      className
    );
  }, [styles.base, styles.error, styles.success, isTouched, isValid, successMessage, className]);

  // Memoize error/success display logic
  const showError = isTouched && !isValid && errorMessage;
  const showSuccess = isTouched && isValid && successMessage;

  return (
    <div className="mb-2">
      <Label htmlFor={id} className={styles.label}>
        {label}
      </Label>
      <Input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={!isValid && isTouched}
        aria-describedby={showError ? `${id}-error` : showSuccess ? `${id}-success` : undefined}
        className={inputClassName}
        placeholder={placeholder}
        autoComplete={autoComplete}
        {...props}
      />
      {showError && (
        <div id={`${id}-error`} className={styles.errorText}>
          {errorMessage}
        </div>
      )}
      {showSuccess && (
        <div id={`${id}-success`} className={styles.successText}>
          {successMessage}
        </div>
      )}
    </div>
  );
});

OptimizedInput.displayName = 'OptimizedInput';

export default OptimizedInput;
