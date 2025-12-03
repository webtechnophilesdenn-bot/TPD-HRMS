// services/payrollAPI.js

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Internal request helper
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Check response status
    if (!response.ok) {
      let errorMessage = 'Something went wrong';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // For download endpoints, handle differently
    if (endpoint.includes('download')) {
      return response;
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== PAYROLL API SERVICE ====================
const payrollAPI = {
  // Get my payslips
  getMyPayslips: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/payroll/my-payslips?${queryString}` : '/payroll/my-payslips';
    console.log('📄 Fetching payslips:', url);
    return await request(url);
  },

  // Get my salary structure
  getSalaryStructure: async () => {
    return await request('/payroll/salary-structure');
  },

  // Download payslip
 downloadPayslip: async (payslipId) => {
  const token = localStorage.getItem('token');
  window.open(
    `${API_BASE_URL}/payroll/${payslipId}/download?token=${token}`,
    '_blank'
  );
},

  // Get eligible employees for payroll generation
  getEligibleEmployees: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString
      ? `/payroll/eligible-employees?${queryString}`
      : '/payroll/eligible-employees';
    return await request(url);
  },

  // Get payroll generation summary
  getPayrollGenerationSummary: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString
      ? `/payroll/generation-summary?${queryString}`
      : '/payroll/generation-summary';
    return await request(url);
  },

  // Generate payroll
  generatePayroll: async (payrollData) => {
    return await request('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify(payrollData),
    });
  },

  // Get all payrolls with filters
  getAllPayrolls: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/payroll?${queryString}` : '/payroll';
    console.log('Payroll API Call URL:', url);
    return await request(url);
  },

  // Approve payroll (process loan/advance deductions)
  approvePayroll: async (payrollData) => {
    return await request('/payroll/approve', {
      method: 'POST',
      body: JSON.stringify(payrollData),
    });
  },

  // Update payroll status
  updatePayrollStatus: async (payrollId, statusData) => {
    return await request(`/payroll/${payrollId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  // Bulk update payroll status
  bulkUpdatePayrollStatus: async (updates) => {
    return await request('/payroll/bulk-status', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Get payroll analytics - REMOVED DUPLICATE, USING getAnalytics INSTEAD
  // getPayrollAnalytics: async (filters = {}) => {
  //   const params = new URLSearchParams();
  //   Object.keys(filters).forEach((key) => {
  //     if (filters[key]) params.append(key, filters[key]);
  //   });
  //   const queryString = params.toString();
  //   const url = queryString ? `/payroll/analytics?${queryString}` : '/payroll/analytics';
  //   return await request(url);
  // },

  // Download payroll report
  downloadPayrollReport: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const token = localStorage.getItem('token');
    const queryString = params.toString();
    window.open(
      `${API_BASE_URL}/payroll/report/download?${queryString}&token=${token}`,
      '_blank'
    );
  },

  // Validate payroll eligibility
  validatePayrollEligibility: async (params) => {
    return await request('/payroll/validate-eligibility', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // ==================== PAYROLL ANALYTICS ====================
  getAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/payroll/analytics?${queryString}` : '/payroll/analytics';
    console.log('📊 Fetching payroll analytics:', url);
    return await request(url);
  },

  // ==================== LOAN MANAGEMENT APIs ====================

  // Request a loan
  requestLoan: async (loanData) => {
    return await request('/loans/request', {
      method: 'POST',
      body: JSON.stringify(loanData),
    });
  },

  // Get my loans
  getMyLoans: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/loans/my-loans?${queryString}` : '/loans/my-loans';
    return await request(url);
  },

  // Get all loans (HR/Admin)
  getAllLoans: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/loans?${queryString}` : '/loans';
    return await request(url);
  },

  // Update loan status
  updateLoanStatus: async (loanId, statusData) => {
    return await request(`/loans/${loanId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  // Cancel loan
  cancelLoan: async (loanId, reason) => {
    return await request(`/loans/${loanId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  // Get loan analytics
  getLoanAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/loans/analytics?${queryString}` : '/loans/analytics';
    return await request(url);
  },

  // ==================== ADVANCE MANAGEMENT APIs ====================

  // Request an advance
  requestAdvance: async (advanceData) => {
    return await request('/advances/request', {
      method: 'POST',
      body: JSON.stringify(advanceData),
    });
  },

  // Get my advances
  getMyAdvances: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/advances/my-advances?${queryString}` : '/advances/my-advances';
    return await request(url);
  },

  // Get all advances (HR/Admin)
  getAllAdvances: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/advances?${queryString}` : '/advances';
    return await request(url);
  },

  // Update advance status
  updateAdvanceStatus: async (advanceId, statusData) => {
    return await request(`/advances/${advanceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  // Cancel advance
  cancelAdvance: async (advanceId, reason) => {
    return await request(`/advances/${advanceId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  // Get advance analytics
  getAdvanceAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/advances/analytics?${queryString}` : '/advances/analytics';
    return await request(url);
  },

  // ==================== ADDITIONAL CONVENIENCE METHODS ====================

  // Get current month payroll summary
  getCurrentMonthSummary: async () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    return await payrollAPI.getAnalytics({
      month: currentMonth,
      year: currentYear,
    });
  },

  // Get payroll trend for last 6 months
  getPayrollTrend: async () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    return await payrollAPI.getAnalytics({
      year: currentYear,
      trend: 'monthly',
    });
  },

  // Get department-wise payroll breakdown
  getDepartmentPayroll: async (filters = {}) => {
    const params = {
      ...filters,
      breakdown: 'department'
    };
    
    return await payrollAPI.getAnalytics(params);
  },
};

export default payrollAPI;