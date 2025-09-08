import api from './axiosInstance';

// Get all contracts sent by the logged-in user
export const getContracts = async () => {
  const response = await api.get('/contracts');
  return response.data;
};

// Get all contracts for traceability (all statuses)
export const getContractsForTraceability = async () => {
  const response = await api.get('/contracts/traceability');
  return response.data;
};

// Create a new contract
export const createContract = async (contractData) => {
  const response = await api.post('/contracts', contractData);
  return response.data;
};

export const updateContractStatus = async (id, statusUpdate) => {
  const response = await api.patch(`/contracts/${id}/estado`, statusUpdate);
  return response.data;
};

// Get a contract by id
export const getContract = async (id) => {
  const response = await api.get(`/contracts/${id}`);
  return response.data;
};

// Get all contracts (for lawyer/global view)
export const getAllContracts = async () => {
  const response = await api.get('/contracts/all');
  return response.data;
};

export const getReturnedContracts = async () => {
  console.log('🔍 DEBUG API: Llamando a /contracts/returned');
  const response = await api.get('/contracts/returned');
  console.log('🔍 DEBUG API: Respuesta recibida:', response.data.length, 'contratos');
  return response.data;
};


export const userRespondToContract = async (contractId, formData) => {
  // Si formData tiene nextStatus, lo envía como parte del formData
  const response = await api.patch(`/contracts/${contractId}/user-respond`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAwaitingUserResponseContracts = async () => {
  const response = await api.get('/contracts/awaiting-user-response');
  return response.data;
};

export const getFirmadoContracts = async () => {
  const response = await api.get('/contracts/firmado');
  return response.data;
};

// Unified: backend is role-aware, so both roles call the same endpoint
export const getAwaitingSignatureContracts = async () => {
  const response = await api.get('/contracts/awaiting-signature');
  return response.data;
};

export const getUserFinalizedContracts = async () => {
  const response = await api.get('/contracts/user-finalized');
  return response.data;
};

export const getLawyerFinalizedContracts = async () => {
  const response = await api.get('/contracts/lawyer-finalized');
  return response.data;
};


export const getManagedContracts = async () => {
  const response = await api.get('/contracts/managed');
  return response.data;
};

export const getLawyerAwaitingResponseContracts = async () => {
  const response = await api.get('/contracts/lawyer-awaiting-response');
  return response.data;
};

export const getLawyerAwaitingReviewContracts = async () => {
  console.log('🔍 DEBUG API: Llamando a /contracts/lawyer-awaiting-response para review');
  const response = await api.get('/contracts/lawyer-awaiting-response');
  console.log('🔍 DEBUG API: Respuesta recibida:', response.data.length, 'contratos');
  return response.data;
};

// Get new contracts (for lawyer view)
export const getNewContracts = async () => {
  console.log('🔍 DEBUG - getNewContracts: Llamando a /contracts/new');
  const response = await api.get('/contracts/new');
  console.log('📥 DEBUG - getNewContracts: Respuesta recibida:', response.data.length, 'contratos');
  return response.data;
};

export const getFinalizadoContracts = async () => {
  const response = await api.get('/contracts/finalizado');
  return response.data;
};

export const respondToContract = async (contractId, formData) => {
  const response = await api.put(`/contracts/${contractId}/respond`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getContractHistory = async (contractId) => {
  const response = await api.get(`/traceability/contracts/${contractId}`);
  return response.data;
};
