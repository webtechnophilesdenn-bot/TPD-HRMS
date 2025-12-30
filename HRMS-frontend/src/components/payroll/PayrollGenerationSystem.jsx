// src/components/payroll/PayrollGenerationSystem.jsx - COMPLETE ENHANCED VERSION
import React, { useState, useEffect } from 'react';
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
  Shield
} from 'lucide-react';
import payrollAPI from '../../services/payrollAPI';
import { apiService } from '../../services/apiService';

const PayrollGenerationSystem = ({ onClose }) => {
  const [activeView, setActiveView] = useState('generate');
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [config, setConfig] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: '',
    includeInactive: false,
    sendNotifications: true,
    processOvertime: true
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
  const [checkingStructures, setCheckingStructures] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadDepartments();
    if (activeView === 'history') {
      loadPayrollHistory();
    }
  }, [activeView]);

  const loadDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response.data?.departments || response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  // Check and create missing salary structures
  const checkAndCreateSalaryStructures = async () => {
    try {
      setCheckingStructures(true);
      
      // Step 1: Check for missing salary structures
      const checkResponse = await payrollAPI.checkMissingSalaryStructures();
      
      if (checkResponse.data.count > 0) {
        const confirm = window.confirm(
          `${checkResponse.data.count} employees don't have salary structures.\n\n` +
          `Do you want to create salary structures for them?\n\n` +
          `Note: Structures will be created using designation-based defaults or employee CTC.`
        );

        if (confirm) {
          // Step 2: Create missing salary structures
          const createResponse = await payrollAPI.createMissingSalaryStructures({
            effectiveFrom: new Date(),
            useDesignationDefaults: true
          });

          const summary = createResponse.data.summary;
          
          alert(
            `Salary Structures Created!\n\n` +
            `✓ Created: ${summary.created}\n` +
            `✗ Failed: ${summary.failed}\n\n` +
            (summary.failed > 0 
              ? `Check console for failed employees.`
              : `You can now generate payroll.`)
          );

          if (createResponse.data.failed?.length > 0) {
            console.log('Failed employees:', createResponse.data.failed);
          }

          // Reload preview after creating structures
          await loadEmployeePreview();
        }
      } else {
        alert('✓ All employees have salary structures. You can proceed with payroll generation.');
      }
    } catch (error) {
      console.error('Error checking salary structures:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setCheckingStructures(false);
    }
  };

  const loadEmployeePreview = async () => {
    setLoadingPreview(true);
    try {
      // Get generation summary first
      const summaryResponse = await payrollAPI.getPayrollGenerationSummary({
        month: config.month,
        year: config.year,
        department: config.department
      });

      setGenerationSummary(summaryResponse.data);

      if (summaryResponse.data.existingPayrolls > 0) {
        setShowWarning(true);
      }

      // Get eligible employees
      const response = await payrollAPI.getEligibleEmployees({
        month: config.month,
        year: config.year,
        department: config.department,
        includeInactive: config.includeInactive
      });

      setEmployeePreview(response.data?.employees || []);
      setPreviewSummary(response.data?.summary || null);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to load employee preview:', error);
      alert(error.message || 'Failed to load employee preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadPayrollHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await payrollAPI.getAllPayrolls({
        month: config.month,
        year: config.year,
        department: config.department,
        limit: 100
      });
      setPayrollHistory(response.data?.payrolls || response.data?.data || []);
    } catch (error) {
      console.error('Failed to load payroll history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setGenerating(true);
      setGenerationProgress({
        stage: 'initializing',
        current: 0,
        total: employeePreview.length,
        message: 'Initializing payroll generation...',
        errors: []
      });

      // STEP 1: Validate eligibility
      setGenerationProgress(prev => ({
        ...prev,
        stage: 'validating',
        message: 'Validating employee eligibility...'
      }));

      const validationResponse = await payrollAPI.validatePayrollEligibility({
        month: config.month,
        year: config.year,
        department: config.department,
        includeInactive: config.includeInactive
      });

      if (validationResponse.data.summary.ineligible > 0) {
        const ineligibleDetails = validationResponse.data.ineligible
          .map(emp => `• ${emp.name} (${emp.employeeId}): ${emp.issues.join(', ')}`)
          .join('\n');

        const proceed = window.confirm(
          `⚠ WARNING: ${validationResponse.data.summary.ineligible} employees are ineligible\n\n` +
          `Issues found:\n${ineligibleDetails}\n\n` +
          `Continue and generate payroll only for ${validationResponse.data.summary.eligible} eligible employees?`
        );

        if (!proceed) {
          setGenerating(false);
          setGenerationProgress(null);
          return;
        }
      }

      // STEP 2: Fetch data simulation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationProgress(prev => ({
        ...prev,
        stage: 'fetching',
        message: 'Fetching attendance, leave, and loan records...'
      }));

      await new Promise(resolve => setTimeout(resolve, 1500));

      // STEP 3: Generate payroll
      setGenerationProgress(prev => ({
        ...prev,
        stage: 'calculating',
        message: 'Calculating salaries and generating payslips...'
      }));

      const response = await payrollAPI.generatePayroll({
        month: config.month,
        year: config.year,
        department: config.department,
        includeInactive: config.includeInactive,
        sendNotifications: config.sendNotifications,
        processOvertime: config.processOvertime
      });

      // STEP 4: Handle response
      const errorMessages = Array.isArray(response.data.errors)
        ? response.data.errors.map(err => {
            if (typeof err === 'object' && err !== null) {
              return `${err.name || err.employeeId}: ${err.error}`;
            }
            return String(err);
          })
        : [];

      setGenerationProgress({
        stage: 'completed',
        current: response.data.summary?.success || 0,
        total: response.data.summary?.total || employeePreview.length,
        message: 'Payroll generated successfully!',
        errors: errorMessages,
        summary: response.data.summary
      });

      // STEP 5: Show success and close
      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(null);
        setShowPreview(false);
        setShowWarning(false);
        
        const successMsg = 
          `✓ Payroll Generated Successfully!\n\n` +
          `✓ Generated: ${response.data.summary?.success || 0} payslips\n` +
          `✗ Failed: ${response.data.summary?.failed || 0}\n` +
          `💰 Total Payout: ${formatCurrency(response.data.summary?.totalNetPaid || 0)}` +
          (errorMessages.length > 0 ? `\n\n⚠ ${errorMessages.length} errors occurred. Check console.` : '');
        
        alert(successMsg);
        
        if (errorMessages.length > 0) {
          console.log('Generation errors:', errorMessages);
        }
        
        if (onClose) onClose();
      }, 3000);

    } catch (error) {
      console.error('Error generating payroll:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate payroll';
      
      setGenerationProgress({
        stage: 'error',
        message: errorMessage,
        errors: [errorMessage]
      });

      alert(`❌ Error: ${errorMessage}`);
      
      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(null);
      }, 3000);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'initializing':
        return <Settings className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'validating':
        return <Shield className="w-6 h-6 text-yellow-600 animate-pulse" />;
      case 'fetching':
        return <Download className="w-6 h-6 text-indigo-600 animate-bounce" />;
      case 'calculating':
        return <DollarSign className="w-6 h-6 text-green-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payroll Generation System</h2>
              <p className="text-gray-600 mt-1">Generate monthly salary for employees</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveView('generate')}
              className={`px-4 py-2 font-medium transition ${
                activeView === 'generate'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PlayCircle className="w-4 h-4 inline mr-2" />
              Generate Payroll
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-4 py-2 font-medium transition ${
                activeView === 'history'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              History
            </button>
          </div>

          {/* Generate View */}
          {activeView === 'generate' && (
            <div className="space-y-6">
              {/* Configuration */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Settings className="w-5 h-5 inline mr-2" />
                  Payroll Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={config.month}
                      onChange={(e) => setConfig({ ...config, month: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {months.map((month, index) => (
                        <option key={index} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={config.year}
                      onChange={(e) => setConfig({ ...config, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {[...Array(3)].map((_, i) => {
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={config.department}
                      onChange={(e) => setConfig({ ...config, department: e.target.value })}
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
                </div>

                {/* Options */}
                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.includeInactive}
                      onChange={(e) => setConfig({ ...config, includeInactive: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Include inactive employees</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.sendNotifications}
                      onChange={(e) => setConfig({ ...config, sendNotifications: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Send payslip notifications</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config.processOvertime}
                      onChange={(e) => setConfig({ ...config, processOvertime: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Process overtime payments</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={loadEmployeePreview}
                    disabled={loadingPreview}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingPreview ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading Preview...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Preview Employees
                      </>
                    )}
                  </button>
                  <button
                    onClick={checkAndCreateSalaryStructures}
                    disabled={checkingStructures}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {checkingStructures ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4" />
                        Check Structures
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Warning Message */}
              {showWarning && generationSummary && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-900">Warning</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        {generationSummary.message}
                      </p>
                      {generationSummary.existingEmployees && generationSummary.existingEmployees.length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm text-yellow-700 cursor-pointer hover:underline">
                            View existing payrolls ({generationSummary.existingEmployees.length})
                          </summary>
                          <ul className="mt-2 space-y-1 text-sm text-yellow-600">
                            {generationSummary.existingEmployees.map((emp, idx) => (
                              <li key={idx}>• {emp}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Employee Preview */}
              {showPreview && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <Users className="w-5 h-5 inline mr-2" />
                        Employee Preview
                      </h3>
                      <span className="text-sm text-gray-600">
                        {employeePreview.length} employees • Estimated Payout: {formatCurrency(previewSummary?.totalEstimatedNet || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Summary Cards */}
                  {previewSummary && (
                    <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">Total Employees</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{previewSummary.totalEmployees}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">Estimated Gross</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(previewSummary.totalEstimatedGross)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600">Estimated Net Payout</p>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(previewSummary.totalEstimatedNet)}</p>
                      </div>
                    </div>
                  )}

                  {/* Employee Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Gross</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Est. Net</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employeePreview.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                              No employees found
                            </td>
                          </tr>
                        ) : (
                          employeePreview.map((emp) => (
                            <tr key={emp._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {emp.firstName} {emp.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{emp.employeeId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {emp.designation?.title || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {emp.department?.name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {formatCurrency(emp.basicSalary)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                {formatCurrency(emp.estimatedGross)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-indigo-600">
                                {formatCurrency(emp.estimatedNet)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {emp.hasSalaryStructure ? (
                                  <span className="flex items-center text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Ready
                                  </span>
                                ) : (
                                  <span className="flex items-center text-red-600 text-sm">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    No Structure
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Generate Button */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={handleGeneratePayroll}
                      disabled={generating || employeePreview.length === 0}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                    >
                      <PlayCircle className="w-5 h-5" />
                      Generate Payroll for {employeePreview.length} Employees
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History View */}
          {activeView === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  <Clock className="w-5 h-5 inline mr-2" />
                  Payroll History
                </h3>
                <p className="text-sm text-gray-600">
                  View previously generated payrolls
                </p>
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="ml-3 text-gray-600">Loading payroll history...</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payrollHistory.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                              No payroll records found
                            </td>
                          </tr>
                        ) : (
                          payrollHistory.map((payroll) => (
                            <tr key={payroll._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {months[payroll.month - 1]} {payroll.year}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {payroll.employee?.firstName} {payroll.employee?.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{payroll.employee?.employeeId}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {formatCurrency(payroll.summary?.grossEarnings)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                                {formatCurrency(payroll.summary?.totalDeductions)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                                {formatCurrency(payroll.summary?.netSalary)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  payroll.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                  payroll.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {payroll.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-indigo-600 hover:text-indigo-900">
                                  <Eye className="w-4 h-4" />
                                </button>
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
        </div>
      </div>

      {/* Generation Progress Modal */}
      {generating && generationProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 p-8">
            <div className="text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                {getStageIcon(generationProgress.stage)}
              </div>

              {/* Title & Message */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {generationProgress.stage === 'completed' ? 'Payroll Generated!' :
                 generationProgress.stage === 'error' ? 'Generation Failed' :
                 'Generating Payroll...'}
              </h3>
              <p className="text-gray-600 mb-6">{generationProgress.message}</p>

              {/* Progress Bar */}
              {generationProgress.stage !== 'completed' && generationProgress.stage !== 'error' && (
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(generationProgress.current / generationProgress.total) * 100}%`
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Processing {generationProgress.current} of {generationProgress.total} employees
                  </p>
                </div>
              )}

              {/* Summary Cards (on completion) */}
              {generationProgress.stage === 'completed' && generationProgress.summary && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Processed</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                      {generationProgress.summary.success}
                    </p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <p className="text-sm text-indigo-600 font-medium">Total Payout</p>
                    <p className="text-lg font-bold text-indigo-700 mt-1">
                      {formatCurrency(generationProgress.summary.totalNetPaid)}
                    </p>
                  </div>
                </div>
              )}

              {/* Errors */}
              {generationProgress.errors && generationProgress.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto text-left">
                  <p className="text-sm font-medium text-red-900 mb-2">
                    Errors: {generationProgress.errors.length}
                  </p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {generationProgress.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success Message */}
              {generationProgress.stage === 'completed' && (
                <p className="text-green-600 font-medium">{generationProgress.message}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollGenerationSystem;
