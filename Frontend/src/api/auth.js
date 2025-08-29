import api from './axiosInstance';

export const login = async (email, password) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};