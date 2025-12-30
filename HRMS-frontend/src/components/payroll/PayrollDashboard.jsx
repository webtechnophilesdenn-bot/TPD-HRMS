// src/components/payroll/PayrollDashboard.jsx - COMPLETE ENHANCED VERSION
import React, { useState, useEffect, useCallback } from "react";
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
  Shield,
  Settings,
  Clock
} from "lucide-react";
import payrollAPI from "../../services/payrollAPI";
import { apiService } from "../../services/apiService";
import PayrollGenerationSystem from "./PayrollGenerationSystem";

const PayrollDashboard = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [userDepartment, setUserDepartment] = useState(null);
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department: "",
    status: "",
    page: 1,
    limit: 50
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Fetch user context
  useEffect(() => {
    const fetchUserContext = async () => {
      try {
        const response = await apiService.getCurrentUser();
        const user = response.data;
        setUserRole(user.role);
        setUserDepartment(user.department);

        // Fetch departments based on role
        if (user.role === "admin") {
          const deptResponse = await apiService.getDepartments();
          setDepartments(deptResponse.data?.departments || deptResponse.data || []);
        } else if (
          user.role === "hr" &&
          user.permissions?.departments?.length > 0
        ) {
          const deptResponse = await apiService.getDepartments();
          const accessibleDepts = (deptResponse.data?.departments || deptResponse.data || []).filter((dept) =>
            user.permissions.departments.includes(dept._id)
          );
          setDepartments(accessibleDepts);
        } else if (user.role === "manager" && user.department) {
          const deptResponse = await apiService.getDepartments();
          const managerDept = (deptResponse.data?.departments || deptResponse.data || []).find(
            (dept) => dept._id === user.department
          );
          if (managerDept) {
            setDepartments([managerDept]);
            setFilters((prev) => ({ ...prev, department: user.department }));
          }
        }
      } catch (error) {
        console.error("Error fetching user context:", error);
      }
    };
    fetchUserContext();
  }, []);

  // Fetch payrolls
  const fetchPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getAllPayrolls(filters);
      console.log("Payroll Response:", response);

      // Access payrolls correctly
      const payrollData =
        response.data?.payrolls ||
        response.payrolls ||
        response.data?.data ||
        [];
      setPayrolls(payrollData);

      // Calculate analytics from payroll data
      if (payrollData.length > 0) {
        const calculatedSummary = {
          totalGross: payrollData.reduce(
            (sum, p) => sum + (p.summary?.grossEarnings || 0),
            0
          ),
          totalNet: payrollData.reduce(
            (sum, p) => sum + (p.summary?.netSalary || 0),
            0
          ),
          totalDeductions: payrollData.reduce(
            (sum, p) => sum + (p.summary?.totalDeductions || 0),
            0
          ),
          totalCTC: payrollData.reduce(
            (sum, p) => sum + (p.summary?.costToCompany || 0),
            0
          ),
          employeeCount: payrollData.length,
          byStatus: payrollData.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {})
        };
        setAnalytics({ summary: calculatedSummary });
      } else {
        setAnalytics({
          summary: {
            totalGross: 0,
            totalNet: 0,
            totalDeductions: 0,
            totalCTC: 0,
            employeeCount: 0,
            byStatus: {}
          },
        });
      }
    } catch (error) {
      console.error("Error fetching payrolls:", error);
      setPayrolls([]);
      setAnalytics({
        summary: {
          totalGross: 0,
          totalNet: 0,
          totalDeductions: 0,
          employeeCount: 0,
          byStatus: {}
        },
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const handleGeneratePayroll = () => {
    setShowGenerateModal(true);
  };

  const handleViewPayslip = (payroll) => {
    setSelectedPayroll(payroll);
    setShowPayslipModal(true);
  };

  const handleDownloadPayslip = async (payslipId) => {
    try {
      await payrollAPI.downloadPayslip(payslipId);
    } catch (error) {
      console.error("Error downloading payslip:", error);
      alert(`Failed to download payslip: ${error.message}`);
    }
  };

  const handleDownloadReport = async () => {
    try {
      await payrollAPI.downloadPayrollReport(filters);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert(`Failed to download report: ${error.message}`);
    }
  };

  const handleUpdateStatus = async (payrollId, newStatus) => {
    try {
      await payrollAPI.updatePayrollStatus(payrollId, {
        status: newStatus,
        remarks: `Status updated to ${newStatus}`
      });
      alert(`Payroll status updated to ${newStatus}`);
      fetchPayrolls();
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedPayrolls.length === 0) {
      alert("Please select payrolls to approve");
      return;
    }
    try {
      await payrollAPI.bulkUpdatePayrollStatus({
        payrollIds: selectedPayrolls,
        status: "Approved",
        remarks: "Bulk approval",
      });
      alert("Payrolls approved successfully");
      fetchPayrolls();
      setSelectedPayrolls([]);
    } catch (error) {
      console.error("Error approving payrolls:", error);
      alert(`Failed to approve payrolls: ${error.message}`);
    }
  };

  const handleBulkPay = async () => {
    if (selectedPayrolls.length === 0) {
      alert("Please select payrolls to mark as paid");
      return;
    }
    try {
      await payrollAPI.bulkUpdatePayrollStatus({
        payrollIds: selectedPayrolls,
        status: "Paid",
        remarks: "Bulk payment processing"
      });
      alert("Payrolls marked as paid successfully");
      fetchPayrolls();
      setSelectedPayrolls([]);
    } catch (error) {
      console.error("Error marking payrolls as paid:", error);
      alert(`Failed to mark payrolls as paid: ${error.message}`);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPayrolls(payrolls.map((p) => p._id));
    } else {
      setSelectedPayrolls([]);
    }
  };

  const handleSelectPayroll = (payrollId, checked) => {
    if (checked) {
      setSelectedPayrolls([...selectedPayrolls, payrollId]);
    } else {
      setSelectedPayrolls(selectedPayrolls.filter((id) => id !== payrollId));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      Draft: "bg-gray-100 text-gray-800",
      "Pending Approval": "bg-orange-100 text-orange-800",
      Approved: "bg-blue-100 text-blue-800",
      Processing: "bg-indigo-100 text-indigo-800",
      Paid: "bg-green-100 text-green-800",
      "On Hold": "bg-yellow-100 text-yellow-800",
      Rejected: "bg-red-100 text-red-800",
      Cancelled: "bg-gray-100 text-gray-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const canGeneratePayroll = ["admin", "hr"].includes(userRole);
  const canApprove = ["admin", "hr", "finance"].includes(userRole);
  const canProcessPayment = ["admin", "finance"].includes(userRole);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600 mt-1">
            Manage employee payrolls and generate monthly salary
            {userRole === "manager" && " - Department View"}
            {userRole === "employee" && " - My Payslips"}
          </p>
        </div>
        <div className="flex gap-2">
          {canGeneratePayroll && (
            <button
              onClick={handleGeneratePayroll}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <PlayCircle className="w-5 h-5" />
              Generate Payroll
            </button>
          )}
          <button
            onClick={fetchPayrolls}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gross Payout</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(analytics?.summary?.totalGross || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Net Payout</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(analytics?.summary?.totalNet || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deductions</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(analytics?.summary?.totalDeductions || 0)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {analytics?.summary?.employeeCount || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
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

          {departments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
              <option value="On Hold">On Hold</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  department: "",
                  status: "",
                })
              }
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPayrolls.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-indigo-900 font-medium">
              {selectedPayrolls.length} payroll(s) selected
            </span>
            <div className="flex gap-2">
              {canApprove && (
                <button
                  onClick={handleBulkApprove}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Selected
                </button>
              )}
              {canProcessPayment && (
                <button
                  onClick={handleBulkPay}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Mark as Paid
                </button>
              )}
              <button
                onClick={() => setSelectedPayrolls([])}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading payrolls...</p>
            </div>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No payrolls found for the selected filters</p>
            {canGeneratePayroll && (
              <button
                onClick={handleGeneratePayroll}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Generate Payroll
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {canApprove && (
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedPayrolls.length === payrolls.length &&
                          payrolls.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrolls.map((payroll) => (
                  <tr key={payroll._id} className="hover:bg-gray-50">
                    {canApprove && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPayrolls.includes(payroll._id)}
                          onChange={(e) =>
                            handleSelectPayroll(payroll._id, e.target.checked)
                          }
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {payroll.employee?.firstName} {payroll.employee?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payroll.employee?.employeeId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payroll.employee?.department?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {months[payroll.month - 1]} {payroll.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(payroll.summary?.grossEarnings || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {formatCurrency(payroll.summary?.totalDeductions || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      {formatCurrency(payroll.summary?.netSalary || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          payroll.status
                        )}`}
                      >
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewPayslip(payroll)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {["Approved", "Paid"].includes(payroll.status) && (
                          <button
                            onClick={() => handleDownloadPayslip(payroll._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Download Payslip"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {canApprove && payroll.status === "Pending Approval" && (
                          <button
                            onClick={() => handleUpdateStatus(payroll._id, "Approved")}
                            className="text-blue-600 hover:text-blue-900"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {canProcessPayment && payroll.status === "Approved" && (
                          <button
                            onClick={() => handleUpdateStatus(payroll._id, "Paid")}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Paid"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Detail Modal */}
      {showPayslipModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Payslip Details</h2>
                  <p className="text-gray-600">
                    {months[selectedPayroll.month - 1]} {selectedPayroll.year}
                  </p>
                </div>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Employee Information */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Employee Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {selectedPayroll.employee?.firstName} {selectedPayroll.employee?.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Employee ID:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {selectedPayroll.employee?.employeeId}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Department:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {selectedPayroll.employee?.department?.name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Designation:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {selectedPayroll.employee?.designation?.title || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Attendance Summary</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Total Working Days:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {selectedPayroll.attendanceData?.totalWorkingDays || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Paid Days:</span>
                      <span className="text-sm font-medium text-green-600 ml-2">
                        {selectedPayroll.attendanceData?.paidDays || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">LOP Days:</span>
                      <span className="text-sm font-medium text-red-600 ml-2">
                        {selectedPayroll.attendanceData?.lopDays || 0}
                      </span>
                    </div>
                    {selectedPayroll.attendanceData?.overtimeHours > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Overtime Hours:</span>
                        <span className="text-sm font-medium text-blue-600 ml-2">
                          {selectedPayroll.attendanceData.overtimeHours}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Earnings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Earnings</h3>
                  <div className="space-y-2">
                    {selectedPayroll.earnings?.basic > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Basic Salary</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.earnings.basic)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.earnings?.hra > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">HRA</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.earnings.hra)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.earnings?.specialAllowance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Special Allowance</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.earnings.specialAllowance)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.earnings?.conveyance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conveyance</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.earnings.conveyance)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.earnings?.medicalAllowance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Medical Allowance</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.earnings.medicalAllowance)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.earnings?.overtime > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Overtime</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.earnings.overtime)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-bold text-gray-900">Gross Earnings</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(selectedPayroll.summary?.grossEarnings || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Deductions</h3>
                  <div className="space-y-2">
                    {selectedPayroll.deductions?.pfEmployee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">PF (Employee)</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.deductions.pfEmployee)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.deductions?.esiEmployee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">ESI (Employee)</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.deductions.esiEmployee)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.deductions?.professionalTax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Professional Tax</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.deductions.professionalTax)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.deductions?.tds > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">TDS</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.deductions.tds)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.deductions?.lossOfPay > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Loss of Pay</span>
                        <span className="text-sm font-medium text-red-600">
                          {formatCurrency(selectedPayroll.deductions.lossOfPay)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.deductions?.loanRecovery?.amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Loan Recovery</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.deductions.loanRecovery.amount)}
                        </span>
                      </div>
                    )}
                    {selectedPayroll.deductions?.advanceRecovery?.amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Advance Recovery</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(selectedPayroll.deductions.advanceRecovery.amount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-bold text-gray-900">Total Deductions</span>
                      <span className="text-sm font-bold text-red-600">
                        {formatCurrency(selectedPayroll.summary?.totalDeductions || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-green-700 font-medium">Net Salary Payable</p>
                    <p className="text-xs text-green-600 mt-1">After all deductions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-700">
                      {formatCurrency(selectedPayroll.summary?.netSalary || 0)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Take Home</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownloadPayslip(selectedPayroll._id)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Payslip
                </button>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generation Result Alert */}
      {generationResult && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Payroll Generated Successfully!</h4>
              <p className="text-sm text-green-700 mt-1">
                Generated: {generationResult.summary?.success} employees
                <br />
                Total Payout: {formatCurrency(generationResult.summary?.totalNetPaid || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <PayrollGenerationSystem
          onClose={() => {
            setShowGenerateModal(false);
            fetchPayrolls();
          }}
        />
      )}
    </div>
  );
};

export default PayrollDashboard;
