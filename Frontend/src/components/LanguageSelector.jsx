import React, { useEffect, useRef, useState } from 'react';
import { useLanguage, supportedLanguages } from '../context/LanguageContext';
import { Globe2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useNavigate } from 'react-router-dom';

const LanguageSelector = ({ className = '', compact = false, fixed = false, sidebar = false }) => {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = supportedLanguages.find((lang) => lang.code === language) || supportedLanguages[0];

  const fixedClass = fixed ? 'fixed top-3 right-3 z-50' : '';

  // Sidebar (expanded) presentation
  if (sidebar) {
    const flagSrc = (code) => {
      if (code === 'en') return '/flags/us.svg';
      if (code === 'es') return '/flags/es.svg';
      return '/flags/co.svg';
    };

    return (
      <div className={`w-full ${className}`}>
        <div className="px-3 py-2">
          <div className="text-xs font-semibold text-gray-400 uppercase mb-2">{t.language}</div>

          <div>
            <button
              type="button"
              onClick={() => setOpen((s) => !s)}
              className="flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium bg-transparent text-foreground border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{t.selectLanguage}</span>
              </div>
              <svg className={`h-4 w-4 transform transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M6 8l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            {open && (
              <div className="mt-2 space-y-2">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => { setLanguage(lang.code); setOpen(false); }}
                    className={`flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm ${language === lang.code ? 'bg-blue-600 text-white' : 'text-foreground hover:bg-gray-100/80 dark:hover:bg-gray-700/80'}`}
                  >
                    <img src={flagSrc(lang.code)} alt={lang.code} className="h-5 w-8 object-cover rounded-sm" />
                    <span>{lang.name}</span>
                    {language === lang.code && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2">{t.additionalInfo}</div>
              <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Tema</span>
                <ThemeToggle />
              </div>
                  <ProfileButton label={t.profile || t.edit} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating / compact presentation (unchanged)
  return (
    <div ref={containerRef} className={`relative ${fixedClass} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-center transition duration-150 ease-out ${compact ? 'h-10 px-3 rounded-md bg-gray-100 border border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200' : 'h-10 px-3 rounded-full bg-slate-950/95 text-white shadow-xl hover:bg-slate-900'}`}
        aria-label={t.language}
      >
        {compact ? (
          // El compact debe ser alargado y mostrar la palabra "Idioma" según solicitud
          <span aria-hidden="true" className="flex items-center space-x-2">
            <span className="text-sm font-medium">Idioma</span>
            <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">{(currentLang.code || 'EN').slice(0,2).toUpperCase()}</span>
          </span>
        ) : (
          <span className="text-sm font-medium">{currentLang.name}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 rounded-md border border-gray-600 bg-gray-800 shadow-lg z-50">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm text-white hover:bg-gray-700 ${language === lang.code ? 'bg-gray-700' : ''}`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

// Simple button component that navigates to profile
function ProfileButton({ label }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      className="text-sm text-foreground hover:underline text-left p-0"
    >
      {label}
    </button>
  );
}
