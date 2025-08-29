import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const Loginform = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);

  const onSubmit = async (data) => {
    setLoginError(null); // Clear previous errors
    try {
      const trimmedEmail = data.email.trim();
      const trimmedPassword = data.password.trim();
      
      console.log('Attempting login for:', trimmedEmail);
      const result = await login(trimmedEmail, trimmedPassword);
      
      if (result.success) {
        console.log('Login successful, navigating to home');
        navigate('/');
      } else {
        console.log('Login failed:', result.error);
        setLoginError(result.error || 'Error de inicio de sesión desconocido.');
      }
    } catch (err) {
      console.error('Login exception:', err);
      setLoginError(err.response?.data?.error || 'Error de red o servidor.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md mx-auto">
      {loginError && (
        <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">¡Error!</strong>
          <span className="block sm:inline"> {loginError}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
          Correo Electrónico
        </label>
        <input
          id="email"
          type="email"
          {...register('email', { required: 'El correo electrónico es requerido', pattern: { value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, message: 'Formato de correo electrónico inválido' } })}
          className={cn(
            "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
            "bg-gray-700 text-white",
            errors.email && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          placeholder="tu@ejemplo.com"
          autoComplete="email"
        />
        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          {...register('password', { required: 'La contraseña es requerida', minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' } })}
          className={cn(
            "mt-1 block w-full px-4 py-2 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
            "bg-gray-700 text-white",
            errors.password && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          placeholder="Tu contraseña"
          autoComplete="new-password"
        />
        {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
          "transition ease-in-out duration-300 transform hover:scale-105",
          isSubmitting && "opacity-50 cursor-not-allowed"
        )}
      >
        {isSubmitting ? (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          'Iniciar Sesión'
        )}
      </button>
    </form>
  );
};

export default Loginform;