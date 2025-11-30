// src/services/contractAPI.js

const API_BASE_URL = 'http://localhost:5000/api/v1';

const baseRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

const CONTRACT_API = {
  // HR / Admin: list contracts
  getContracts: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return await baseRequest(`contracts?${qs}`);
  },

  // Employee: my contracts
  getMyContracts: async () => {
    return await baseRequest('contracts/my');
  },

  // Get single contract
  getContractById: async (id) => {
    return await baseRequest(`contracts/${id}`);
  },

  // Create contract
  createContract: async (payload) => {
    return await baseRequest('contracts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Update contract
  updateContract: async (id, payload) => {
    return await baseRequest(`contracts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Archive contract
  archiveContract: async (id) => {
    return await baseRequest(`contracts/${id}/archive`, {
      method: 'PATCH',
    });
  },

  // Send for signature
  sendForSignature: async (id, payload) => {
    return await baseRequest(`contracts/${id}/send-for-signature`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

export default CONTRACT_API;
