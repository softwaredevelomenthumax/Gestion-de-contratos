import axios from 'axios';

// Use localhost during development and server IP in production builds
const API_URL =
  (import.meta && import.meta.env && import.meta.env.DEV)
    ? 'http://localhost:3001/api'
    : 'http://10.255.6.4:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token) {
      // Validate token matches stored user
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const userData = storedUser ? JSON.parse(storedUser) : null;
        
        if (userData && tokenPayload.id !== userData.id) {
          // Clear mismatched data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(new Error('Token/user mismatch detected'));
        }
      } catch {
        // Token validation error - continue with request
      }
      
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401/403 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect on authentication errors, not network errors
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        // Use React Router navigation if available, otherwise fallback to window.location
        if (window.history && window.history.pushState) {
          window.history.pushState(null, null, '/login');
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
