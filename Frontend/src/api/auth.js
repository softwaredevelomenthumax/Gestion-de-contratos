import api from './axiosInstance';

export const login = async (email, password) => {
  // Normalize email to avoid case-related mismatches between UI and backend
  const payload = {
    email: String(email || '').trim().toLowerCase(),
    password,
  };
  // Log non-sensitive info to help debug language-dependent issues
  try {
    console.debug('🛈 auth.login payload:', { email: payload.email, hasPassword: !!password });
  } catch (e) {}
  const response = await api.post('/login', payload);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/profile', { skipCache: true });
  return response.data;
};