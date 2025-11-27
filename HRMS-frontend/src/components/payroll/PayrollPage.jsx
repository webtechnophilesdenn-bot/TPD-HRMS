import React, { useState, useEffect } from "react";
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
  Settings,
  RefreshCw,
  PlayCircle,
  Clock,
  Mail,
  X,
} from "lucide-react";

// Mock API Service
const mockApiService = {
  getAllEmployees: async (filters) => ({
    data: {
      employees: [
        {
          _id: "1",
          employeeId: "EMP001",
          firstName: "John",
          lastName: "Doe",
          department: { _id: "1", name: "Engineering" },
          designation: { title: "Senior Developer" },
          salaryStructure: { basic: 60000 },
          status: "Active",
        },
        {
          _id: "2",
          employeeId: "EMP002",
          firstName: "Jane",
          lastName: "Smith",
          department: { _id: "2", name: "Marketing" },
          designation: { title: "Marketing Manager" },
          salaryStructure: { basic: 80000 },
          status: "Active",
        },
        {
          _id: "3",
          employeeId: "EMP003",
          firstName: "Mike",
          lastName: "Johnson",
          department: { _id: "1", name: "Engineering" },
          designation: { title: "Junior Developer" },
          salaryStructure: { basic: 45000 },
          status: "Active",
        },
      ],
    },
  }),
  getDepartments: async () => ({
    data: {
      departments: [
        { _id: "1", name: "Engineering" },
        { _id: "2", name: "Marketing" },
        { _id: "3", name: "Sales" },
        { _id: "4", name: "HR" },
      ],
    },
  }),
  generatePayroll: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      data: {
        generated: data.employees?.length || 10,
        errors: [],
        payrolls: [],
        summary: {
          totalEmployees: data.employees?.length || 10,
          processed: data.employees?.length || 10,
          failed: 0,
          totalPayout: 1250000,
        },
      },
    };
  },
  getAllPayrolls: async (filters) => ({
    data: {
      payrolls: [
        {
          _id: "1",
          payrollId: "PAY000001",
          month: 10,
          year: 2024,
          status: "Generated",
          employee: {
            firstName: "John",
            lastName: "Doe",
            employeeId: "EMP001",
          },
          summary: {
            grossEarnings: 95000,
            totalDeductions: 13000,
            netSalary: 82000,
          },
        },
      ],
      summary: {
        totalNetSalary: 4500000,
        totalGrossEarnings: 5200000,
        totalDeductions: 700000,
        totalEmployees: 45,
      },
    },
  }),
};

// PayrollGenerationSystem Component
const PayrollGenerationSystem = ({ onClose, showNotification }) => {
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [config, setConfig] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: "",
    includeInactive: false,
    autoApprove: false,
    sendNotifications: true,
    processOvertime: true,
  });

  const [departments, setDepartments] = useState([]);
  const [employeePreview, setEmployeePreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (showPreview) {
      loadEmployeePreview();
    }
  }, [config.department, showPreview]);

  const loadDepartments = async () => {
    try {
      const response = await mockApiService.getDepartments();
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  };

  const loadEmployeePreview = async () => {
    try {
      const response = await mockApiService.getAllEmployees({
        department: config.department,
        status: config.includeInactive ? "" : "Active",
      });
      setEmployeePreview(response.data.employees || []);
    } catch (error) {
      console.error("Failed to load employee preview:", error);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!config.month || !config.year) {
      alert("Please select month and year");
      return;
    }

    setGenerating(true);
    setGenerationProgress({
      stage: "initializing",
      current: 0,
      total: employeePreview.length || 10,
      message: "Initializing payroll generation...",
    });

    try {
      setGenerationProgress({
        stage: "validating",
        current: 0,
        total: employeePreview.length || 10,
        message: "Validating employee data...",
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setGenerationProgress({
        stage: "fetching",
        current: 0,
        total: employeePreview.length || 10,
        message: "Fetching attendance records...",
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setGenerationProgress({
        stage: "calculating",
        current: 0,
        total: employeePreview.length || 10,
        message: "Calculating salaries...",
      });

      const response = await mockApiService.generatePayroll({
        month: config.month,
        year: config.year,
        department: config.department,
        includeInactive: config.includeInactive,
      });

      setGenerationProgress({
        stage: "completed",
        current: employeePreview.length || 10,
        total: employeePreview.length || 10,
        message: "Payroll generated successfully!",
      });

      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(null);
        setShowPreview(false);
        if (showNotification) {
          showNotification(
            `Payroll generated successfully for ${response.data.summary.processed} employees!`,
            "success"
          );
        }
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (error) {
      setGenerationProgress({
        stage: "error",
        message: error.message || "Failed to generate payroll",
      });
      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(null);
      }, 3000);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case "initializing":
        return <Clock className="h-6 w-6 text-blue-600 animate-pulse" />;
      case "validating":
        return (
          <CheckCircle className="h-6 w-6 text-yellow-600 animate-pulse" />
        );
      case "fetching":
        return <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />;
      case "calculating":
        return <DollarSign className="h-6 w-6 text-green-600 animate-pulse" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "error":
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Clock className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-indigo-600" />
          Payroll Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Month */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Month *
            </label>
            <select
              value={config.month}
              onChange={(e) =>
                setConfig({ ...config, month: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Year *
            </label>
            <select
              value={config.year}
              onChange={(e) =>
                setConfig({ ...config, year: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {[2025, 2024, 2023, 2022].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="h-4 w-4 inline mr-1" />
              Department
            </label>
            <select
              value={config.department}
              onChange={(e) =>
                setConfig({ ...config, department: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Options */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeInactive}
              onChange={(e) =>
                setConfig({ ...config, includeInactive: e.target.checked })
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              Include Inactive Employees
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.sendNotifications}
              onChange={(e) =>
                setConfig({
                  ...config,
                  sendNotifications: e.target.checked,
                })
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              Send Email Notifications
            </span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.processOvertime}
              onChange={(e) =>
                setConfig({ ...config, processOvertime: e.target.checked })
              }
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Process Overtime</span>
          </label>
        </div>

        {/* Actions */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => {
              loadEmployeePreview();
              setShowPreview(true);
            }}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Employees
          </button>
          <button
            onClick={handleGeneratePayroll}
            disabled={generating}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Generate Payroll"}
          </button>
        </div>
      </div>

      {/* Employee Preview */}
      {showPreview && employeePreview.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Users className="h-5 w-5 mr-2 text-indigo-600" />
              Employee Preview ({employeePreview.length} employees)
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Designation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Basic Salary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employeePreview.map((emp) => (
                  <tr key={emp._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {emp.employeeId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {emp.designation?.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {emp.department?.name}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(emp.salaryStructure?.basic || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          emp.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generation Progress Modal */}
      {generating && generationProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {getStageIcon(generationProgress.stage)}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {generationProgress.stage === "completed"
                  ? "Completed!"
                  : "Generating Payroll..."}
              </h3>
              <p className="text-gray-600 mb-6">{generationProgress.message}</p>

              {generationProgress.stage !== "completed" &&
                generationProgress.stage !== "error" && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (generationProgress.current /
                            generationProgress.total) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                )}

              {generationProgress.stage === "completed" && (
                <div className="text-green-600 font-medium">
                  Payroll generated successfully!
                </div>
              )}

              {generationProgress.stage === "error" && (
                <div className="text-red-600 font-medium">
                  {generationProgress.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Demo Page Component
const PayrollPageDemo = () => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const user = { role: "hr" }; // Mock user with HR role

  const showNotification = (message, type) => {
    alert(`${type.toUpperCase()}: ${message}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Payroll Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and process employee payroll
              </p>
            </div>
            {(user?.role === "hr" || user?.role === "admin") && (
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 shadow-sm"
              >
                <DollarSign className="h-5 w-5" />
                <span>Generate Payroll</span>
              </button>
            )}
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Payrolls</h2>
          <p className="text-gray-600">
            Click "Generate Payroll" button above to open the payroll generation modal.
          </p>
        </div>

        {/* Generate Payroll Modal */}
        {showGenerateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Generate Payroll
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Generate monthly payroll for employees
                  </p>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div
                className="overflow-y-auto p-6"
                style={{ maxHeight: "calc(90vh - 100px)" }}
              >
                <PayrollGenerationSystem
                  onClose={() => {
                    setShowGenerateModal(false);
                  }}
                  showNotification={showNotification}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollPageDemo;