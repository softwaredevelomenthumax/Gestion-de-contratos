import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authAPI from '../api/auth'; // Use uppercase if your folder is 'API'
import api from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token is expired
  const isTokenExpired = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && !isTokenExpired(token)) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try to use stored user data first, then verify with server
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData && userData.role) {
            setUser(userData);
            setLoading(false);
            
            // Verify with server in background
            authAPI.getProfile()
              .then(data => {
                // Update user data if different
                if (JSON.stringify(userData) !== JSON.stringify(data)) {
                  setUser(data);
                  localStorage.setItem('user', JSON.stringify(data));
                }
              })
              .catch(error => {
                // Only clear on actual auth errors
                if (error.response?.status === 401 || error.response?.status === 403) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  delete api.defaults.headers.common['Authorization'];
                  setUser(null);
                }
              });
            return;
          }
        } catch {
          // Error parsing stored user data
        }
      }
      
      // Fallback to server verification
      authAPI.getProfile()
        .then(data => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        })
        .catch(error => {
          // Only clear if it's actually an auth error
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Token is expired or doesn't exist
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
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
  };

  const logout = () => {
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
  };

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      error: error || null, 
      loading: loading ?? true, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};