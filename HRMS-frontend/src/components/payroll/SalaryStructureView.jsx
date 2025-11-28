import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Info, FileText, Calendar } from 'lucide-react';
import PAYROLL_API from '../../services/payrollAPI';

const SalaryStructureView = () => {
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalaryStructure();
  }, []);

  const fetchSalaryStructure = async () => {
    try {
      setLoading(true);
      const response = await PAYROLL_API.getMySalaryStructure();
      setSalaryStructure(response.data);
    } catch (error) {
      console.error('Error fetching salary structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading salary structure...</p>
        </div>
      </div>
    );
  }

  if (!salaryStructure) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No salary structure found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Salary Structure</h1>
          <p className="text-gray-600 mt-1">Comprehensive breakdown of your CTC and monthly salary</p>
        </div>

        {/* Employee Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Employee Name</p>
              <p className="text-lg font-semibold text-gray-900">{salaryStructure.employee.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Employee ID</p>
              <p className="text-lg font-semibold text-gray-900">{salaryStructure.employee.employeeId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-lg font-semibold text-gray-900">{salaryStructure.employee.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Designation</p>
              <p className="text-lg font-semibold text-gray-900">{salaryStructure.employee.designation}</p>
            </div>
          </div>
        </div>

        {/* CTC Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Annual CTC</p>
                <p className="text-2xl font-bold">{formatCurrency(salaryStructure.summary.annualCTC)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Monthly Gross</p>
                <p className="text-2xl font-bold">{formatCurrency(salaryStructure.summary.grossSalary)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Total Deductions</p>
                <p className="text-2xl font-bold">{formatCurrency(salaryStructure.summary.totalDeductions)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Monthly Net</p>
                <p className="text-2xl font-bold">{formatCurrency(salaryStructure.summary.netSalary)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Earnings Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Earnings Breakdown</h2>
            <p className="text-sm text-gray-600">Monthly earning components</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-gray-700 font-medium">Basic Salary</p>
                  <p className="text-xs text-gray-500">Core salary component</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(salaryStructure.earnings.basic)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-gray-700 font-medium">House Rent Allowance (HRA)</p>
                  <p className="text-xs text-gray-500">{salaryStructure.earnings.hraPercentage || 40}% of Basic</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(salaryStructure.earnings.hra)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-gray-700 font-medium">Special Allowance</p>
                  <p className="text-xs text-gray-500">Additional allowance</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(salaryStructure.earnings.specialAllowance)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-gray-700 font-medium">Conveyance Allowance</p>
                  <p className="text-xs text-gray-500">Travel allowance</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(salaryStructure.earnings.conveyance)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-gray-700 font-medium">Medical Allowance</p>
                  <p className="text-xs text-gray-500">Healthcare allowance</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(salaryStructure.earnings.medicalAllowance)}
                </span>
              </div>

              {salaryStructure.earnings.educationAllowance > 0 && (
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-gray-700 font-medium">Education Allowance</p>
                    <p className="text-xs text-gray-500">Child education benefit</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(salaryStructure.earnings.educationAllowance)}
                  </span>
                </div>
              )}

              {salaryStructure.earnings.lta > 0 && (
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-gray-700 font-medium">Leave Travel Allowance (LTA)</p>
                    <p className="text-xs text-gray-500">Travel reimbursement</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(salaryStructure.earnings.lta)}
                  </span>
                </div>
              )}

              {salaryStructure.earnings.otherAllowances > 0 && (
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-gray-700 font-medium">Other Allowances</p>
                    <p className="text-xs text-gray-500">Miscellaneous</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(salaryStructure.earnings.otherAllowances)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-green-100 rounded-lg flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Monthly Gross</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(salaryStructure.summary.grossSalary)}
              </span>
            </div>
          </div>
        </div>

        {/* Deductions Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Deductions Breakdown</h2>
            <p className="text-sm text-gray-600">Monthly deduction components</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PF */}
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-gray-700 font-medium">Provident Fund (Employee)</p>
                    <p className="text-xs text-gray-500">12% of Basic (max ₹15,000)</p>
                    {salaryStructure.deductions.pf.uanNumber && (
                      <p className="text-xs text-gray-500 mt-1">UAN: {salaryStructure.deductions.pf.uanNumber}</p>
                    )}
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(salaryStructure.deductions.pf.employeeContribution)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-200">
                  <p className="text-xs text-gray-600">Employer Contribution</p>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatCurrency(salaryStructure.deductions.pf.employerContribution)}
                  </span>
                </div>
              </div>

              {/* ESI */}
              {salaryStructure.deductions.esi.employeeContribution > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-gray-700 font-medium">ESI (Employee)</p>
                      <p className="text-xs text-gray-500">0.75% of Gross</p>
                      {salaryStructure.deductions.esi.esiNumber && (
                        <p className="text-xs text-gray-500 mt-1">ESI No: {salaryStructure.deductions.esi.esiNumber}</p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(salaryStructure.deductions.esi.employeeContribution)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-red-200">
                    <p className="text-xs text-gray-600">Employer Contribution</p>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(salaryStructure.deductions.esi.employerContribution)}
                    </span>
                  </div>
                </div>
              )}

              {/* Professional Tax */}
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-gray-700 font-medium">Professional Tax</p>
                  <p className="text-xs text-gray-500">State tax</p>
                </div>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(salaryStructure.deductions.professionalTax)}
                </span>
              </div>

              {/* TDS */}
              {salaryStructure.deductions.tds > 0 && (
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-gray-700 font-medium">Tax Deducted at Source (TDS)</p>
                    <p className="text-xs text-gray-500">Income tax</p>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(salaryStructure.deductions.tds)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-red-100 rounded-lg flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Total Monthly Deductions</span>
              <span className="text-2xl font-bold text-red-600">
                {formatCurrency(salaryStructure.summary.totalDeductions)}
              </span>
            </div>
          </div>
        </div>

        {/* Net Salary */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-8 mb-6">
          <div className="flex justify-between items-center text-white">
            <div>
              <p className="text-blue-100 mb-2">Monthly Take Home Salary</p>
              <p className="text-sm text-blue-100">Gross Earnings - Total Deductions</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{formatCurrency(salaryStructure.summary.netSalary)}</p>
              <p className="text-sm text-blue-100 mt-1">Per Month</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
            <p className="text-sm text-gray-600">Salary credited to your bank account</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Bank Name</p>
                <p className="text-lg font-semibold text-gray-900">{salaryStructure.payment.bankName}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Account Number</p>
                <p className="text-lg font-semibold text-gray-900">{salaryStructure.payment.accountNumber}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">IFSC Code</p>
                <p className="text-lg font-semibold text-gray-900">{salaryStructure.payment.ifscCode}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Payment Mode</p>
                <p className="text-lg font-semibold text-gray-900">{salaryStructure.payment.mode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Note:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>The actual monthly salary may vary based on attendance and leaves taken</li>
              <li>Additional components like overtime, bonuses, and incentives will be added as applicable</li>
              <li>Employer contributions (PF, ESI) are not deducted from your salary but added to CTC</li>
              <li>For tax declaration and investment proofs, please contact HR department</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryStructureView;
