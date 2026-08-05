import api from './axiosInstance';

export const getPendingUsers = async () => {
  const { data } = await api.get('/users/pending');
  return data;
};

export const approveUser = async (id) => {
  const { data } = await api.post(`/users/${id}/approve`);
  return data;
};

export const rejectUser = async (id, reason) => {
  const { data } = await api.post(`/users/${id}/reject`, { reason });
  return data;
};

export const createAdmin = async ({ firstName, lastName, email, password }) => {
  const { data } = await api.post('/users/admin', { firstName, lastName, email, password });
  return data;
};


