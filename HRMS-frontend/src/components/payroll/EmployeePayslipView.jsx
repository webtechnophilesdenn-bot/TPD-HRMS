import React, { useState, useEffect } from 'react';
import { Download, Calendar, DollarSign, TrendingUp, FileText, Eye } from 'lucide-react';
import PAYROLL_API from '../../services/payrollAPI';

const EmployeePayslipView = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: '',
  });
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalDeductions: 0,
    totalNetSalary: 0,
    count: 0,
  });

  useEffect(() => {
    fetchPayslips();
  }, [filters]);

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const response = await PAYROLL_API.getMyPayslips(filters);
      setPayslips(response.data.payslips);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching payslips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPayslip = async (payrollId) => {
    try {
      const response = await PAYROLL_API.downloadPayslip(payrollId);
      console.log('Download payslip:', response.data);
      // Implement PDF generation here
    } catch (error) {
      console.error('Error downloading payslip:', error);
    }
  };

  const handleViewDetails = (payslip) => {
    setSelectedPayslip(payslip);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Payslips</h1>
          <p className="text-gray-600 mt-1">View and download your salary payslips</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Earnings (YTD)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalEarnings)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deductions (YTD)</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalDeductions)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Salary (YTD)</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalNetSalary)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payslips</p>
                <p className="text-2xl font-bold text-gray-900">{summary.count}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                className="border rounded-lg px-3 py-2"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payslips List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading payslips...</p>
            </div>
          ) : payslips.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payslips found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payslips.map((payslip) => (
                  <tr key={payslip._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {getMonthName(payslip.period.month)} {payslip.period.year}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-green-600 font-semibold">
                        {formatCurrency(payslip.summary.grossEarnings)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-red-600 font-semibold">
                        {formatCurrency(payslip.summary.totalDeductions)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-blue-600 font-bold">
                        {formatCurrency(payslip.summary.netSalary)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payslip.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        payslip.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payslip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(payslip)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPayslip(payslip._id)}
                          className="text-green-600 hover:text-green-800"
                          title="Download Payslip"
                        >
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

        {/* Payslip Details Modal */}
        {showDetailsModal && selectedPayslip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Payslip - {getMonthName(selectedPayslip.period.month)} {selectedPayslip.period.year}
                  </h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Earnings Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Earnings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between p-3 bg-green-50 rounded">
                      <span className="text-gray-700">Basic Salary</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedPayslip.earnings.basic)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded">
                      <span className="text-gray-700">HRA</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedPayslip.earnings.hra)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded">
                      <span className="text-gray-700">Special Allowance</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedPayslip.earnings.specialAllowance)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-green-50 rounded">
                      <span className="text-gray-700">Conveyance</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(selectedPayslip.earnings.conveyance)}
                      </span>
                    </div>
                    {selectedPayslip.earnings.overtime > 0 && (
                      <div className="flex justify-between p-3 bg-green-50 rounded">
                        <span className="text-gray-700">Overtime</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(selectedPayslip.earnings.overtime)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-green-100 rounded flex justify-between">
                    <span className="font-bold text-gray-900">Total Earnings</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(selectedPayslip.summary.grossEarnings)}
                    </span>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Deductions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between p-3 bg-red-50 rounded">
                      <span className="text-gray-700">PF (Employee)</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(selectedPayslip.deductions.pfEmployee)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-50 rounded">
                      <span className="text-gray-700">ESI (Employee)</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(selectedPayslip.deductions.esiEmployee)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-50 rounded">
                      <span className="text-gray-700">Professional Tax</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(selectedPayslip.deductions.professionalTax)}
                      </span>
                    </div>
                    <div className="flex justify-between p-3 bg-red-50 rounded">
                      <span className="text-gray-700">TDS</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(selectedPayslip.deductions.tds)}
                      </span>
                    </div>
                    {selectedPayslip.deductions.lossOfPay > 0 && (
                      <div className="flex justify-between p-3 bg-red-50 rounded">
                        <span className="text-gray-700">Loss of Pay</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(selectedPayslip.deductions.lossOfPay)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 p-3 bg-red-100 rounded flex justify-between">
                    <span className="font-bold text-gray-900">Total Deductions</span>
                    <span className="font-bold text-red-600">
                      {formatCurrency(selectedPayslip.summary.totalDeductions)}
                    </span>
                  </div>
                </div>

                {/* Net Salary */}
                <div className="p-4 bg-blue-100 rounded-lg flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Net Salary</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedPayslip.summary.netSalary)}
                  </span>
                </div>

                {/* Attendance */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Attendance Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Present Days</span>
                      <p className="text-xl font-bold text-gray-900">{selectedPayslip.attendance.presentDays}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">Paid Days</span>
                      <p className="text-xl font-bold text-gray-900">{selectedPayslip.attendance.paidDays}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">LOP Days</span>
                      <p className="text-xl font-bold text-gray-900">{selectedPayslip.attendance.lossOfPayDays}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <button
                  onClick={() => handleDownloadPayslip(selectedPayslip._id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Payslip PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePayslipView;
