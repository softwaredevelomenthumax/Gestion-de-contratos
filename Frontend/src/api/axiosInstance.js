import axios from 'axios';

// Base URL que acepta dos hosts (OR): localhost o 10.255.6.4
function getApiBaseUrl() {
  const hostname = (typeof window !== 'undefined' && window.location)
    ? window.location.hostname
    : null;

  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  // Use the same host the frontend was opened from when not local,
  // so LAN access works from other PCs without changing code per IP.
  const targetHost = isLocal ? 'localhost' : hostname;

  return `http://${targetHost}:3001/api`;
}

const API_URL = getApiBaseUrl();

function isPublicAuthRoute() {
  if (typeof window === 'undefined' || !window.location) return false;
  const path = window.location.pathname || '';
  return path === '/login' || path === '/register';
}

// Simple request cache for GET requests (5 minutes TTL)
const requestCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout para evitar requests colgados
  timeout: 30000, // 30 segundos
});

// Request interceptor to add the token to headers and implement cache
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
          delete api.defaults.headers.common['Authorization'];

          // Redirect only when navigating protected areas.
          // Never force redirects from public auth pages, to avoid route bounce.
          if (!isPublicAuthRoute()) {
            window.location.href = '/login';
            return Promise.reject(new Error('Token/user mismatch detected'));
          }

          // Allow public page requests to continue without auth header.
          return config;
        }
      } catch {
        // Token validation error - continue with request
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    // Implementar caché solo para requests GET que no tengan la opción skipCache
    if (config.method === 'get' && !config.skipCache) {
      const cacheKey = config.url + JSON.stringify(config.params || {});
      const cachedData = requestCache.get(cacheKey);

      if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
        // Cancelar request y retornar datos cacheados
        config.adapter = () => {
          return Promise.resolve({
            data: cachedData.data,
            status: 200,
            statusText: 'OK (from cache)',
            headers: cachedData.headers,
            config: config,
          });
        };
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and cache responses
api.interceptors.response.use(
  (response) => {
    // Cachear responses de GET exitosos
    if (response.config.method === 'get' && !response.config.skipCache) {
      const cacheKey = response.config.url + JSON.stringify(response.config.params || {});
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
        headers: response.headers,
      });

      // Limpiar caché viejo (mantener máximo 50 items)
      if (requestCache.size > 50) {
        const firstKey = requestCache.keys().next().value;
        requestCache.delete(firstKey);
      }
    }

    return response;
  },
  (error) => {
    // Only redirect on authentication errors (401). For 403, let caller handle (e.g., insufficient permissions)
    if (error.response && error.response.status === 401) {
      // Clear token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];

      // Never force redirects from public auth pages, to avoid bouncing login/register.
      if (!isPublicAuthRoute()) {
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

// Función para limpiar caché manualmente (útil después de POST/PUT/DELETE)
export const clearCache = () => {
  requestCache.clear();
};

export default api;
