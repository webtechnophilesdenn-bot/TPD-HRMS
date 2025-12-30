// services/payrollAPI.js - COMPLETE ENHANCED VERSION
import { apiService } from './apiService';

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
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // For download endpoints, return response directly
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
  // ==================== EMPLOYEE PAYROLL ENDPOINTS ====================
  
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
  getSalaryStructure: async (employeeId = null) => {
    const params = employeeId ? `?employeeId=${employeeId}` : '';
    return await request(`/payroll/salary-structure${params}`);
  },

  // Download payslip
  downloadPayslip: async (payslipId) => {
    const token = localStorage.getItem('token');
    window.open(
      `${API_BASE_URL}/payroll/${payslipId}/download?token=${token}`,
      '_blank'
    );
  },

  // ==================== HR/ADMIN PAYROLL GENERATION ====================

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

  // Validate payroll eligibility for specific employee
  validatePayrollEligibility: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString
      ? `/payroll/validate-eligibility?${queryString}`
      : '/payroll/validate-eligibility';
    return await request(url);
  },

  // Generate payroll
  generatePayroll: async (payrollData) => {
    return await request('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify(payrollData),
    });
  },

  // ==================== PAYROLL MANAGEMENT ====================

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

  // Update payroll status (single)
  updatePayrollStatus: async (payrollId, statusData) => {
    return await request(`/payroll/${payrollId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData),
    });
  },

  // Bulk update payroll status
  bulkUpdatePayrollStatus: async (updates) => {
    return await request('/payroll/bulk/status', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // ==================== ANALYTICS & REPORTS ====================

  // Get payroll analytics
  getAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/payroll/analytics?${queryString}` : '/payroll/analytics';
    console.log('📊 Fetching payroll analytics:', url);
    return await request(url);
  },

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

  // ==================== SALARY STRUCTURE MANAGEMENT ====================

  // Check employees without salary structure
  checkMissingSalaryStructures: async () => {
    return await request('/salary-structure/missing');
  },

  // Create missing salary structures
  createMissingSalaryStructures: async (data = {}) => {
    return await request('/salary-structure/create-missing', {
      method: 'POST',
      body: JSON.stringify({
        effectiveFrom: data.effectiveFrom || new Date(),
        useDesignationDefaults: data.useDesignationDefaults !== false
      })
    });
  },

  // Get all salary structures
  getAllSalaryStructures: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    const url = queryString ? `/salary-structure?${queryString}` : '/salary-structure';
    return await request(url);
  },

  // Get salary structure by ID
  getSalaryStructureById: async (id) => {
    return await request(`/salary-structure/${id}`);
  },

  // Create salary structure from designation
  createFromDesignation: async (data) => {
    return await request('/salary-structure/from-designation', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Get designation configuration
  getDesignationConfig: async (designationId) => {
    return await request(`/salary-structure/designation-config/${designationId}`);
  },

  // Validate CTC for designation
  validateCTC: async (designationId, ctc) => {
    return await request('/salary-structure/validate-ctc', {
      method: 'POST',
      body: JSON.stringify({ designationId, ctc })
    });
  },

  // Bulk create salary structures
  bulkCreateByDesignation: async (employees, effectiveFrom) => {
    return await request('/salary-structure/bulk-create', {
      method: 'POST',
      body: JSON.stringify({ employees, effectiveFrom })
    });
  },

  // Update salary structure
  updateSalaryStructure: async (id, updates) => {
    return await request(`/salary-structure/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  // Deactivate salary structure
  deactivateSalaryStructure: async (id, effectiveTo) => {
    return await request(`/salary-structure/${id}/deactivate`, {
      method: 'PATCH',
      body: JSON.stringify({ effectiveTo })
    });
  },

  // ==================== LOAN MANAGEMENT ====================

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

  // ==================== ADVANCE MANAGEMENT ====================

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

  // ==================== CONVENIENCE METHODS ====================

  // Get current month payroll summary
  getCurrentMonthSummary: async () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    return await payrollAPI.getPayrollGenerationSummary({
      month: currentMonth,
      year: currentYear,
    });
  },

  // Get payroll trend for last 6 months
  getPayrollTrend: async () => {
    const currentDate = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
    
    return await payrollAPI.getAnalytics({
      startMonth: sixMonthsAgo.getMonth() + 1,
      startYear: sixMonthsAgo.getFullYear(),
      endMonth: currentDate.getMonth() + 1,
      endYear: currentDate.getFullYear()
    });
  },

  // Get department-wise payroll breakdown
  getDepartmentPayroll: async (department, month, year) => {
    const filters = {};
    if (department) filters.department = department;
    if (month) filters.month = month;
    if (year) filters.year = year;
    
    return await payrollAPI.getAllPayrolls(filters);
  },
};

export default payrollAPI;
