import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  DollarSign,
  Users,
  Building,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  FileText,
  TrendingUp,
  RefreshCw,
  PlayCircle,
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import PayrollGenerationSystem from './PayrollGenerationSystem';

const PayrollPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: '',
    status: '',
    page: 1,
    limit: 20,
  });

  const [summary, setSummary] = useState({
    totalNetSalary: 0,
    totalGrossEarnings: 0,
    totalDeductions: 0,
    totalEmployees: 0,
  });

  const [departments, setDepartments] = useState([]);

  // Load initial data
  useEffect(() => {
    loadDepartments();
    loadPayrolls();
  }, [filters]);

  const loadDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

const loadPayrolls = async () => {
  setLoading(true);
  try {
    // Clean up filters - remove empty values
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        cleanFilters[key] = filters[key];
      }
    });

    console.log('Loading payrolls with filters:', cleanFilters); // Debug log
    
    const response = await apiService.getAllPayrolls(cleanFilters);
    
    console.log('Payroll response:', response); // Debug log
    
    setPayrolls(response.data?.payrolls || []);
    setSummary(response.data?.summary || {
      totalNetSalary: 0,
      totalGrossEarnings: 0,
      totalDeductions: 0,
      totalEmployees: 0,
    });
  } catch (error) {
    console.error('Load payrolls error:', error); // Debug log
    showError(error.message || 'Failed to load payrolls');
    setPayrolls([]);
  } finally {
    setLoading(false);
  }
};


  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleGenerationComplete = () => {
    setShowGenerateModal(false);
    loadPayrolls(); // Reload payrolls after generation
    showSuccess('Payroll generated successfully!');
  };

  const handleUpdateStatus = async (payrollId, status) => {
    try {
      await apiService.updatePayrollStatus(payrollId, {
        status,
        paymentDate: new Date(),
        paymentMode: 'Bank Transfer',
      });
      showSuccess(`Payroll ${status.toLowerCase()} successfully`);
      loadPayrolls();
    } catch (error) {
      showError(error.message || `Failed to ${status.toLowerCase()} payroll`);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    const selectedIds = payrolls
      .filter((p) => p.status === 'Generated')
      .map((p) => p._id);

    if (selectedIds.length === 0) {
      showError('No generated payrolls to update');
      return;
    }

    try {
      await apiService.bulkUpdatePayrollStatus({
        payrollIds: selectedIds,
        status,
        paymentDate: new Date(),
        paymentMode: 'Bank Transfer',
      });
      showSuccess(`${selectedIds.length} payrolls updated to ${status}`);
      loadPayrolls();
    } catch (error) {
      showError(error.message || 'Failed to update payrolls');
    }
  };

  const handleDownloadPayslip = async (payrollId) => {
    try {
      await apiService.downloadPayslip(payrollId);
      showSuccess('Payslip downloaded successfully');
    } catch (error) {
      showError(error.message || 'Failed to download payslip');
    }
  };

  const handleViewPayslip = async (payroll) => {
    setSelectedPayroll(payroll);
    setShowPayslipModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Generated':
        return 'bg-blue-100 text-blue-800';
      case 'Approved':
        return 'bg-yellow-100 text-yellow-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Generated':
        return <FileText className="h-4 w-4" />;
      case 'Approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'Paid':
        return <DollarSign className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isHROrAdmin = user?.role === 'hr' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
              <p className="text-gray-600 mt-1">
                Manage and process employee payroll
              </p>
            </div>
            {isHROrAdmin && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 shadow-sm"
                >
                  <PlayCircle className="h-5 w-5" />
                  <span>Generate Payroll</span>
                </button>
                <button
                  onClick={() => apiService.downloadPayrollReport(filters)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 shadow-sm"
                >
                  <Download className="h-5 w-5" />
                  <span>Download Report</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.totalEmployees}
                </p>
              </div>
              <Users className="h-10 w-10 text-indigo-600 opacity-75" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gross Earnings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.totalGrossEarnings)}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600 opacity-75" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deductions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.totalDeductions)}
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-600 opacity-75" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Salary</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.totalNetSalary)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-600 opacity-75" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Month */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString('default', {
                      month: 'long',
                    })}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                <option value="Generated">Generated</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Apply Button */}
            <div className="flex items-end">
              <button
                onClick={loadPayrolls}
                disabled={loading}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Filter className="h-5 w-5" />
                )}
                Apply
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {isHROrAdmin && payrolls.some((p) => p.status === 'Generated') && (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Bulk Actions:</span>
              <button
                onClick={() => handleBulkStatusUpdate('Approved')}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm font-medium"
              >
                Approve All Generated
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('Paid')}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium"
              >
                Mark All as Paid
              </button>
            </div>
          )}
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
                <span className="ml-3 text-gray-600">Loading payrolls...</span>
              </div>
            ) : payrolls.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payroll records found</p>
                <p className="text-gray-500 text-sm mt-1">
                  Generate payroll or adjust filters to view records
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrolls.map((payroll) => (
                    <tr key={payroll._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {payroll.employee?.firstName} {payroll.employee?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payroll.employee?.employeeId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(2024, payroll.month - 1).toLocaleString('default', {
                            month: 'long',
                          })}{' '}
                          {payroll.year}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payroll.summary?.grossEarnings)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-red-600">
                          {formatCurrency(payroll.summary?.totalDeductions)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          {formatCurrency(payroll.summary?.netSalary)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            payroll.status
                          )}`}
                        >
                          <span className="mr-1">{getStatusIcon(payroll.status)}</span>
                          {payroll.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewPayslip(payroll)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Payslip"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPayslip(payroll._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Download Payslip"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {isHROrAdmin && payroll.status === 'Generated' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(payroll._id, 'Approved')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(payroll._id, 'Rejected')}
                                className="text-red-600 hover:text-red-900"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {isHROrAdmin && payroll.status === 'Approved' && (
                            <button
                              onClick={() => handleUpdateStatus(payroll._id, 'Paid')}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Paid"
                            >
                              <DollarSign className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Generate Payroll Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <PayrollGenerationSystem
                onClose={() => setShowGenerateModal(false)}
                onComplete={handleGenerationComplete}
              />
            </div>
          </div>
        )}

        {/* Payslip View Modal */}
        {showPayslipModal && selectedPayroll && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payslip</h2>
                  <p className="text-gray-600">
                    {new Date(2024, selectedPayroll.month - 1).toLocaleString('default', {
                      month: 'long',
                    })}{' '}
                    {selectedPayroll.year}
                  </p>
                </div>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Employee Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Employee Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">
                      {selectedPayroll.employee?.firstName} {selectedPayroll.employee?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Employee ID</p>
                    <p className="font-medium">{selectedPayroll.employee?.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{selectedPayroll.employee?.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Designation</p>
                    <p className="font-medium">{selectedPayroll.employee?.designation}</p>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Earnings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPayroll.earnings?.basic)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">HRA</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPayroll.earnings?.hra)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Special Allowance</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPayroll.earnings?.specialAllowance)}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Gross Earnings</span>
                      <span>{formatCurrency(selectedPayroll.summary?.grossEarnings)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">PF (Employee)</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPayroll.deductions?.pfEmployee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ESIC</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPayroll.deductions?.esicEmployee)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Professional Tax</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPayroll.deductions?.professionalTax)}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Total Deductions</span>
                      <span className="text-red-600">
                        {formatCurrency(selectedPayroll.summary?.totalDeductions)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Net Salary</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(selectedPayroll.summary?.netSalary)}
                  </span>
                </div>
              </div>

              {/* Download Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleDownloadPayslip(selectedPayroll._id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download Payslip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollPage;
