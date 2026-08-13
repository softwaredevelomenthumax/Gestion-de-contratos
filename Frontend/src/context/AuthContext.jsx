import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import * as authAPI from '../api/auth'; // Use uppercase if your folder is 'API'
import api from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoize token validation to avoid recalculating on every render
  const isTokenExpired = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && !isTokenExpired(token)) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          const parsedUser = storedUser ? JSON.parse(storedUser) : null;
          if (parsedUser && parsedUser.role) {
            setUser(parsedUser);
            if (parsedUser.preferredLanguage && !localStorage.getItem('language')) {
              localStorage.setItem('language', parsedUser.preferredLanguage);
            }
          } else {
            const data = await authAPI.getProfile();
            const normalizedUser = data?.user || data;
            const safeUser = {
              ...normalizedUser,
              id: normalizedUser?.id ?? data?.id,
              email: normalizedUser?.email ?? data?.email,
              firstName: normalizedUser?.firstName ?? data?.firstName,
              lastName: normalizedUser?.lastName ?? data?.lastName,
              role: normalizedUser?.role ?? data?.role ?? 'regular',
              countryCode: normalizedUser?.countryCode ?? data?.countryCode,
              preferredLanguage: normalizedUser?.preferredLanguage ?? data?.preferredLanguage,
            };
            // Normalize avatar to absolute URL if provided by backend
            if (safeUser.avatar && safeUser.avatar.startsWith('/uploads')) {
              const origin = api.defaults.baseURL.replace(/\/api$/, '');
              safeUser.avatar = `${origin}${safeUser.avatar}`;
            }
            setUser(safeUser);
            localStorage.setItem('user', JSON.stringify(safeUser));
          }
        } catch (error) {
          const shouldClearSession = error?.response?.status === 401 || error?.response?.status === 403 || error?.message === 'Network Error';
          if (shouldClearSession) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
            setUser(null);
          }
        } finally {
          setLoading(false);
        }
      } else {
        if (token) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
        }
        setLoading(false);
      }
    };

    initializeAuth();
  }, [isTokenExpired]);

  const login = useCallback(async (email, password) => {
    console.debug('🛈 AuthProvider.login called for:', String(email || '').trim().toLowerCase());
    try {
      setError(null);
      
      // Clear any existing session data FIRST
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      
      const data = await authAPI.login(email, password);
      const loginPayload = data?.user || data;
      const token = data?.token || loginPayload?.token;
      const userData = {
        ...loginPayload,
        id: loginPayload?.id ?? data?.id,
        email: loginPayload?.email ?? data?.email,
        firstName: loginPayload?.firstName ?? data?.firstName,
        lastName: loginPayload?.lastName ?? data?.lastName,
        role: loginPayload?.role ?? data?.role ?? 'regular',
        countryCode: loginPayload?.countryCode ?? data?.countryCode,
        preferredLanguage: loginPayload?.preferredLanguage ?? data?.preferredLanguage,
        token,
      };
      
      // Ensure we have all required user data
      if (!token) {
        throw new Error('Invalid login response');
      }
      
      // Parse the JWT token to validate consistency
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        if (tokenPayload.id !== userData.id) {
          throw new Error(`Token mismatch: Token has ID ${tokenPayload.id} but response has ID ${userData.id}`);
        }
      } catch {
        // Token parsing error
      }
      
      // Set new session data
      const normalizedPreferredLanguage = userData.preferredLanguage ? String(userData.preferredLanguage).trim().toLowerCase() : 'es';
      const normalizedLanguageValue = normalizedPreferredLanguage === 'en' || normalizedPreferredLanguage.startsWith('en-') || normalizedPreferredLanguage === 'en_us'
        ? 'en' : 'es';

      setUser({ ...userData, preferredLanguage: normalizedLanguageValue });
      // Only seed the language from the backend the first time; never override a manual choice.
      if (!localStorage.getItem('language')) {
        localStorage.setItem('language', normalizedLanguageValue);
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'An error occurred during login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(() => {
    // Clear all user-related state and storage
    setUser(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    
    // Extra cleanup - clear any other potential auth-related items
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    
    // Force redirect to login page
    window.location.href = '/login';
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authAPI.getProfile();
      const normalizedUser = data?.user || data;
      const safeUser = {
        ...normalizedUser,
        id: normalizedUser?.id ?? data?.id,
        email: normalizedUser?.email ?? data?.email,
        firstName: normalizedUser?.firstName ?? data?.firstName,
        lastName: normalizedUser?.lastName ?? data?.lastName,
        role: normalizedUser?.role ?? data?.role ?? 'regular',
        countryCode: normalizedUser?.countryCode ?? data?.countryCode,
        preferredLanguage: normalizedUser?.preferredLanguage ?? data?.preferredLanguage,
        avatar: normalizedUser?.avatar ?? data?.avatar
      };
      if (safeUser.avatar && safeUser.avatar.startsWith('/uploads')) {
        const origin = api.defaults.baseURL.replace(/\/api$/, '');
        safeUser.avatar = `${origin}${safeUser.avatar}`;
      }
      setUser(safeUser);
      localStorage.setItem('user', JSON.stringify(safeUser));
      return safeUser;
    } catch (err) {
      return null;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user: user || null,
    error: error || null,
    loading: loading ?? true,
    login,
    logout,
    refreshUser
  }), [user, error, loading, login, logout, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export AuthContext for useAuth hook
export { AuthContext };