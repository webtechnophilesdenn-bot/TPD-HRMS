// src/pages/payroll/PayrollDashboard.jsx
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

  // ✅ Wrap in useCallback and define BEFORE useEffect
  const fetchPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PAYROLL_API.getAllPayrolls(filters);
      setPayrolls(response.data.payrolls || []);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await PAYROLL_API.getAnalytics({
        year: filters.year,
        month: filters.month,
      });
      setAnalytics(response.data || null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [filters.year, filters.month]);

  useEffect(() => {
    fetchPayrolls();
    fetchAnalytics();
  }, [fetchPayrolls, fetchAnalytics]);

  const handleGeneratePayroll = async (data) => {
    try {
      const response = await PAYROLL_API.generatePayroll(data);
      alert(
        `Payroll generated successfully! Generated: ${response.data.summary.generated}, Failed: ${response.data.summary.failed}`
      );
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
      maximumFractionDigits: 0,
    }).format(amount || 0);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Manage employee payrolls and generate monthly salary
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Generate Payroll
          </button>
          <button
            onClick={handleBulkApprove}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Selected
          </button>
          <button
            onClick={handleBulkPay}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Mark as Paid
          </button>
        </div>
      </div>

      {/* Analytics summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mr-4">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Total Gross Payout</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(analytics?.summary?.totalGross || 0)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Total Net Payout</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(analytics?.summary?.totalNet || 0)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-full bg-red-50 text-red-600 mr-4">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Total Deductions</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(analytics?.summary?.totalDeductions || 0)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center">
          <div className="p-3 rounded-full bg-yellow-50 text-yellow-600 mr-4">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Total Employees</p>
            <p className="text-lg font-semibold text-gray-900">
              {analytics?.summary?.employeeCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-gray-700">
            <Filter className="h-4 w-4 mr-2" />
            <span className="font-medium text-sm">Filters</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Year
            </label>
            <input
              type="number"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('en', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Department
            </label>
            <input
              type="text"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              placeholder="Department ID or name"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="Generated">Generated</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payroll table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Payroll Records</h2>
          <button
            onClick={() => fetchPayrolls()}
            className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800"
          >
            <Download className="h-3 w-3 mr-1" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            Loading payrolls...
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No payrolls found for the selected filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPayrolls(payrolls.map((p) => p._id));
                        } else {
                          setSelectedPayrolls([]);
                        }
                      }}
                      checked={
                        selectedPayrolls.length === payrolls.length &&
                        payrolls.length > 0
                      }
                    />
                  </th>
                  <th className="px-4 py-2 border-b text-left">Employee</th>
                  <th className="px-4 py-2 border-b text-left">Department</th>
                  <th className="px-4 py-2 border-b text-right">Gross</th>
                  <th className="px-4 py-2 border-b text-right">Deductions</th>
                  <th className="px-4 py-2 border-b text-right">Net Salary</th>
                  <th className="px-4 py-2 border-b text-center">Status</th>
                  <th className="px-4 py-2 border-b text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">
                      <input
                        type="checkbox"
                        checked={selectedPayrolls.includes(payroll._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPayrolls([...selectedPayrolls, payroll._id]);
                          } else {
                            setSelectedPayrolls(
                              selectedPayrolls.filter((id) => id !== payroll._id)
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-2 border-b">
                      <div className="font-medium text-gray-900">
                        {payroll.employee?.firstName} {payroll.employee?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payroll.employee?.employeeId}
                      </div>
                    </td>
                    <td className="px-4 py-2 border-b text-sm text-gray-700">
                      {payroll.employee?.department?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-2 border-b text-right text-sm text-gray-900">
                      {formatCurrency(payroll.summary?.grossEarnings)}
                    </td>
                    <td className="px-4 py-2 border-b text-right text-sm text-gray-900">
                      {formatCurrency(payroll.summary?.totalDeductions)}
                    </td>
                    <td className="px-4 py-2 border-b text-right text-sm text-gray-900">
                      {formatCurrency(payroll.summary?.netSalary)}
                    </td>
                    <td className="px-4 py-2 border-b text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          payroll.status
                        )}`}
                      >
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 border-b text-center">
                      <button className="inline-flex items-center px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate modal placeholder (hooked to handleGeneratePayroll) */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Generate Payroll
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This is a placeholder. Hook your PayrollGenerationSystem here and
              call handleGeneratePayroll with the form data.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollDashboard;
