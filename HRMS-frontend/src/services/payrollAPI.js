// ==================== PAYROLL API SERVICE ====================

const API_BASE_URL = 'http://localhost:5000/api/v1';

const apiService = {
  request: async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
};

const PAYROLL_API = {
  // ==================== EMPLOYEE APIs ====================
  
  // Get my payslips
  getMyPayslips: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiService.request(`payroll/my-payslips?${queryString}`);
  },

  // Get my salary structure
  getMySalaryStructure: async () => {
    return await apiService.request('payroll/my-salary-structure');
  },

  // Download payslip
  downloadPayslip: async (payrollId) => {
    return await apiService.request(`payroll/${payrollId}/download-payslip`);
  },

  // ==================== HR/ADMIN APIs ====================
  
  // Generate payroll
  generatePayroll: async (data) => {
    return await apiService.request('payroll/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get all payrolls with filters
  getAllPayrolls: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiService.request(`payroll?${queryString}`);
  },

  // Get eligible employees
  getEligibleEmployees: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiService.request(`payroll/eligible-employees?${queryString}`);
  },

  // Get generation summary
  getGenerationSummary: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiService.request(`payroll/generation-summary?${queryString}`);
  },

  // Get analytics
  getAnalytics: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiService.request(`payroll/analytics?${queryString}`);
  },

  // Update payroll status
  updatePayrollStatus: async (payrollId, data) => {
    return await apiService.request(`payroll/${payrollId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Bulk update status
  bulkUpdateStatus: async (data) => {
    return await apiService.request('payroll/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Download payroll report
  downloadReport: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiService.request(`payroll/report/download?${queryString}`);
  },
};

export default PAYROLL_API;
