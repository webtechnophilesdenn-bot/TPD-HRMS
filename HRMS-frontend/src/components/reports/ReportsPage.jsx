import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  Building2,
  ChevronDown,
} from "lucide-react";
import { apiService } from "../../services/apiService";
import { useNotification } from "../../hooks/useNotification";

const ReportsPage = () => {

  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState("attendance");
  const [reportData, setReportData] = useState(null);
  const [stats, setStats] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    department: "",
    status: "",
    employeeId: "",
    leaveType: "",
    employmentType: "",
  });

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Report types configuration
  const reportTypes = [
    {
      id: "attendance",
      name: "Attendance Report",
      icon: Clock,
      color: "blue",
      description: "View employee attendance records",
    },
    {
      id: "leave",
      name: "Leave Report",
      icon: Calendar,
      color: "green",
      description: "Track leave requests and balances",
    },
    {
      id: "payroll",
      name: "Payroll Report",
      icon: DollarSign,
      color: "purple",
      description: "Analyze salary and payment data",
    },
    {
      id: "employee",
      name: "Employee Report",
      icon: Users,
      color: "orange",
      description: "Employee demographics and statistics",
    },
    {
      id: "department",
      name: "Department Report",
      icon: Building2,
      color: "indigo",
      description: "Department-wise analysis",
    },
  ];

  // Load initial data
  useEffect(() => {
    loadDepartments();
    loadEmployees();
  }, []);

  // Load report when active report changes
  useEffect(() => {
    generateReport();
  }, [activeReport]);

  const loadDepartments = async () => {
    try {
      const response = await apiService.getAllDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiService.getAllEmployees();
      setEmployees(response.data?.employees || response.data || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      const currentFilters = { ...filters };

      switch (activeReport) {
        case "attendance":
          response = await apiService.getAttendanceReport(currentFilters);
          setReportData(response.data?.attendances || []);
          setStats(response.data?.stats || {});
          break;

        case "leave":
          response = await apiService.getLeaveReport(currentFilters);
          setReportData(response.data?.leaves || []);
          setStats(response.data?.stats || {});
          break;

        case "payroll":
          response = await apiService.getPayrollReport(currentFilters);
          setReportData(response.data?.payrolls || []);
          setStats(response.data?.stats || {});
          break;

        case "employee":
          response = await apiService.getEmployeeReport(currentFilters);
          setReportData(response.data?.employees || []);
          setStats(response.data?.stats || {});
          break;

        case "department":
          response = await apiService.getDepartmentReport();
          setReportData(response.data?.departments || []);
          setStats(null);
          break;

        default:
          break;
      }

    showSuccess("Report generated successfully!");
    } catch (error) {
      console.error("Failed to generate report:", error);
      showError("Failed to generate report");
      setReportData([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const exportReport = () => {
    if (!reportData || reportData.length === 0) {
     showError("Your error message");

      return;
    }

    // Simple CSV export
    const headers = Object.keys(reportData[0]).join(",");
    const rows = reportData.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeReport}_report_${new Date().toISOString()}.csv`;
    a.click();

    showSuccess("Report exported successfully!");

  };

  // Render Statistics Cards
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white p-4 rounded-lg shadow border border-gray-200">
            <div className="text-sm text-gray-600 capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {typeof value === "object" ? JSON.stringify(value) : value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Filters
  const renderFilters = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter (for attendance and payroll) */}
          {(activeReport === "attendance" || activeReport === "payroll") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={filters.month}
                onChange={(e) => handleFilterChange("month", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month - 1).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Filter */}
          {activeReport !== "department" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
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
          )}

          {/* Status Filter */}
          {(activeReport === "attendance" || activeReport === "leave") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                {activeReport === "attendance" ? (
                  <>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                    <option value="Half Day">Half Day</option>
                  </>
                ) : (
                  <>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Loading...</span>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Data Table
  const renderTable = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <div className="bg-white p-8 rounded-lg shadow border border-gray-200 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No data available for the selected filters</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(reportData[0]).map((key) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {Object.values(row).map((value, cellIdx) => (
                    <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {typeof value === "object" ? JSON.stringify(value) : value?.toString() || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">
          Generate and export comprehensive HRMS reports
        </p>
      </div>

      {/* Report Type Selector */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const isActive = activeReport === report.id;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? `border-${report.color}-500 bg-${report.color}-50`
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <Icon
                className={`h-8 w-8 mx-auto mb-2 ${
                  isActive ? `text-${report.color}-600` : "text-gray-600"
                }`}
              />
              <div className="text-sm font-semibold text-gray-900">
                {report.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {report.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Export Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={exportReport}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Statistics */}
      {renderStats()}

      {/* Data Table */}
      {renderTable()}
    </div>
  );
};

export default ReportsPage;
