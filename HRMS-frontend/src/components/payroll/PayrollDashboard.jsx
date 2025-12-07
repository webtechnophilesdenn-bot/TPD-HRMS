// src/components/payroll/PayrollDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  Download,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Filter,
  Eye,
  RefreshCw,
  X,
  Building2,
  Calendar,
  TrendingDown,
  FileText,
  Shield
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import PayrollGenerationSystem from './PayrollGenerationSystem';

const PayrollDashboard = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userDepartment, setUserDepartment] = useState(null);
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department: '',
    status: ''
  });

  // Fetch user context
  useEffect(() => {
    const fetchUserContext = async () => {
      try {
        const response = await apiService.getCurrentUser();
        const user = response.data;
        
        setUserRole(user.role);
        setUserDepartment(user.department);

        // Fetch departments
        if (user.role === 'admin') {
          const deptResponse = await apiService.getDepartments();
          setDepartments(deptResponse.data || []);
        } else if (user.role === 'hr' && user.permissions?.departments?.length > 0) {
          const deptResponse = await apiService.getDepartments();
          const accessibleDepts = deptResponse.data.filter(dept => 
            user.permissions.departments.includes(dept._id)
          );
          setDepartments(accessibleDepts);
        } else if (user.role === 'manager' && user.department) {
          const deptResponse = await apiService.getDepartments();
          const managerDept = deptResponse.data.find(dept => dept._id === user.department);
          if (managerDept) {
            setDepartments([managerDept]);
            setFilters(prev => ({ ...prev, department: user.department }));
          }
        }
      } catch (error) {
        console.error('Error fetching user context:', error);
      }
    };

    fetchUserContext();
  }, []);

// In PayrollDashboard.jsx - Update fetchPayrolls
// PayrollDashboard.jsx - Update fetchPayrolls function
const fetchPayrolls = useCallback(async () => {
  try {
    setLoading(true);
    const response = await apiService.getAllPayrolls(filters);
    
    console.log('Full Response:', response);
    
    // Access payrolls correctly
    const payrollData = response.data?.payrolls || response.payrolls || response.data?.data || [];
    setPayrolls(payrollData);

    // ✅ FIX: Calculate analytics from payroll data instead of separate API call
    if (response.summary) {
      // Use summary from getAllPayrolls response
      setAnalytics({ summary: response.summary });
    } else if (payrollData.length > 0) {
      // Calculate summary from payroll data
      const calculatedSummary = {
        totalGross: payrollData.reduce((sum, p) => sum + (p.summary?.grossEarnings || 0), 0),
        totalGrossEarnings: payrollData.reduce((sum, p) => sum + (p.summary?.grossEarnings || 0), 0),
        totalNet: payrollData.reduce((sum, p) => sum + (p.summary?.netSalary || 0), 0),
        totalNetSalary: payrollData.reduce((sum, p) => sum + (p.summary?.netSalary || 0), 0),
        totalDeductions: payrollData.reduce((sum, p) => sum + (p.summary?.totalDeductions || 0), 0),
        employeeCount: payrollData.length
      };
      
      setAnalytics({ summary: calculatedSummary });
      console.log('Calculated Analytics:', calculatedSummary);
    } else {
      // No payrolls found
      setAnalytics({
        summary: {
          totalGross: 0,
          totalGrossEarnings: 0,
          totalNet: 0,
          totalNetSalary: 0,
          totalDeductions: 0,
          employeeCount: 0
        }
      });
    }

    // ❌ REMOVE THIS - Don't call analytics endpoint separately
    // const analyticsResponse = await apiService.getAnalytics({
    //   year: filters.year,
    //   month: filters.month,
    //   department: filters.department
    // });
    // setAnalytics(analyticsResponse.data || null);
    
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    setPayrolls([]);
    setAnalytics({
      summary: {
        totalGross: 0,
        totalGrossEarnings: 0,
        totalNet: 0,
        totalNetSalary: 0,
        totalDeductions: 0,
        employeeCount: 0
      }
    });
  } finally {
    setLoading(false);
  }
}, [filters]);



  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const handleGeneratePayroll = async (data) => {
    try {
      const response = await apiService.generatePayroll(data);
      alert(
        `Payroll generated successfully!\nGenerated: ${response.data.summary.generated}\nFailed: ${response.data.summary.failed}`
      );
      setGenerationResult(response.data);
      fetchPayrolls();
      setShowGenerateModal(false);
      setTimeout(() => setGenerationResult(null), 5000);
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert(`Failed to generate payroll: ${error.message}`);
    }
  };

  const handleViewPayslip = (payroll) => {
    setSelectedPayroll(payroll);
    setShowPayslipModal(true);
  };

  const handleDownloadPayslip = async (payslipId) => {
    try {
      await apiService.downloadPayslip(payslipId);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      alert(`Failed to download payslip: ${error.message}`);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayrolls.length === 0) {
      alert('Please select payrolls to approve');
      return;
    }

    try {
      await apiService.bulkUpdatePayrollStatus({
        payrollIds: selectedPayrolls,
        status: 'Approved',
        remarks: 'Bulk approval'
      });
      alert('Payrolls approved successfully');
      fetchPayrolls();
      setSelectedPayrolls([]);
    } catch (error) {
      console.error('Error approving payrolls:', error);
      alert(`Failed to approve payrolls: ${error.message}`);
    }
  };

  const handleBulkPay = async () => {
    if (selectedPayrolls.length === 0) {
      alert('Please select payrolls to mark as paid');
      return;
    }

    try {
      await apiService.bulkUpdatePayrollStatus({
        payrollIds: selectedPayrolls,
        status: 'Paid',
        paymentDate: new Date().toISOString(),
        paymentMode: 'Bank Transfer'
      });
      alert('Payrolls marked as paid successfully');
      fetchPayrolls();
      setSelectedPayrolls([]);
    } catch (error) {
      console.error('Error marking payrolls as paid:', error);
      alert(`Failed to mark payrolls as paid: ${error.message}`);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPayrolls(payrolls.map(p => p._id || p.id));
    } else {
      setSelectedPayrolls([]);
    }
  };

  const handleSelectPayroll = (payrollId, checked) => {
    if (checked) {
      setSelectedPayrolls([...selectedPayrolls, payrollId]);
    } else {
      setSelectedPayrolls(selectedPayrolls.filter(id => id !== payrollId));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      Generated: 'bg-yellow-100 text-yellow-800',
      'Pending Approval': 'bg-orange-100 text-orange-800',
      Approved: 'bg-blue-100 text-blue-800',
      Paid: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Draft: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canGeneratePayroll = ['admin', 'hr'].includes(userRole);
  const canApprove = ['admin', 'hr', 'finance'].includes(userRole);
  const canProcessPayment = ['admin', 'finance'].includes(userRole);

  return (
    <div className="space-y-3 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage employee payrolls and generate monthly salary
            {userRole === 'manager' && ' - Department View'}
            {userRole === 'employee' && ' - My Payslips'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {canGeneratePayroll && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Generate Payroll
            </button>
          )}

          {canApprove && (
            <button
              onClick={handleBulkApprove}
              disabled={selectedPayrolls.length === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Selected ({selectedPayrolls.length})
            </button>
          )}

          {canProcessPayment && (
            <button
              onClick={handleBulkPay}
              disabled={selectedPayrolls.length === 0}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Mark as Paid ({selectedPayrolls.length})
            </button>
          )}

          <button
            onClick={fetchPayrolls}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mr-4">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 font-medium">Total Gross Payout</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {formatCurrency(analytics?.summary?.totalGross || analytics?.summary?.totalGrossEarnings || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 font-medium">Total Net Payout</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {formatCurrency(analytics?.summary?.totalNet || analytics?.summary?.totalNetSalary || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-full bg-red-50 text-red-600 mr-4">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 font-medium">Total Deductions</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {formatCurrency(analytics?.summary?.totalDeductions || 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-full bg-yellow-50 text-yellow-600 mr-4">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 font-medium">Total Employees</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {analytics?.summary?.employeeCount || payrolls.length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Department-wise Breakdown */}
      {['admin', 'hr', 'manager'].includes(userRole) && analytics?.departmentBreakdown?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
            Department-wise Breakdown
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.departmentBreakdown.map(dept => (
              <div
                key={dept._id.departmentId}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{dept._id.departmentName}</h3>
                    <p className="text-xs text-gray-500">{dept._id.departmentCode}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {dept.employeeCount} Emp
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gross Payout:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(dept.totalGross)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Net Payout:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(dept.totalNet)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Deductions:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(dept.totalDeductions)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600">Avg Salary:</span>
                    <span className="font-semibold text-indigo-600">
                      {formatCurrency(dept.avgSalary)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-gray-700">
            <Filter className="h-4 w-4 mr-2" />
            <span className="font-medium text-sm">Filters</span>
          </div>
          <button
            onClick={() => setFilters({
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              department: userRole === 'manager' ? userDepartment : '',
              status: ''
            })}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
            <input
              type="number"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="2020"
              max="2030"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange('month', Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              disabled={userRole === 'manager'}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="Generated">Generated</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Payroll Records</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">Showing {payrolls.length} records</span>
            <button
              onClick={fetchPayrolls}
              className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Loading payrolls...</p>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-2">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500 text-sm mb-2">
              No payrolls found for the selected filters
            </p>
            {canGeneratePayroll && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Generate payroll to get started
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {canApprove && (
                    <th className="px-4 py-3 border-b">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedPayrolls.length === payrolls.length && payrolls.length > 0}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 border-b text-left font-medium text-gray-500">Employee</th>
                  <th className="px-4 py-3 border-b text-left font-medium text-gray-500">Department</th>
                  <th className="px-4 py-3 border-b text-left font-medium text-gray-500">Period</th>
                  <th className="px-4 py-3 border-b text-right font-medium text-gray-500">Gross</th>
                  <th className="px-4 py-3 border-b text-right font-medium text-gray-500">Deductions</th>
                  <th className="px-4 py-3 border-b text-right font-medium text-gray-500">Net Salary</th>
                  <th className="px-4 py-3 border-b text-center font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 border-b text-center font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map(payroll => (
                  <tr key={payroll._id || payroll.id} className="hover:bg-gray-50 border-b transition-colors">
                    {canApprove && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedPayrolls.includes(payroll._id || payroll.id)}
                          onChange={(e) => handleSelectPayroll(payroll._id || payroll.id, e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {payroll.employee?.firstName} {payroll.employee?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{payroll.employee?.employeeId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {payroll.employee?.department?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                        {new Date(
                          payroll.period?.year || payroll.year,
                          (payroll.period?.month || payroll.month) - 1
                        ).toLocaleString('en', { month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900 font-medium">
                      {formatCurrency(payroll.summary?.grossEarnings || payroll.grossSalary || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-600 font-medium">
                      {formatCurrency(payroll.summary?.totalDeductions || payroll.totalDeductions || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600 font-semibold">
                      {formatCurrency(payroll.summary?.netSalary || payroll.netSalary || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payroll.status)}`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewPayslip(payroll)}
                          className="inline-flex items-center px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                          title="View Payslip Details"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadPayslip(payroll._id || payroll.id)}
                          className="inline-flex items-center px-2 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                          title="Download Payslip PDF"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Modal - (Keep your existing modal code here) */}
      {showPayslipModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          {/* Your existing payslip modal content */}
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Generate Payroll</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <PayrollGenerationSystem
                onClose={() => {
                  setShowGenerateModal(false);
                  fetchPayrolls();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Generation Result Toast */}
      {generationResult && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm z-50">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">Payroll Generated!</h4>
              <p className="text-sm text-green-800 mt-1">
                Generated: {generationResult.summary?.generated} employees<br />
                Failed: {generationResult.summary?.failed} employees<br />
                Total Payout: {formatCurrency(generationResult.summary?.totalNetPayout || 0)}
              </p>
            </div>
            <button
              onClick={() => setGenerationResult(null)}
              className="text-green-600 hover:text-green-800 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDashboard;
