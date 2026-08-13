import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Loginform from '../components/Loginform.jsx';
import LanguageSelector from '../components/LanguageSelector';
import { useLanguage } from '../context/LanguageContext';

const Login = memo(() => {
  const { t } = useLanguage();

  // Memoize static content to prevent recreation
  const headerContent = useMemo(() => (
    <div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
        {t.loginTitle}
      </h2>
      <p className="mt-2 text-center text-sm text-gray-400">
        {t.loginSubtitle}
      </p>
    </div>
  ), [t.loginSubtitle, t.loginTitle]);

  const footerContent = useMemo(() => (
    <p className="mt-6 text-center text-sm text-gray-400">
      {t.noAccount}{' '}
      <Link to="/register" className="text-cyan-400 hover:underline font-medium">{t.registerNow}</Link>
    </p>
  ), [t.noAccount, t.registerNow]);

  // Memoize container styles for better performance
  const containerStyles = useMemo(() => ({
    container: "min-h-screen flex items-center justify-center bg-gray-950 py-12 px-4 sm:px-6 lg:px-8",
    card: "max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 transform transition-all duration-300 hover:scale-[1.01]"
  }), []);

  return (
    <div className={containerStyles.container} data-no-runtime-translate>
      <div className="relative w-full max-w-md">
        <div className={containerStyles.card}>
          <div className="absolute top-4 right-4 rounded-full bg-white/5 p-1 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
            <LanguageSelector compact className="shadow-none" />
          </div>
          {headerContent}
          <Loginform />
          {footerContent}
        </div>
      </div>
    </div>
  );
});

Login.displayName = 'Login';

export default Login;
