import React, { memo, useMemo } from 'react';
import Loginform from '../components/Loginform.jsx';

const Login = memo(() => {
  // Memoize static content to prevent recreation
  const headerContent = useMemo(() => (
    <div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
        Iniciar Sesión
      </h2>
      <p className="mt-2 text-center text-sm text-gray-400">
        Accede a tu cuenta para continuar
      </p>
    </div>
  ), []);

  const footerContent = useMemo(() => (
    <p className="mt-6 text-center text-sm text-gray-400">
      ¿No tienes cuenta?{' '}
      <a href="/register" className="text-blue-400 hover:underline font-medium">Regístrate</a>
    </p>
  ), []);

  // Memoize container styles for better performance
  const containerStyles = useMemo(() => ({
    container: "min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4 sm:px-6 lg:px-8",
    card: "max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 transform transition-all duration-300 hover:scale-[1.01]"
  }), []);

  return (
    <div className={containerStyles.container}>
      <div className={containerStyles.card}>
        {headerContent}
        <Loginform />
        {footerContent}
      </div>
    </div>
  );
});

Login.displayName = 'Login';

export default Login;
