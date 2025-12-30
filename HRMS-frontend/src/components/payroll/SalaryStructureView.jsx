// src/components/payroll/SalaryStructureView.jsx - COMPLETE ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Filter,
  X,
  CheckCircle,
  AlertCircle,
  Download,
  Settings,
  Building2,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react';
import payrollAPI from '../../services/payrollAPI';
import { apiService } from '../../services/apiService';

const SalaryStructureView = () => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [missingStructures, setMissingStructures] = useState([]);
  const [showMissingAlert, setShowMissingAlert] = useState(false);
  const [creatingStructures, setCreatingStructures] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    designation: '',
    isActive: 'true',
    employee: ''
  });

  useEffect(() => {
    fetchUserContext();
    fetchSalaryStructures();
    fetchDepartments();
    fetchDesignations();
    checkMissingStructures();
  }, [filters]);

  const fetchUserContext = async () => {
    try {
      const response = await apiService.getCurrentUser();
      setUserRole(response.data.role);
    } catch (error) {
      console.error('Error fetching user context:', error);
    }
  };

  const fetchSalaryStructures = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getAllSalaryStructures(filters);
      setStructures(response.data?.salaryStructures || response.data || []);
    } catch (error) {
      console.error('Error fetching salary structures:', error);
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response.data?.departments || response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const response = await apiService.getDesignations();
      setDesignations(response.data?.designations || response.data || []);
    } catch (error) {
      console.error('Error fetching designations:', error);
    }
  };

  const checkMissingStructures = async () => {
    try {
      const response = await payrollAPI.checkMissingSalaryStructures();
      const missing = response.data?.employees || [];
      setMissingStructures(missing);
      if (missing.length > 0) {
        setShowMissingAlert(true);
      }
    } catch (error) {
      console.error('Error checking missing structures:', error);
    }
  };

  const handleCreateMissingStructures = async () => {
    try {
      setCreatingStructures(true);
      const confirm = window.confirm(
        `Create salary structures for ${missingStructures.length} employees?\n\n` +
        `Structures will be created using designation-based defaults.`
      );

      if (!confirm) return;

      const response = await payrollAPI.createMissingSalaryStructures({
        effectiveFrom: new Date(),
        useDesignationDefaults: true
      });

      const summary = response.data.summary;
      
      alert(
        `✓ Salary Structures Created!\n\n` +
        `Created: ${summary.created}\n` +
        `Failed: ${summary.failed}\n\n` +
        (summary.failed > 0 ? 'Check console for details.' : 'All structures created successfully!')
      );

      if (response.data.failed?.length > 0) {
        console.log('Failed employees:', response.data.failed);
      }

      await fetchSalaryStructures();
      await checkMissingStructures();
    } catch (error) {
      console.error('Error creating structures:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setCreatingStructures(false);
    }
  };

  const handleViewDetails = (structure) => {
    setSelectedStructure(structure);
    setShowDetailsModal(true);
  };

  const handleDeactivate = async (structureId) => {
    try {
      const confirm = window.confirm(
        'Are you sure you want to deactivate this salary structure?\n\n' +
        'This will mark the structure as inactive.'
      );

      if (!confirm) return;

      await payrollAPI.deactivateSalaryStructure(structureId, new Date());
      alert('Salary structure deactivated successfully');
      fetchSalaryStructures();
    } catch (error) {
      console.error('Error deactivating structure:', error);
      alert(`Failed to deactivate: ${error.message}`);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const canManageStructures = ['admin', 'hr'].includes(userRole);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Structures</h1>
          <p className="text-gray-600 mt-1">Manage employee salary structures and components</p>
        </div>
        <div className="flex gap-2">
          {canManageStructures && (
            <>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-5 h-5" />
                Create Structure
              </button>
              <button
                onClick={checkMissingStructures}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                <Shield className="w-5 h-5" />
                Check Missing
              </button>
            </>
          )}
          <button
            onClick={fetchSalaryStructures}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Missing Structures Alert */}
      {showMissingAlert && missingStructures.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900">
                {missingStructures.length} employees don't have salary structures
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                These employees won't be included in payroll generation until structures are created.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleCreateMissingStructures}
                  disabled={creatingStructures}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {creatingStructures ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create All Structures
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowMissingAlert(false)}
                  className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Structures</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{structures.length}</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Structures</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {structures.filter(s => s.isActive).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Monthly CTC</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {formatCurrency(
                  structures.length > 0
                    ? structures.reduce((sum, s) => sum + (s.summary?.costToCompany || 0), 0) / structures.length
                    : 0
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Missing Structures</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{missingStructures.length}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <select
              value={filters.designation}
              onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Designations</option>
              {designations.map((des) => (
                <option key={des._id} value={des._id}>
                  {des.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => setFilters({ department: '', designation: '', isActive: 'true', employee: '' })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Structures Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading salary structures...</p>
            </div>
          </div>
        ) : structures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <DollarSign className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No salary structures found</p>
            {canManageStructures && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Create First Structure
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Salary
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly CTC
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
                {structures.map((structure) => (
                  <tr key={structure._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {structure.employee?.firstName} {structure.employee?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{structure.employee?.employeeId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {structure.employee?.department?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {structure.employee?.designation?.title || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      {formatCurrency(structure.summary?.grossSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                      {formatCurrency(structure.summary?.totalDeductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                      {formatCurrency(structure.summary?.netSalary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-indigo-600">
                      {formatCurrency(structure.summary?.costToCompany)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          structure.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {structure.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(structure)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageStructures && structure.isActive && (
                          <button
                            onClick={() => handleDeactivate(structure._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Details Modal */}
      {showDetailsModal && selectedStructure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Salary Structure Details</h2>
                  <p className="text-gray-600 mt-1">
                    {selectedStructure.employee?.firstName} {selectedStructure.employee?.lastName} ({selectedStructure.employee?.employeeId})
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Employee Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Department:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {selectedStructure.employee?.department?.name || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Designation:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {selectedStructure.employee?.designation?.title || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Effective From:</span>
                      <span className="text-sm font-medium text-gray-900 ml-2">
                        {new Date(selectedStructure.effectiveFrom).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm font-medium ml-2 ${selectedStructure.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                        {selectedStructure.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Salary Summary</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Gross Salary:</span>
                      <span className="text-sm font-medium text-green-600 ml-2">
                        {formatCurrency(selectedStructure.summary?.grossSalary)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Total Deductions:</span>
                      <span className="text-sm font-medium text-red-600 ml-2">
                        {formatCurrency(selectedStructure.summary?.totalDeductions)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Net Salary:</span>
                      <span className="text-sm font-medium text-blue-600 ml-2">
                        {formatCurrency(selectedStructure.summary?.netSalary)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Monthly CTC:</span>
                      <span className="text-sm font-medium text-indigo-600 ml-2">
                        {formatCurrency(selectedStructure.summary?.costToCompany)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions */}
              <div className="grid grid-cols-2 gap-6">
                {/* Earnings */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Earnings Breakdown</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Basic Salary</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.earnings?.basic)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">HRA ({selectedStructure.earnings?.hraPercentage}%)</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.earnings?.hra)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Special Allowance</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.earnings?.specialAllowance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Conveyance</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.earnings?.conveyance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Medical Allowance</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.earnings?.medicalAllowance)}</span>
                    </div>
                    {selectedStructure.earnings?.educationAllowance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Education Allowance</span>
                        <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.earnings?.educationAllowance)}</span>
                      </div>
                    )}
                    {selectedStructure.earnings?.lta > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">LTA</span>
                        <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.earnings?.lta)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="font-bold text-gray-900">Total Earnings</span>
                      <span className="font-bold text-green-600">{formatCurrency(selectedStructure.summary?.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Deductions Breakdown</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PF Employee ({selectedStructure.deductions?.pf?.employeePercentage}%)</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.deductions?.pf?.employeeContribution)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">PF Employer ({selectedStructure.deductions?.pf?.employerPercentage}%)</span>
                      <span className="font-medium text-gray-500">{formatCurrency(selectedStructure.deductions?.pf?.employerContribution)}</span>
                    </div>
                    {selectedStructure.deductions?.esi?.applicable && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ESI Employee ({selectedStructure.deductions?.esi?.employeePercentage}%)</span>
                          <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.deductions?.esi?.employeeContribution)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">ESI Employer ({selectedStructure.deductions?.esi?.employerPercentage}%)</span>
                          <span className="font-medium text-gray-500">{formatCurrency(selectedStructure.deductions?.esi?.employerContribution)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Professional Tax</span>
                      <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.deductions?.professionalTax?.amount)}</span>
                    </div>
                    {selectedStructure.deductions?.tds?.applicable && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">TDS ({selectedStructure.deductions?.tds?.regime})</span>
                        <span className="font-medium text-gray-900">{formatCurrency(selectedStructure.deductions?.tds?.monthlyTDS)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                      <span className="font-bold text-gray-900">Total Deductions</span>
                      <span className="font-bold text-red-600">{formatCurrency(selectedStructure.summary?.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Summary */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                  <p className="text-sm text-blue-700 font-medium">Monthly Take Home</p>
                  <p className="text-3xl font-bold text-blue-700 mt-2">
                    {formatCurrency(selectedStructure.summary?.netSalary)}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-6">
                  <p className="text-sm text-indigo-700 font-medium">Annual CTC</p>
                  <p className="text-3xl font-bold text-indigo-700 mt-2">
                    {formatCurrency(selectedStructure.summary?.costToCompany * 12)}
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

export default SalaryStructureView;
