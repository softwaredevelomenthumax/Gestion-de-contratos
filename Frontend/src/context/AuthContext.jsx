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
        
        // Use stored user data immediately for faster initial render
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            if (userData && userData.role) {
              setUser(userData);
              setLoading(false);
              
              // Only verify with server if token is close to expiry (within 5 minutes)
              const tokenPayload = JSON.parse(atob(token.split('.')[1]));
              const timeUntilExpiry = (tokenPayload.exp * 1000) - Date.now();
              
              if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes
                // Verify with server in background without blocking UI
                authAPI.getProfile()
                  .then(data => {
                    if (JSON.stringify(userData) !== JSON.stringify(data)) {
                      setUser(data);
                      localStorage.setItem('user', JSON.stringify(data));
                    }
                  })
                  .catch(error => {
                    if (error.response?.status === 401 || error.response?.status === 403) {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      delete api.defaults.headers.common['Authorization'];
                      setUser(null);
                    }
                  });
              }
              return;
            }
          } catch {
            // Error parsing stored user data, fall through to server verification
          }
        }
        
        // Fallback to server verification only if no valid stored data
        try {
          const data = await authAPI.getProfile();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
          }
        } finally {
          setLoading(false);
        }
      } else {
        // Token is expired or doesn't exist
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
    try {
      setError(null);
      
      // Clear any existing session data FIRST
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      
      const data = await authAPI.login(email, password);
      
      // Ensure we have all required user data
      if (!data || !data.token || !data.role) {
        throw new Error('Invalid login response');
      }
      
      // Parse the JWT token to validate consistency
      try {
        const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
        if (tokenPayload.id !== data.id) {
          throw new Error(`Token mismatch: Token has ID ${tokenPayload.id} but response has ID ${data.id}`);
        }
      } catch {
        // Token parsing error
      }
      
      // Set new session data
      setUser(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      
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

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user: user || null,
    error: error || null,
    loading: loading ?? true,
    login,
    logout
  }), [user, error, loading, login, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export AuthContext for useAuth hook
export { AuthContext };