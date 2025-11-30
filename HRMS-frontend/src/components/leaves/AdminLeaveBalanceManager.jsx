import React, { useState, useEffect } from 'react';
import { Plus, Minus, Users, Search, Save } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useNotification } from '../../context/NotificationContext';

const AdminLeaveBalanceManager = () => {
  const { showSuccess, showError } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeLeaveBalance, setEmployeeLeaveBalance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [adjustmentModal, setAdjustmentModal] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    leaveType: '',
    amount: 0,
    operation: 'add',
    reason: ''
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllEmployees({ status: 'Active' });
      
      // ✅ FIX: Handle array response
      const employeesData = Array.isArray(response.data) ? response.data : [];
      setEmployees(employeesData);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load employees:', error);
      showError('Failed to load employees');
      setEmployees([]);
      setLoading(false);
    }
  };

  const loadEmployeeBalance = async (employeeId) => {
    setLoading(true);
    try {
      console.log('🔄 Loading balance for employee:', employeeId);
      const response = await apiService.getEmployeeLeaveBalance(employeeId);
      
      console.log('✅ Balance response:', response);
      console.log('📊 Balance data:', response.data);
      
      setEmployeeLeaveBalance(response.data);
      setSelectedEmployee(response.data.employee);
      setLoading(false);
    } catch (error) {
      console.error('❌ Failed to load leave balance:', error);
      showError('Failed to load leave balance');
      setLoading(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!adjustmentData.reason.trim()) {
      showError('Please provide a reason for adjustment');
      return;
    }

    if (!adjustmentData.amount || adjustmentData.amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    try {
      console.log('🔧 Adjusting balance:', adjustmentData);
      
      await apiService.adjustLeaveBalance(selectedEmployee.id, adjustmentData);
      
      showSuccess(
        `Leave balance ${
          adjustmentData.operation === 'add' ? 'increased' : 'decreased'
        } successfully`
      );
      
      // Close modal
      setAdjustmentModal(false);
      
      // Reset form
      setAdjustmentData({ 
        leaveType: '', 
        amount: 0, 
        operation: 'add', 
        reason: '' 
      });
      
      // ✅ FIX: Reload the employee balance to show updated values
      console.log('🔄 Reloading employee balance...');
      await loadEmployeeBalance(selectedEmployee.id);
      console.log('✅ Balance reloaded');
      
    } catch (error) {
      console.error('❌ Failed to adjust balance:', error);
      showError(error.message || 'Failed to adjust balance');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !selectedEmployee) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-3">Select Employee</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(emp => (
                <div
                  key={emp._id}
                  onClick={() => loadEmployeeBalance(emp._id)}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedEmployee?.id === emp._id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium text-gray-900">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{emp.employeeId}</p>
                  {emp.department && (
                    <p className="text-xs text-gray-400 mt-1">
                      {emp.department?.name || emp.department}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No employees found
              </div>
            )}
          </div>
        </div>

        {/* Leave Balance Details */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : selectedEmployee && employeeLeaveBalance ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedEmployee.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Employee ID: {selectedEmployee.employeeId} • Year: {employeeLeaveBalance.year}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employeeLeaveBalance.balance.map(balance => (
                    <div
                      key={balance.code}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{balance.name}</h3>
                          <p className="text-3xl font-bold text-indigo-600 mt-2">
                            {balance.currentBalance}
                          </p>
                          <p className="text-xs text-gray-500">days remaining</p>
                        </div>
                        <button
                          onClick={() => {
                            setAdjustmentData({
                              ...adjustmentData,
                              leaveType: balance.code
                            });
                            setAdjustmentModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                        >
                          Adjust
                        </button>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Opening Balance:</span>
                            <span className="font-medium text-gray-900">{balance.opening || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Accrued:</span>
                            <span className="font-medium text-gray-900">{balance.accrued || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Used:</span>
                            <span className="font-medium text-red-600">-{balance.used || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Adjusted:</span>
                            <span
                              className={`font-medium ${
                                (balance.adjusted || 0) >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {(balance.adjusted || 0) > 0 ? '+' : ''}
                              {balance.adjusted || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Carry Forward:</span>
                            <span className="font-medium text-gray-900">
                              {balance.carryForward || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                            <span className="font-semibold text-gray-900">
                              Current Balance:
                            </span>
                            <span className="text-lg font-bold text-indigo-600">
                              {balance.currentBalance}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {employeeLeaveBalance.balance.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No leave balance records found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Users className="h-20 w-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Employee Selected
              </h3>
              <p className="text-gray-500">
                Select an employee from the list to view and manage their leave balance
              </p>
            </div>
          )}
        </div>
      </div>

      {adjustmentModal && employeeLeaveBalance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Adjust Leave Balance
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee
                </label>
                <input
                  type="text"
                  value={selectedEmployee?.name || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type
                </label>
                <input
                  type="text"
                  value={
                    employeeLeaveBalance.balance.find(
                      b => b.code === adjustmentData.leaveType
                    )?.name || ''
                  }
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setAdjustmentData({ ...adjustmentData, operation: 'add' })
                    }
                    className={`p-3 border-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                      adjustmentData.operation === 'add'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="font-medium">Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAdjustmentData({
                        ...adjustmentData,
                        operation: 'deduct'
                      })
                    }
                    className={`p-3 border-2 rounded-lg flex items-center justify-center space-x-2 transition-all ${
                      adjustmentData.operation === 'deduct'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Minus className="h-5 w-5" />
                    <span className="font-medium">Deduct</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={adjustmentData.amount}
                  onChange={(e) =>
                    setAdjustmentData({
                      ...adjustmentData,
                      amount: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter number of days"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adjustmentData.reason}
                  onChange={(e) =>
                    setAdjustmentData({
                      ...adjustmentData,
                      reason: e.target.value
                    })
                  }
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Provide a detailed reason for this adjustment..."
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Adjustment Preview
                </p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Current Balance:</span>
                    <span className="font-medium text-blue-900">
                      {employeeLeaveBalance.balance.find(
                        b => b.code === adjustmentData.leaveType
                      )?.currentBalance || 0}{' '}
                      days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Change:</span>
                    <span
                      className={`font-medium ${
                        adjustmentData.operation === 'add'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {adjustmentData.operation === 'add' ? '+' : '-'}
                      {adjustmentData.amount || 0} days
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-blue-200">
                    <span className="font-semibold text-blue-900">
                      New Balance:
                    </span>
                    <span className="font-bold text-blue-900">
                      {adjustmentData.operation === 'add'
                        ? (employeeLeaveBalance.balance.find(
                            b => b.code === adjustmentData.leaveType
                          )?.currentBalance || 0) +
                          (adjustmentData.amount || 0)
                        : (employeeLeaveBalance.balance.find(
                            b => b.code === adjustmentData.leaveType
                          )?.currentBalance || 0) -
                          (adjustmentData.amount || 0)}{' '}
                      days
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAdjustBalance}
                  disabled={
                    !adjustmentData.reason.trim() ||
                    !adjustmentData.amount ||
                    adjustmentData.amount <= 0
                  }
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Adjustment</span>
                </button>
                <button
                  onClick={() => {
                    setAdjustmentModal(false);
                    setAdjustmentData({
                      leaveType: '',
                      amount: 0,
                      operation: 'add',
                      reason: ''
                    });
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveBalanceManager;
