import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  // Return safe defaults if called outside of provider (e.g., early during route changes)
  if (context === undefined) {
    return {
      user: null,
      error: null,
      loading: true,
      login: async () => ({ success: false, error: 'Auth not initialized' }),
      logout: () => {}
    };
  }
  return context;
};
