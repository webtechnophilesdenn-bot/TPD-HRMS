// src/pages/payroll/PayrollDashboard.jsx
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
} from "lucide-react";
import PAYROLL_API from "../../services/payrollAPI";
import PayrollGenerationSystem from "./PayrollGenerationSystem"; // ✅ Import the component

const PayrollDashboard = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department: "",
    status: "",
  });
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  // ✅ Wrap in useCallback and define BEFORE useEffect
  const fetchPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PAYROLL_API.getAllPayrolls(filters);
      console.log("📊 Payrolls fetched:", response.data);
      setPayrolls(response.data.payrolls || []);

      // Also fetch analytics
      const analyticsResponse = await PAYROLL_API.getAnalytics({
        year: filters.year,
        month: filters.month,
      });
      setAnalytics(analyticsResponse.data || null);
    } catch (error) {
      console.error("Error fetching payrolls:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const handleGeneratePayroll = async (data) => {
    try {
      const response = await PAYROLL_API.generatePayroll(data);
      alert(
        `Payroll generated successfully! Generated: ${response.data.summary.generated}, Failed: ${response.data.summary.failed}`
      );
      setGenerationResult(response.data);
      fetchPayrolls();
      setShowGenerateModal(false);
    } catch (error) {
      console.error("Error generating payroll:", error);
      alert("Failed to generate payroll: " + error.message);
    }
  };

  const handleViewPayslip = (payroll) => {
    // Show payslip details in a modal
    setSelectedPayroll(payroll);
    setShowPayslipModal(true);
  };

const handleDownloadPayslip = async (payslipId) => {
    try {
      await PAYROLL_API.downloadPayslip(payslipId);
      // Payslip will open in new tab automatically
    } catch (error) {
      console.error("Error downloading payslip:", error);
      alert("Failed to download payslip: " + error.message);
    }
  };


  const handleBulkApprove = async () => {
    if (selectedPayrolls.length === 0) {
      alert("Please select payrolls to approve");
      return;
    }
    try {
      await PAYROLL_API.bulkUpdatePayrollStatus({
        payrollIds: selectedPayrolls,
        status: "Approved",
        remarks: "Bulk approval",
      });
      alert("Payrolls approved successfully");
      fetchPayrolls();
      setSelectedPayrolls([]);
    } catch (error) {
      console.error("Error approving payrolls:", error);
      alert("Failed to approve payrolls: " + error.message);
    }
  };

  const handleBulkPay = async () => {
    if (selectedPayrolls.length === 0) {
      alert("Please select payrolls to mark as paid");
      return;
    }
    try {
      await PAYROLL_API.bulkUpdatePayrollStatus({
        payrollIds: selectedPayrolls,
        status: "Paid",
        paymentDate: new Date().toISOString(),
        paymentMode: "Bank Transfer",
      });
      alert("Payrolls marked as paid successfully");
      fetchPayrolls();
      setSelectedPayrolls([]);
    } catch (error) {
      console.error("Error marking payrolls as paid:", error);
      alert("Failed to mark payrolls as paid: " + error.message);
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
      Generated: "bg-yellow-100 text-yellow-800",
      "Pending Approval": "bg-orange-100 text-orange-800",
      Approved: "bg-blue-100 text-blue-800",
      Paid: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      Draft: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Payroll Dashboard
          </h1>
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
            disabled={selectedPayrolls.length === 0}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Selected ({selectedPayrolls.length})
          </button>
          <button
            onClick={handleBulkPay}
            disabled={selectedPayrolls.length === 0}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Mark as Paid ({selectedPayrolls.length})
          </button>
          <button
            onClick={fetchPayrolls}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-600 text-white text-sm font-medium hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
            <p className="text-xs uppercase text-gray-500">
              Total Gross Payout
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(
                analytics?.summary?.totalGross ||
                  analytics?.summary?.totalGrossEarnings ||
                  0
              )}
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
              {formatCurrency(
                analytics?.summary?.totalNet ||
                  analytics?.summary?.totalNetSalary ||
                  0
              )}
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
              {analytics?.summary?.employeeCount || payrolls.length || 0}
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
          <button
            onClick={() =>
              setFilters({
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                department: "",
                status: "",
              })
            }
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Clear Filters
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Year
            </label>
            <input
              type="number"
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              min="2020"
              max="2030"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Month
            </label>
            <select
              value={filters.month}
              onChange={(e) =>
                handleFilterChange("month", Number(e.target.value))
              }
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString("en", { month: "long" })}
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
              onChange={(e) => handleFilterChange("department", e.target.value)}
              placeholder="All Departments"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
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

      {/* Payroll table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">
            Payroll Records
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              Showing {payrolls.length} records
            </span>
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
              <DollarSign className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500 text-sm">
              No payrolls found for the selected filters
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm"
            >
              Generate payroll to get started
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 border-b">
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
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3 border-b text-left font-medium text-gray-500">
                    Employee
                  </th>
                  <th className="px-4 py-3 border-b text-left font-medium text-gray-500">
                    Department
                  </th>
                  <th className="px-4 py-3 border-b text-right font-medium text-gray-500">
                    Gross
                  </th>
                  <th className="px-4 py-3 border-b text-right font-medium text-gray-500">
                    Deductions
                  </th>
                  <th className="px-4 py-3 border-b text-right font-medium text-gray-500">
                    Net Salary
                  </th>
                  <th className="px-4 py-3 border-b text-center font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 border-b text-center font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((payroll) => (
                  <tr key={payroll._id} className="hover:bg-gray-50 border-b">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPayrolls.includes(payroll._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPayrolls([
                              ...selectedPayrolls,
                              payroll._id,
                            ]);
                          } else {
                            setSelectedPayrolls(
                              selectedPayrolls.filter(
                                (id) => id !== payroll._id
                              )
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {payroll.employee?.firstName}{" "}
                        {payroll.employee?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payroll.employee?.employeeId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {payroll.employee?.department?.name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(
                        payroll.summary?.grossEarnings || payroll.grossSalary
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(
                        payroll.summary?.totalDeductions ||
                          payroll.totalDeductions
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">
                      {formatCurrency(
                        payroll.summary?.netSalary || payroll.netSalary
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          payroll.status
                        )}`}
                      >
                        {payroll.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewPayslip(payroll)}
                          className="inline-flex items-center px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800"
                          title="View Payslip Details"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadPayslip(payroll._id)}
                          className="inline-flex items-center px-2 py-1 text-xs text-green-600 hover:text-green-800"
                          title="Download Payslip PDF"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
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

      {/* Payslip Details Modal */}
      {showPayslipModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Payslip Details
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedPayroll.employee?.firstName}{" "}
                  {selectedPayroll.employee?.lastName} -{" "}
                  {new Date(
                    selectedPayroll.year,
                    selectedPayroll.month - 1
                  ).toLocaleString("default", { month: "long" })}{" "}
                  {selectedPayroll.year}
                </p>
              </div>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Display payslip details here */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Earnings</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium">
                        {formatCurrency(
                          selectedPayroll.earnings?.basic ||
                            selectedPayroll.earnings?.basicSalary ||
                            0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">HRA</span>
                      <span className="font-medium">
                        {formatCurrency(selectedPayroll.earnings?.hra || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Special Allowance</span>
                      <span className="font-medium">
                        {formatCurrency(
                          selectedPayroll.earnings?.specialAllowance || 0
                        )}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Total Earnings</span>
                      <span className="text-green-600">
                        {formatCurrency(
                          selectedPayroll.summary?.grossEarnings ||
                            selectedPayroll.grossSalary ||
                            0
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">PF</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(
                          selectedPayroll.deductions?.pfEmployee ||
                            selectedPayroll.deductions?.providentFund ||
                            0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Professional Tax</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(
                          selectedPayroll.deductions?.professionalTax || 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TDS</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(
                          selectedPayroll.deductions?.tds ||
                            selectedPayroll.deductions?.incomeTax ||
                            0
                        )}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>Total Deductions</span>
                      <span className="text-red-600">
                        {formatCurrency(
                          selectedPayroll.summary?.totalDeductions ||
                            selectedPayroll.totalDeductions ||
                            0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    Net Salary
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      selectedPayroll.summary?.netSalary ||
                        selectedPayroll.netSalary ||
                        0
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => handleDownloadPayslip(selectedPayroll._id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Generate Payroll
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Use the actual PayrollGenerationSystem component */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <PayrollGenerationSystem
                onClose={() => {
                  setShowGenerateModal(false);
                  fetchPayrolls(); // Refresh the list after generation
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Generation Result Toast */}
      {generationResult && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">Payroll Generated</h4>
              <p className="text-sm text-green-800 mt-1">
                Generated: {generationResult.summary?.generated} employees
                <br />
                Failed: {generationResult.summary?.failed} employees
                <br />
                Total Payout:{" "}
                {formatCurrency(generationResult.summary?.totalPayout)}
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
