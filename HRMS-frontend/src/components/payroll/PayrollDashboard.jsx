import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Filter,
  Eye,
} from 'lucide-react';
import PAYROLL_API from '../../services/payrollAPI';

const PayrollDashboard = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department: '',
    status: '',
  });
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    fetchPayrolls();
    fetchAnalytics();
  }, [filters]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await PAYROLL_API.getAllPayrolls(filters);
      setPayrolls(response.data.payrolls);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await PAYROLL_API.getAnalytics({
        year: filters.year,
        month: filters.month,
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleGeneratePayroll = async (data) => {
    try {
      const response = await PAYROLL_API.generatePayroll(data);
      alert(`Payroll generated successfully! Generated: ${response.data.summary.generated}, Failed: ${response.data.summary.failed}`);
      fetchPayrolls();
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Failed to generate payroll');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayrolls.length === 0) {
      alert('Please select payrolls to approve');
      return;
    }

    try {
      await PAYROLL_API.bulkUpdateStatus({
        payrollIds: selectedPayrolls,
        status: 'Approved',
        remarks: 'Bulk approval',
      });
      alert('Payrolls approved successfully');
      fetchPayrolls();
      setSelectedPayrolls([]);
    } catch (error) {
      console.error('Error approving payrolls:', error);
      alert('Failed to approve payrolls');
    }
  };

  const handleBulkPay = async () => {
    if (selectedPayrolls.length === 0) {
      alert('Please select payrolls to mark as paid');
      return;
    }

    try {
      await PAYROLL_API.bulkUpdateStatus({
        payrollIds: selectedPayrolls,
        status: 'Paid',
        paymentDate: new Date().toISOString(),
        paymentMode: 'Bank Transfer',
      });
      alert('Payrolls marked as paid successfully');
      fetchPayrolls();
      setSelectedPayrolls([]);
    } catch (error) {
      console.error('Error marking payrolls as paid:', error);
      alert('Failed to mark payrolls as paid');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      Generated: 'bg-yellow-100 text-yellow-800',
      'Pending Approval': 'bg-orange-100 text-orange-800',
      Approved: 'bg-blue-100 text-blue-800',
      Paid: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600 mt-1">Manage employee payrolls and generate monthly salary</p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PlayCircle className="w-5 h-5" />
            Generate Payroll
          </button>
        </div>

        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Gross Payout</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(analytics.summary.totalGross || 0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Net Payout</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(analytics.summary.totalNet || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Deductions</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(analytics.summary.totalDeductions || 0)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.employeeCount || 0}</p>
                </div>
                <Users className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="w-5 h-5 text-gray-600" />
            <div>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="border rounded-lg px-3 py-2"
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="border rounded-lg px-3 py-2"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="Generated">Generated</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            {selectedPayrolls.length > 0 && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handleBulkApprove}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve ({selectedPayrolls.length})
                </button>
                <button
                  onClick={handleBulkPay}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Paid ({selectedPayrolls.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payrolls Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payrolls...</p>
            </div>
          ) : payrolls.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payrolls found for the selected filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayrolls(payrolls.map((p) => p._id));
                        } else {
                          setSelectedPayrolls([]);
                        }
                      }}
                      checked={selectedPayrolls.length === payrolls.length && payrolls.length > 0}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payrolls.map((payroll) => (
                  <tr key={payroll._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPayrolls.includes(payroll._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPayrolls([...selectedPayrolls, payroll._id]);
                          } else {
                            setSelectedPayrolls(selectedPayrolls.filter((id) => id !== payroll._id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {payroll.employee?.firstName} {payroll.employee?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{payroll.employee?.employeeId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payroll.employee?.department?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      {formatCurrency(payroll.summary.grossEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                      {formatCurrency(payroll.summary.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      {formatCurrency(payroll.summary.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payroll.status)}`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-800" title="View Details">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button className="text-green-600 hover:text-green-800" title="Download">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Generate Payroll Modal */}
        {showGenerateModal && (
          <GeneratePayrollModal
            onClose={() => setShowGenerateModal(false)}
            onGenerate={handleGeneratePayroll}
          />
        )}
      </div>
    </div>
  );
};

// Generate Payroll Modal Component
const GeneratePayrollModal = ({ onClose, onGenerate }) => {
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: '',
    includeInactive: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Generate Monthly Payroll</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                {[2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.includeInactive}
                  onChange={(e) => setFormData({ ...formData, includeInactive: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Include inactive employees</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayrollDashboard;
