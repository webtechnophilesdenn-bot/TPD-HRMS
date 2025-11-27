import React, { useState, useEffect } from "react";
import {
  Download,
  Calendar,
  DollarSign,
  Users,
  Building,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Settings,
  RefreshCw,
  PlayCircle,
  Clock,
  X,
  AlertTriangle,
} from "lucide-react";
import { apiService } from "../../services/apiService";
import { useNotification } from "../../hooks/useNotification";

const PayrollGenerationSystem = ({ onClose }) => {
  const { showSuccess, showError } = useNotification();
  const [activeView, setActiveView] = useState("generate");
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  
  const [config, setConfig] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: "",
    includeInactive: false,
    sendNotifications: true,
    processOvertime: true,
  });

  const [departments, setDepartments] = useState([]);
  const [employeePreview, setEmployeePreview] = useState([]);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [generationSummary, setGenerationSummary] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    loadDepartments();
    if (activeView === "history") {
      loadPayrollHistory();
    }
  }, [activeView]);

  const loadDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response.data?.departments || []);
    } catch (error) {
      showError("Failed to load departments");
    }
  };

  const loadEmployeePreview = async () => {
    setLoadingPreview(true);
    try {
      // Check generation summary first
      const summaryResponse = await apiService.getPayrollGenerationSummary({
        month: config.month,
        year: config.year,
        department: config.department,
      });
      
      setGenerationSummary(summaryResponse.data);
      
      if (summaryResponse.data.existingPayrolls > 0) {
        setShowWarning(true);
      }

      // Load eligible employees
      const response = await apiService.getEligibleEmployees({
        department: config.department,
        includeInactive: config.includeInactive,
      });
      
      setEmployeePreview(response.data?.employees || []);
      setPreviewSummary(response.data?.summary || null);
      setShowPreview(true);
    } catch (error) {
      showError(error.message || "Failed to load employee preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadPayrollHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await apiService.getAllPayrolls({
        month: config.month,
        year: config.year,
        department: config.department,
      });
      setPayrollHistory(response.data?.payrolls || []);
    } catch (error) {
      showError("Failed to load payroll history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    if (!config.month || !config.year) {
      showError("Please select month and year");
      return;
    }

    if (employeePreview.length === 0) {
      showError("No employees found for payroll generation");
      return;
    }

    if (showWarning && !window.confirm("Payroll already exists for some employees. Do you want to continue?")) {
      return;
    }

    setGenerating(true);
    setGenerationProgress({
      stage: "initializing",
      current: 0,
      total: employeePreview.length,
      message: "Initializing payroll generation...",
      errors: [],
    });

    try {
      // Stage 1: Validating
      setGenerationProgress(prev => ({ 
        ...prev, 
        stage: "validating", 
        message: "Validating employee data..." 
      }));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stage 2: Fetching attendance
      setGenerationProgress(prev => ({ 
        ...prev, 
        stage: "fetching", 
        message: "Fetching attendance records..." 
      }));
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Stage 3: Generating payroll (actual API call)
      setGenerationProgress(prev => ({ 
        ...prev, 
        stage: "calculating", 
        message: "Calculating salaries and generating payroll..." 
      }));

      const response = await apiService.generatePayroll({
        month: config.month,
        year: config.year,
        department: config.department,
        includeInactive: config.includeInactive,
      });

      // Stage 4: Completed
      setGenerationProgress({ 
        stage: "completed", 
        current: response.data.summary.processed, 
        total: response.data.summary.totalEmployees, 
        message: "Payroll generated successfully!",
        errors: response.data.errors || [],
        summary: response.data.summary,
      });
      
      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(null);
        setShowPreview(false);
        setShowWarning(false);
        showSuccess(`Payroll generated for ${response.data.summary.processed} employees!`);
        if (onClose) onClose();
      }, 3000);
    } catch (error) {
      setGenerationProgress({ 
        stage: "error", 
        message: error.message || "Failed to generate payroll",
        errors: [error.message],
      });
      showError(error.message || "Failed to generate payroll");
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
        return <Clock className="h-8 w-8 text-blue-600 animate-pulse" />;
      case "validating":
        return <CheckCircle className="h-8 w-8 text-yellow-600 animate-pulse" />;
      case "fetching":
        return <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />;
      case "calculating":
        return <DollarSign className="h-8 w-8 text-green-600 animate-pulse" />;
      case "completed":
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case "error":
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return <Clock className="h-8 w-8 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveView("generate")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeView === "generate"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <PlayCircle className="h-4 w-4 inline mr-2" />
          Generate
        </button>
        <button
          onClick={() => setActiveView("history")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeView === "history"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          History
        </button>
      </div>

      {/* Generate View */}
      {activeView === "generate" && (
        <div className="space-y-6">
          {/* Configuration Card */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-indigo-600" />
              Payroll Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Month */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month *
                </label>
                <select
                  value={config.month}
                  onChange={(e) => setConfig({ ...config, month: parseInt(e.target.value) })}
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
                  Year *
                </label>
                <select
                  value={config.year}
                  onChange={(e) => setConfig({ ...config, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {[2024, 2023, 2022].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={config.department}
                  onChange={(e) => setConfig({ ...config, department: e.target.value })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300">
                <input
                  type="checkbox"
                  checked={config.includeInactive}
                  onChange={(e) => setConfig({ ...config, includeInactive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Include Inactive Employees</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300">
                <input
                  type="checkbox"
                  checked={config.sendNotifications}
                  onChange={(e) => setConfig({ ...config, sendNotifications: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Send Email Notifications</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300">
                <input
                  type="checkbox"
                  checked={config.processOvertime}
                  onChange={(e) => setConfig({ ...config, processOvertime: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Process Overtime</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={loadEmployeePreview}
                disabled={loadingPreview}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center disabled:opacity-50"
              >
                {loadingPreview ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Preview Employees
              </button>
              <button
                onClick={handleGeneratePayroll}
                disabled={generating || employeePreview.length === 0}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Generate Payroll
              </button>
            </div>
          </div>

          {/* Warning Message */}
          {showWarning && generationSummary && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900 mb-1">Warning</h4>
                <p className="text-sm text-yellow-800">{generationSummary.message}</p>
                {generationSummary.existingEmployees && generationSummary.existingEmployees.length > 0 && (
                  <div className="mt-2 text-sm text-yellow-700">
                    <strong>Existing payrolls for:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {generationSummary.existingEmployees.slice(0, 5).map((emp, idx) => (
                        <li key={idx}>{emp.name} ({emp.employeeId}) - {emp.status}</li>
                      ))}
                      {generationSummary.existingEmployees.length > 5 && (
                        <li>...and {generationSummary.existingEmployees.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowWarning(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Employee Preview */}
          {showPreview && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                    Employee Preview
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {employeePreview.length} employees • Estimated Payout: {formatCurrency(previewSummary?.totalEstimatedPayout)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setShowWarning(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Summary Cards */}
              {previewSummary && (
                <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Total Employees</p>
                    <p className="text-xl font-bold text-gray-900">{previewSummary.totalEmployees}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Estimated Gross</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(previewSummary.totalEstimatedGross)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Estimated Net Payout</p>
                    <p className="text-xl font-bold text-indigo-600">{formatCurrency(previewSummary.totalEstimatedPayout)}</p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Gross</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Net</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employeePreview.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      employeePreview.map((emp) => (
                        <tr key={emp._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{emp.employeeId}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{emp.designation?.title || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{emp.department?.name || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">
                            {formatCurrency(emp.basicSalary)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                            {formatCurrency(emp.estimatedGross)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-indigo-600">
                            {formatCurrency(emp.estimatedNet)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              emp.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History View */}
      {activeView === "history" && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Payroll History</h3>
            <p className="text-sm text-gray-600 mt-1">View previously generated payrolls</p>
          </div>

          {historyLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading payroll history...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payrollHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No payroll records found
                      </td>
                    </tr>
                  ) : (
                    payrollHistory.map((payroll) => (
                      <tr key={payroll._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {months[payroll.month - 1]} {payroll.year}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {payroll.employee?.firstName} {payroll.employee?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{payroll.employee?.employeeId}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(payroll.summary?.grossEarnings)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">
                          {formatCurrency(payroll.summary?.totalDeductions)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {formatCurrency(payroll.summary?.netSalary)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            payroll.status === "Paid" ? "bg-green-100 text-green-800" :
                            payroll.status === "Generated" ? "bg-blue-100 text-blue-800" :
                            payroll.status === "Approved" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {payroll.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => apiService.downloadPayslip(payroll._id)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Generation Progress Modal */}
      {generating && generationProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                {getStageIcon(generationProgress.stage)}
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {generationProgress.stage === "completed" ? "Completed!" : 
                 generationProgress.stage === "error" ? "Error" : 
                 "Generating Payroll..."}
              </h3>
              <p className="text-gray-600 mb-6">{generationProgress.message}</p>
              
              {generationProgress.stage !== "completed" && generationProgress.stage !== "error" && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(generationProgress.current / generationProgress.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Processing {generationProgress.current} of {generationProgress.total} employees
                  </p>
                </>
              )}
              
              {generationProgress.stage === "completed" && generationProgress.summary && (
                <div className="mt-6 bg-green-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-600">Processed</p>
                      <p className="text-lg font-bold text-green-700">{generationProgress.summary.processed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Payout</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(generationProgress.summary.totalPayout)}</p>
                    </div>
                  </div>
                  {generationProgress.errors.length > 0 && (
                    <div className="mt-3 text-left">
                      <p className="text-sm font-medium text-red-600">Errors ({generationProgress.errors.length}):</p>
                      <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                        {generationProgress.errors.slice(0, 3).map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {generationProgress.stage === "error" && (
                <div className="mt-4 bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-red-800">{generationProgress.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollGenerationSystem;