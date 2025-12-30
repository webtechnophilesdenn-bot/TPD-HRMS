// src/pages/PayrollPage.jsx - COMPLETE ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileText,
  Users,
  BarChart3,
  Settings
} from 'lucide-react';
import PayrollDashboard from '../components/payroll/PayrollDashboard';
import EmployeePayslipView from '../components/payroll/EmployeePayslipView';
import SalaryStructureView from '../components/payroll/SalaryStructureView';
import { apiService } from '../services/apiService';

const PayrollPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await apiService.getCurrentUser();
      const role = response.data.role;
      setUserRole(role);
      
      // Set default tab based on role
      if (role === 'employee') {
        setActiveTab('payslips');
      } else {
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'dashboard',
      label: 'Payroll Dashboard',
      icon: BarChart3,
      roles: ['admin', 'hr', 'finance', 'manager'],
      component: PayrollDashboard
    },
    {
      id: 'payslips',
      label: 'My Payslips',
      icon: FileText,
      roles: ['employee', 'manager', 'admin', 'hr'],
      component: EmployeePayslipView
    },
    {
      id: 'structures',
      label: 'Salary Structures',
      icon: DollarSign,
      roles: ['admin', 'hr'],
      component: SalaryStructureView
    }
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(userRole));
  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payroll...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {ActiveComponent ? <ActiveComponent /> : <div>Component not found</div>}
      </div>
    </div>
  );
};

export default PayrollPage;
