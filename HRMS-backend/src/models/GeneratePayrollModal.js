import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, Building, Download } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { apiService } from '../services/apiService';

const GeneratePayrollModal = ({ isOpen, onClose, onPayrollGenerated }) => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    department: '',
    includeInactive: false
  });
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadDepartments();
    }
  }, [isOpen]);

  const loadDepartments = async () => {
    try {
      const response = await apiService.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      // This would call a preview endpoint in a real implementation
      const mockPreview = {
        totalEmployees: 45,
        estimatedPayout: 2450000,
        departments: [
          { name: 'Engineering', employees: 20, payout: 1200000 },
          { name: 'Sales', employees: 15, payout: 750000 },
          { name: 'HR', employees: 5, payout: 250000 },
          { name: 'Marketing', employees: 5, payout: 250000 }
        ]
      };
      setPreviewData(mockPreview);
    } catch (error) {
      showError('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const response = await apiService.generatePayroll(formData);
      showSuccess('Payroll generated successfully!');
      onPayrollGenerated(response.data);
      onClose();
    } catch (error) {
      showError(error.message || 'Failed to generate payroll');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month) => {
    return new Date(2024, month - 1).toLocaleString('default', { month: 'long' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Generate Payroll</h2>
            <p className="text-gray-600">Create payroll for selected period</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Configuration Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Month and Year */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Payroll Period
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {[2024, 2023, 2022].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="h-4 w-4 inline mr-2" />
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    name="includeInactive"
                    checked={formData.includeInactive}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Include Inactive Employees
                    </label>
                    <p className="text-xs text-gray-500">
                      Include employees with inactive status in payroll
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Payment Date
                  </h4>
                  <p className="text-sm text-blue-700">
                    {new Date(formData.year, formData.month, 7).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {previewData && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payroll Preview</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{previewData.totalEmployees}</p>
                  <p className="text-sm text-green-700">Total Employees</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Download className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(previewData.estimatedPayout)}
                  </p>
                  <p className="text-sm text-blue-700">Estimated Payout</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Department Breakdown</h4>
                {previewData.departments.map(dept => (
                  <div key={dept.name} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{dept.name}</p>
                      <p className="text-sm text-gray-500">{dept.employees} employees</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(dept.payout)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <button
                onClick={handlePreview}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Preview Payroll
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !previewData}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Generate Payroll</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePayrollModal;