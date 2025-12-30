// src/components/payroll/EmployeePayslipView.jsx - COMPLETE ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Eye,
  X,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2
} from 'lucide-react';
import payrollAPI from '../../services/payrollAPI';

const EmployeePayslipView = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [showSalaryStructure, setShowSalaryStructure] = useState(false);
  const [expandedPayslip, setExpandedPayslip] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: '',
    status: ''
  });
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalDeductions: 0,
    totalNetSalary: 0,
    count: 0,
    yearToDate: {
      gross: 0,
      deductions: 0,
      net: 0
    }
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchPayslips();
    fetchSalaryStructure();
  }, [filters]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getMyPayslips(filters);
      
      const payslipData = response.data?.payslips || response.data || [];
      setPayslips(payslipData);

      // Calculate summary
      if (payslipData.length > 0) {
        const calculatedSummary = {
          totalEarnings: payslipData.reduce((sum, p) => sum + (p.summary?.grossEarnings || 0), 0),
          totalDeductions: payslipData.reduce((sum, p) => sum + (p.summary?.totalDeductions || 0), 0),
          totalNetSalary: payslipData.reduce((sum, p) => sum + (p.summary?.netSalary || 0), 0),
          count: payslipData.length,
          yearToDate: {
            gross: payslipData.reduce((sum, p) => sum + (p.summary?.grossEarnings || 0), 0),
            deductions: payslipData.reduce((sum, p) => sum + (p.summary?.totalDeductions || 0), 0),
            net: payslipData.reduce((sum, p) => sum + (p.summary?.netSalary || 0), 0)
          }
        };
        setSummary(calculatedSummary);
      } else {
        setSummary({
          totalEarnings: 0,
          totalDeductions: 0,
          totalNetSalary: 0,
          count: 0,
          yearToDate: { gross: 0, deductions: 0, net: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      setPayslips([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryStructure = async () => {
    try {
      const response = await payrollAPI.getSalaryStructure();
      setSalaryStructure(response.data?.salaryStructure || response.data);
    } catch (error) {
      console.error('Error fetching salary structure:', error);
    }
  };

  const handleDownloadPayslip = async (payslipId) => {
    try {
      await payrollAPI.downloadPayslip(payslipId);
    } catch (error) {
      console.error('Error downloading payslip:', error);
      alert('Failed to download payslip');
    }
  };

  const handleViewDetails = (payslip) => {
    setSelectedPayslip(payslip);
    setShowDetailsModal(true);
  };

  const togglePayslipExpand = (payslipId) => {
    setExpandedPayslip(expandedPayslip === payslipId ? null : payslipId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: 'bg-gray-100 text-gray-800',
      'Pending Approval': 'bg-orange-100 text-orange-800',
      Approved: 'bg-blue-100 text-blue-800',
      Processing: 'bg-indigo-100 text-indigo-800',
      Paid: 'bg-green-100 text-green-800',
      'On Hold': 'bg-yellow-100 text-yellow-800',
      Rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'Approved':
      case 'Processing':
        return <Clock className="w-4 h-4" />;
      case 'Rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
        <p className="text-gray-600 mt-1">View and download your salary payslips</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Earnings (YTD)</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(summary.yearToDate.gross)}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Deductions (YTD)</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(summary.yearToDate.deductions)}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Net Salary (YTD)</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(summary.yearToDate.net)}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <DollarSign className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Payslips</p>
              <p className="text-3xl font-bold mt-2">{summary.count}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FileText className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filter Payslips</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Months</option>
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Approved">Approved</option>
              <option value="Processing">Processing</option>
              <option value="Pending Approval">Pending Approval</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={fetchPayslips}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {salaryStructure && (
              <button
                onClick={() => setShowSalaryStructure(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                title="View Salary Structure"
              >
                <Building2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payslips List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading payslips...</p>
            </div>
          </div>
        ) : payslips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No payslips found</p>
            <p className="text-gray-500 text-sm mt-2">Your payslips will appear here once generated</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payslips.map((payslip) => (
              <div key={payslip._id} className="hover:bg-gray-50 transition">
                {/* Payslip Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {months[payslip.month - 1]} {payslip.year}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Generated on {new Date(payslip.generatedAt || payslip.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Net Salary</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(payslip.summary?.netSalary)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(payslip.status)}`}>
                          {getStatusIcon(payslip.status)}
                          {payslip.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Summary */}
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Gross Earnings</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {formatCurrency(payslip.summary?.grossEarnings)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Total Deductions</p>
                      <p className="text-lg font-semibold text-red-600 mt-1">
                        {formatCurrency(payslip.summary?.totalDeductions)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600">Paid Days</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {payslip.attendanceData?.paidDays || 0} / {payslip.attendanceData?.totalWorkingDays || 0}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => togglePayslipExpand(payslip._id)}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      {expandedPayslip === payslip._id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          View Details
                        </>
                      )}
                    </button>
                    {['Approved', 'Paid'].includes(payslip.status) && (
                      <button
                        onClick={() => handleDownloadPayslip(payslip._id)}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedPayslip === payslip._id && (
                  <div className="px-6 pb-6 bg-gray-50">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Earnings Breakdown */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          Earnings Breakdown
                        </h4>
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          {payslip.earnings?.basic > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Basic Salary</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.earnings.basic)}</span>
                            </div>
                          )}
                          {payslip.earnings?.hra > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">HRA</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.earnings.hra)}</span>
                            </div>
                          )}
                          {payslip.earnings?.specialAllowance > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Special Allowance</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.earnings.specialAllowance)}</span>
                            </div>
                          )}
                          {payslip.earnings?.conveyance > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Conveyance</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.earnings.conveyance)}</span>
                            </div>
                          )}
                          {payslip.earnings?.medicalAllowance > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Medical Allowance</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.earnings.medicalAllowance)}</span>
                            </div>
                          )}
                          {payslip.earnings?.overtime > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Overtime</span>
                              <span className="font-medium text-green-600">{formatCurrency(payslip.earnings.overtime)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="font-bold text-gray-900">Total Earnings</span>
                            <span className="font-bold text-green-600">{formatCurrency(payslip.summary?.grossEarnings)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions Breakdown */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-red-600" />
                          Deductions Breakdown
                        </h4>
                        <div className="bg-white rounded-lg p-4 space-y-2">
                          {payslip.deductions?.pfEmployee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">PF (Employee)</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.deductions.pfEmployee)}</span>
                            </div>
                          )}
                          {payslip.deductions?.esiEmployee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">ESI (Employee)</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.deductions.esiEmployee)}</span>
                            </div>
                          )}
                          {payslip.deductions?.professionalTax > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Professional Tax</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.deductions.professionalTax)}</span>
                            </div>
                          )}
                          {payslip.deductions?.tds > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">TDS</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.deductions.tds)}</span>
                            </div>
                          )}
                          {payslip.deductions?.lossOfPay > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Loss of Pay</span>
                              <span className="font-medium text-red-600">{formatCurrency(payslip.deductions.lossOfPay)}</span>
                            </div>
                          )}
                          {payslip.deductions?.loanRecovery?.amount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Loan Recovery</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.deductions.loanRecovery.amount)}</span>
                            </div>
                          )}
                          {payslip.deductions?.advanceRecovery?.amount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Advance Recovery</span>
                              <span className="font-medium text-gray-900">{formatCurrency(payslip.deductions.advanceRecovery.amount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                            <span className="font-bold text-gray-900">Total Deductions</span>
                            <span className="font-bold text-red-600">{formatCurrency(payslip.summary?.totalDeductions)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Details */}
                    {payslip.attendanceData && (
                      <div className="mt-4 bg-white rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Attendance Summary</h4>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Total Days</p>
                            <p className="text-lg font-semibold text-gray-900">{payslip.attendanceData.totalWorkingDays}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Present Days</p>
                            <p className="text-lg font-semibold text-green-600">{payslip.attendanceData.presentDays}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Paid Days</p>
                            <p className="text-lg font-semibold text-blue-600">{payslip.attendanceData.paidDays}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">LOP Days</p>
                            <p className="text-lg font-semibold text-red-600">{payslip.attendanceData.lopDays}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salary Structure Modal */}
      {showSalaryStructure && salaryStructure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Salary Structure</h2>
                <button
                  onClick={() => setShowSalaryStructure(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Earnings */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Monthly Earnings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium">{formatCurrency(salaryStructure.earnings?.basic)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">HRA ({salaryStructure.earnings?.hraPercentage}%)</span>
                      <span className="font-medium">{formatCurrency(salaryStructure.earnings?.hra)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Special Allowance</span>
                      <span className="font-medium">{formatCurrency(salaryStructure.earnings?.specialAllowance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Conveyance</span>
                      <span className="font-medium">{formatCurrency(salaryStructure.earnings?.conveyance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Medical Allowance</span>
                      <span className="font-medium">{formatCurrency(salaryStructure.earnings?.medicalAllowance)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="font-bold">Gross Salary</span>
                      <span className="font-bold text-green-600">{formatCurrency(salaryStructure.summary?.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Monthly Deductions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PF ({salaryStructure.deductions?.pf?.employeePercentage}%)</span>
                      <span className="font-medium">{formatCurrency(salaryStructure.deductions?.pf?.employeeContribution)}</span>
                    </div>
                    {salaryStructure.deductions?.esi?.applicable && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">ESI ({salaryStructure.deductions?.esi?.employeePercentage}%)</span>
                        <span className="font-medium">{formatCurrency(salaryStructure.deductions?.esi?.employeeContribution)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Professional Tax</span>
                      <span className="font-medium">{formatCurrency(salaryStructure.deductions?.professionalTax?.amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="font-bold">Total Deductions</span>
                      <span className="font-bold text-red-600">{formatCurrency(salaryStructure.summary?.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="mt-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Monthly Take Home</p>
                    <p className="text-xs text-green-600 mt-1">Net Salary (after deductions)</p>
                  </div>
                  <p className="text-3xl font-bold text-green-700">
                    {formatCurrency(salaryStructure.summary?.netSalary)}
                  </p>
                </div>
              </div>

              {/* CTC */}
              <div className="mt-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-indigo-700 font-medium">Annual CTC</p>
                    <p className="text-xs text-indigo-600 mt-1">Cost to Company (yearly)</p>
                  </div>
                  <p className="text-3xl font-bold text-indigo-700">
                    {formatCurrency(salaryStructure.summary?.costToCompany * 12)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePayslipView;
