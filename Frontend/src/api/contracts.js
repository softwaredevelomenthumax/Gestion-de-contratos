import api from './axiosInstance';

// Get all contracts sent by the logged-in user with optional filtering
export const getContracts = async (filters = {}) => {
  const params = new URLSearchParams();
  
  // Add filters to query params
  if (filters.estado && filters.estado !== 'Todos') {
    params.append('estado', filters.estado);
  }
  if (filters.ticket) {
    params.append('ticket', filters.ticket);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.sort) {
    params.append('sort', filters.sort);
  }
  if (filters.page) {
    params.append('page', filters.page);
  }
  if (filters.limit) {
    params.append('limit', filters.limit);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/contracts?${queryString}` : '/contracts';
  const response = await api.get(url);
  
  // Handle both old format (array) and new format (object with contracts array)
  if (Array.isArray(response.data)) {
    return response.data;
  }
  return response.data.contracts || response.data;
};

// Get all contracts for traceability (all statuses)
export const getContractsForTraceability = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.ticket) params.append('ticket', filters.ticket);
  if (filters.sort) params.append('sort', filters.sort);
  const qs = params.toString();
  const url = qs ? `/contracts/traceability?${qs}` : '/contracts/traceability';
  const response = await api.get(url);
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

export const userRespondToContract = async (contractId, formData) => {
  // Si formData tiene nextStatus, lo envía como parte del formData
  const response = await api.patch(`/contracts/${contractId}/user-respond`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAwaitingUserResponseContracts = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.ticket) params.append('ticket', filters.ticket);
  if (filters.sort) params.append('sort', filters.sort);
  const qs = params.toString();
  const url = qs ? `/contracts/awaiting-user-response?${qs}` : '/contracts/awaiting-user-response';
  const response = await api.get(url);
  return response.data;
};

// Unified: backend is role-aware, so both roles call the same endpoint
export const getAwaitingSignatureContracts = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.ticket) params.append('ticket', filters.ticket);
  if (filters.sort) params.append('sort', filters.sort);
  const qs = params.toString();
  const url = qs ? `/contracts/awaiting-signature?${qs}` : '/contracts/awaiting-signature';
  const response = await api.get(url);
  return response.data;
};

export const getUserFinalizedContracts = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.ticket) params.append('ticket', filters.ticket);
  if (filters.sort) params.append('sort', filters.sort);
  const qs = params.toString();
  const url = qs ? `/contracts/user-finalized?${qs}` : '/contracts/user-finalized';
  const response = await api.get(url);
  return response.data;
};

export const getLawyerFinalizedContracts = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.ticket) params.append('ticket', filters.ticket);
  if (filters.sort) params.append('sort', filters.sort);
  const qs = params.toString();
  const url = qs ? `/contracts/lawyer-finalized?${qs}` : '/contracts/lawyer-finalized';
  const response = await api.get(url);
  return response.data;
};


export const getLawyerAwaitingReviewContracts = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.ticket) params.append('ticket', filters.ticket);
  if (filters.sort) params.append('sort', filters.sort);
  const qs = params.toString();
  const url = qs ? `/contracts/lawyer-awaiting-response?${qs}` : '/contracts/lawyer-awaiting-response';
  const response = await api.get(url);
  return response.data;
};

// Get new contracts (for lawyer view) with optional filtering
export const getNewContracts = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.estado && filters.estado !== 'Todos') {
    params.append('estado', filters.estado);
  }
  if (filters.ticket) {
    params.append('ticket', filters.ticket);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.sort) {
    params.append('sort', filters.sort);
  }
  
  const queryString = params.toString();
  const url = queryString ? `/contracts/new?${queryString}` : '/contracts/new';
  const response = await api.get(url);
  return response.data;
};

// Get full contract details (contract + history + files in one request)
export const getContractFull = async (id) => {
  const response = await api.get(`/contracts/${id}/full`);
  return response.data;
};

export const getFinalizadoContracts = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.ticket) params.append('ticket', filters.ticket);
  if (filters.sort) params.append('sort', filters.sort);
  const qs = params.toString();
  const url = qs ? `/contracts/finalizado?${qs}` : '/contracts/finalizado';
  const response = await api.get(url);
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
