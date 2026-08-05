import api from './axiosInstance';

export const getFiles = async (contractId) => {
  const response = await api.get(
    `/contracts/${contractId}/files`
  );
  return response.data;
};

export const uploadFile = async (contractId, fileData) => {
  const response = await api.post(
    `/contracts/${contractId}/files`,
    fileData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};