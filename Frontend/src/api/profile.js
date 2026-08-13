import api from './axiosInstance';
import { clearCache } from './axiosInstance';

export const getProfile = async () => {
  const response = await api.get('/profile', { skipCache: true });
  return response.data;
};

export const updateProfile = async (profileData) => {
  if (profileData instanceof FormData) {
    const response = await api.put('/profile', profileData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // Clear cached GET responses so subsequent GET /profile returns fresh data
    try { clearCache(); } catch (e) { /* ignore */ }
    return response.data;
  }

  const response = await api.put('/profile', profileData);
  try { clearCache(); } catch (e) {}
  return response.data;
};

