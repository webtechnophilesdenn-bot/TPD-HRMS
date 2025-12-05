import React from 'react';
import { Users, Calendar, RefreshCw } from 'lucide-react';

const EmployeesOnLeaveToday = ({ employees, loading, onRefresh }) => {
  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Employees On Leave Today</h2>
            <p className="text-purple-100">{today}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{employees.length}</div>
            <div className="text-purple-100">employee{employees.length !== 1 ? 's' : ''} on leave</div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Employee Cards */}
      {employees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(leave => (
            <div key={leave._id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-start gap-4">
                {leave.employee?.profilePicture ? (
                  <img
                    src={leave.employee.profilePicture}
                    alt={`${leave.employee.firstName} ${leave.employee.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-lg font-semibold text-purple-600">
                      {leave.employee?.firstName?.charAt(0)}{leave.employee?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {leave.employee?.firstName} {leave.employee?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{leave.employee?.employeeId}</p>
                  <p className="text-sm text-gray-600 mt-1">{leave.employee?.designation}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Leave Type:</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {leave.leaveType}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Days:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                  </span>
                </div>

                {leave.reason && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">Reason:</p>
                    <p className="text-sm text-gray-900 mt-1">{leave.reason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Employees On Leave Today
          </h3>
          <p className="text-gray-500">
            All team members are present today!
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeesOnLeaveToday;
