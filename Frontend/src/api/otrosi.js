import axios from './axiosInstance';

// Get all otrosí for a specific contract
export const getOtrosiByContract = async (contractId) => {
  try {
    const response = await axios.get(`/otrosi/contract/${contractId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching otrosí:', error);
    throw error;
  }
};

// Create a new otrosí
export const createOtrosi = async (otrosiData) => {
  try {
    const response = await axios.post('/otrosi', otrosiData);
    return response.data;
  } catch (error) {
    console.error('Error creating otrosí:', error);
    throw error;
  }
};

// Update an existing otrosí
export const updateOtrosi = async (id, otrosiData) => {
  try {
    const response = await axios.put(`/otrosi/${id}`, otrosiData);
    return response.data;
  } catch (error) {
    console.error('Error updating otrosí:', error);
    throw error;
  }
};

// Delete an otrosí
export const deleteOtrosi = async (id) => {
  try {
    const response = await axios.delete(`/otrosi/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting otrosí:', error);
    throw error;
  }
};

// Add a comment to an otrosí
export const addOtrosiComment = async (otrosiId, comment) => {
  try {
    const response = await axios.post(`/otrosi/${otrosiId}/comments`, { comment });
    return response.data;
  } catch (error) {
    console.error('Error adding comment to otrosí:', error);
    throw error;
  }
};

// Get history for an otrosí
export const getOtrosiHistory = async (otrosiId) => {
  try {
    const response = await axios.get(`/otrosi/${otrosiId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching otrosí history:', error);
    throw error;
  }
};

// Return an otrosí (lawyers only)
export const returnOtrosi = async (otrosiId, comentariosAbogado) => {
  try {
    const response = await axios.post(`/otrosi/${otrosiId}/return`, { comentariosAbogado });
    return response.data;
  } catch (error) {
    console.error('❌ Error returning otrosí:', error);
    throw error;
  }
};

// Get files for an otrosí
export const getOtrosiFiles = async (otrosiId) => {
  try {
    const response = await axios.get(`/otrosi/${otrosiId}/files`);
    return response.data;
  } catch (error) {
    console.error('Error fetching otrosí files:', error);
    throw error;
  }
};

// Perform action on an otrosí (sign, respond, approve, etc.)
export const performOtrosiAction = async (otrosiId, action, files = [], comment = '') => {
  try {
    const formData = new FormData();
    formData.append('action', action);
    if (comment) formData.append('comment', comment);
    
    if (files && files.length > 0) {
      files.forEach(file => formData.append('files', file));
    }
    
    const response = await axios.post(`/otrosi/${otrosiId}/action`, formData);
    return response.data;
  } catch (error) {
    console.error('Error performing otrosí action:', error);
    throw error;
  }
};
