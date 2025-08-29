import axios from 'axios';

export const getProfile = async () => {
  const response = await axios.get('http://localhost:3001/api/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await axios.put('http://localhost:3001/api/profile', profileData);
  return response.data;
};

