import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as authAPI from '../api/auth';
import api from '../api/axiosInstance';

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Return safe defaults if called outside of provider (e.g., early during route changes)
  if (context === undefined) {
    return {
      user: null,
      error: null,
      loading: false,
      login: async (email, password) => {
        try {
          const data = await authAPI.login(email, password);
          const loginPayload = data?.user || data;
          const token = data?.token || loginPayload?.token;
          if (!token) {
            return { success: false, error: 'Invalid login response' };
          }
          const preferredLanguage = loginPayload?.preferredLanguage ?? data?.preferredLanguage ?? 'es';
          const normalizedPreferredLanguage = String(preferredLanguage).trim().toLowerCase();
          const userData = {
            ...loginPayload,
            id: loginPayload?.id ?? data?.id,
            email: loginPayload?.email ?? data?.email,
            firstName: loginPayload?.firstName ?? data?.firstName,
            lastName: loginPayload?.lastName ?? data?.lastName,
            role: loginPayload?.role ?? data?.role ?? 'regular',
            countryCode: loginPayload?.countryCode ?? data?.countryCode,
            preferredLanguage: normalizedPreferredLanguage.startsWith('en') ? 'en' : 'es',
            token,
          };
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          return { success: false, error: error.response?.data?.error || error.message || 'Login failed' };
        }
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
      }
    };
  }
  return context;
};
