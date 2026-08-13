import React, { useState, memo, useCallback, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

const Loginform = memo(() => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const formRef = useRef(null);
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);

  const onSubmit = useCallback(async (data) => {
    setLoginError(null); // Clear previous errors
    try {
      const trimmedEmail = data.email.trim();
      const trimmedPassword = data.password.trim();
      
      console.log('Attempting login for:', trimmedEmail);
      const result = await login(trimmedEmail, trimmedPassword);
      console.log('Login API result:', result);
      
      if (result.success) {
        console.log('Login successful, navigating to home');
        navigate('/');
      } else {
        console.log('Login failed:', result.error);
        // Show server-provided message, prefer English if selected
        const serverMsg = result.error || (language === 'en' ? 'Unknown login error.' : 'Error de inicio de sesión desconocido.');
        setLoginError(serverMsg);
      }
    } catch (err) {
      console.error('Login exception:', err);
      const networkMsg = err.response?.data?.error || (language === 'en' ? 'Network or server error.' : 'Error de red o servidor.');
      console.error('Login exception details:', err.response?.status, err.response?.data);
      setLoginError(networkMsg);
    }
  }, [login, navigate, language]);

  // Memoize validation rules to prevent recreation
  const emailValidation = useMemo(() => ({
    required: language === 'en' ? 'Email is required' : 'El correo electronico es requerido',
    pattern: {
      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/, 
      message: language === 'en' ? 'Invalid email format' : 'Formato de correo electronico invalido'
    }
  }), [language]);

  const passwordValidation = useMemo(() => ({
    required: language === 'en' ? 'Password is required' : 'La contrasena es requerida',
    minLength: {
      value: 6,
      message: language === 'en' ? 'Password must be at least 6 characters' : 'La contrasena debe tener al menos 6 caracteres'
    }
  }), [language]);

  // Memoize static classes
  const inputBaseClass = useMemo(() => 
    "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white",
    []
  );

  const buttonClass = useMemo(() =>
    "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition ease-in-out duration-300 transform hover:scale-105",
    []
  );

  // Memoize loading spinner
  const loadingSpinner = useMemo(() => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ), []);

  return (
    <form ref={formRef} data-no-runtime-translate onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md mx-auto">
      {loginError && (
        <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">¡Error!</strong>
          <span className="block sm:inline"> {loginError}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
          {t.email}
        </label>
        <input
          id="email"
          type="email"
          {...register('email', emailValidation)}
            data-no-runtime-translate
          className={cn(
            inputBaseClass,
            errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          placeholder={language === 'en' ? 'you@example.com' : 'tu@ejemplo.com'}
          autoComplete="email"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              console.debug('🛈 Enter pressed on email input');
              if (!isSubmitting) {
                // Use the native requestSubmit when available to trigger the form submit
                if (formRef.current?.requestSubmit) {
                  formRef.current.requestSubmit();
                } else {
                  handleSubmit(onSubmit)();
                }
              }
            }
          }}
        />
        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
          {t.password}
        </label>
        <input
          id="password"
          type="password"
          {...register('password', passwordValidation)}
            data-no-runtime-translate
          className={cn(
            inputBaseClass,
            errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          placeholder={language === 'en' ? 'Your password' : 'Tu contrasena'}
          autoComplete="new-password"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              console.debug('🛈 Enter pressed on password input');
              if (!isSubmitting) {
                if (formRef.current?.requestSubmit) {
                  formRef.current.requestSubmit();
                } else {
                  handleSubmit(onSubmit)();
                }
              }
            }
          }}
        />
        {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        data-no-runtime-translate
        disabled={isSubmitting}
        onClick={(e) => {
          // Ensure immediate submit on click, even if translations or re-renders occur
          e.preventDefault();
          console.debug('🛈 Login submit clicked');
          if (!isSubmitting) {
            if (formRef.current?.requestSubmit) {
              formRef.current.requestSubmit();
            } else {
              handleSubmit(onSubmit)();
            }
          }
        }}
        className={cn(
          buttonClass,
          isSubmitting && "opacity-50 cursor-not-allowed"
        )}
      >
        {isSubmitting ? loadingSpinner : t.signIn}
      </button>
    </form>
  );
});

Loginform.displayName = 'Loginform';

export default Loginform;