import React, { createContext, useContext, useMemo, useState } from 'react';
import { updateProfile } from '../api/profile';

const LanguageContext = createContext();

const normalizeLanguageCode = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'es';
  if (raw === 'en' || raw.startsWith('en-') || raw === 'en_us') return 'en';
  if (raw === 'es' || raw.startsWith('es-') || raw === 'es_co') return 'es';
  return 'es';
};

const translations = {
  en: {
    appName: 'Contract Management',
    language: 'Language',
    loginTitle: 'Sign In',
    loginSubtitle: 'Access your account to continue',
    noAccount: "Don't have an account?",
    registerNow: 'Sign up',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    registerTitle: 'Register',
    registerSubtitle: 'Create your account to continue',
    firstName: 'First Name',
    lastName: 'Last Name',
    confirmEmail: 'Confirm Email',
    confirmPassword: 'Confirm Password',
    role: 'Role',
    countryCode: 'Country Code',
    register: 'Register',
    haveAccount: 'Already have an account?',
    signInNow: 'Sign in',
    regularUser: 'Regular User',
    lawyer: 'Lawyer',
    admin: 'Admin',
    signingUp: 'Signing up...',
    statuses: 'Statuses',
    sendContract: 'Send Contract',
    checkInformation: 'Check Information',
    contracts: 'Contracts',
    accountManagement: 'Account Management',
    createAdmin: 'Create Admin',
    signOut: 'Sign Out',
    refresh: 'Refresh',
    pending: 'Pending'
    ,
    selectLanguage: 'Select language',
    additionalInfo: 'Additional information',
    edit: 'Edit',
    profile: 'Profile',
    changePassword: 'Change password',
    languageLabel: 'Language',
    countryLabel: 'Country',
    statusLabel: 'Status'
  },
  es: {
    appName: 'Gestion de Contratos',
    language: 'Idioma',
    loginTitle: 'Iniciar Sesion',
    loginSubtitle: 'Accede a tu cuenta para continuar',
    noAccount: 'No tienes cuenta?',
    registerNow: 'Registrate',
    email: 'Correo Electronico',
    password: 'Contrasena',
    signIn: 'Iniciar Sesion',
    registerTitle: 'Registro',
    registerSubtitle: 'Crea tu cuenta para continuar',
    firstName: 'Nombre',
    lastName: 'Apellido',
    confirmEmail: 'Confirma tu Email',
    confirmPassword: 'Confirma tu Contrasena',
    role: 'Rol',
    countryCode: 'Codigo de Pais',
    register: 'Registrar',
    haveAccount: 'Ya tienes cuenta?',
    signInNow: 'Inicia sesion',
    regularUser: 'Usuario Regular',
    lawyer: 'Abogado',
    admin: 'Administrador',
    signingUp: 'Registrando...',
    statuses: 'Estados',
    sendContract: 'Enviar Contrato',
    checkInformation: 'Consultar Informacion',
    contracts: 'Contratos',
    accountManagement: 'Gestion de cuentas',
    createAdmin: 'Crear administrador',
    signOut: 'Cerrar sesion',
    refresh: 'Actualizar',
    pending: 'Pendiente'
    ,
    selectLanguage: 'Seleccione un idioma',
    additionalInfo: 'Información adicional',
    edit: 'Editar',
    profile: 'Perfil',
    changePassword: 'Cambiar contraseña',
    languageLabel: 'Idioma',
    countryLabel: 'País',
    statusLabel: 'Estado'
  }
};

export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' }
];

export const countries = [
  { code: 'CO', legacyCode: 'COL', name: { es: 'Colombia', en: 'Colombia' } },
  { code: 'US', legacyCode: 'USA', name: { es: 'Estados Unidos', en: 'United States' } },
  { code: 'MX', legacyCode: 'MEX', name: { es: 'México', en: 'Mexico' } },
  { code: 'AR', legacyCode: 'ARG', name: { es: 'Argentina', en: 'Argentina' } },
  { code: 'PE', legacyCode: 'PER', name: { es: 'Perú', en: 'Peru' } },
  { code: 'CL', legacyCode: 'CHL', name: { es: 'Chile', en: 'Chile' } },
  { code: 'EC', legacyCode: 'ECU', name: { es: 'Ecuador', en: 'Ecuador' } }
];

export const displayCountryCode = (code) => {
  const normalizedCode = String(code || '').trim().toUpperCase();
  return countries.find((country) => country.code === normalizedCode || country.legacyCode === normalizedCode)?.code || normalizedCode || code;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => normalizeLanguageCode(localStorage.getItem('language') || 'es'));

  const setLanguage = (nextLanguage) => {
    const value = normalizeLanguageCode(nextLanguage);
    setLanguageState(value);
    localStorage.setItem('language', value);
    document.documentElement.lang = value;
    if (localStorage.getItem('token')) {
      updateProfile({ preferredLanguage: value }).then((profile) => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) localStorage.setItem('user', JSON.stringify({ ...JSON.parse(storedUser), ...profile }));
      }).catch(() => {});
    }
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t: translations[language] || translations.es
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
