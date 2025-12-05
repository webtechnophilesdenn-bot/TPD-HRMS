import React from 'react';
import { CheckCircle, Download, Filter, RefreshCw } from 'lucide-react';

const ApprovedLeavesView = ({ leaves, loading, filters, setFilters, onRefresh }) => {
  if (loading) {
    return <div className="text-center py-12">Loading approved leaves...</div>;
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type
            </label>
            <select
              value={filters.leaveType}
              onChange={(e) => setFilters(prev => ({ ...prev, leaveType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="CASUAL">Casual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="EARNED">Earned Leave</option>
              <option value="MATERNITY">Maternity Leave</option>
              <option value="PATERNITY">Paternity Leave</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Approved Leaves Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Approved Leave History</h2>
            <p className="text-sm text-gray-500 mt-1">
              {leaves.length} approved leave{leaves.length !== 1 ? 's' : ''} in {filters.year}
            </p>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Approved By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Approved On
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaves.map(leave => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {leave.employee?.firstName} {leave.employee?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {leave.employee?.employeeId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {leave.leaveType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(leave.startDate).toLocaleDateString()} to{' '}
                    {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {leave.totalDays} day{leave.totalDays !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {leave.hrApproval?.approvedBy?.firstName || 
                     leave.managerApproval?.approvedBy?.firstName || 'System'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(
                      leave.hrApproval?.approvedOn || 
                      leave.managerApproval?.approvedOn || 
                      leave.updatedAt
                    ).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {leaves.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No approved leaves found for {filters.year}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovedLeavesView;
