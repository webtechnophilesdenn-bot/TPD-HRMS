import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Filter, Search, Download, Clock, AlertCircle, CheckCircle, XCircle, Eye, Trash2, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // ✅ Fixed path
import { useNotification } from '../../context/NotificationContext'; // ✅ Fixed path
import { apiService } from '../../services/apiService'; // ✅ Changed to named import
import AdminLeaveBalanceManager from './AdminLeaveBalanceManager';

const LeavesPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // State for employee's own leaves
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({});
  const [leaveBalance, setLeaveBalance] = useState([]);

  // State for pending leaves (admin/HR)
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Active tab: 'my-leaves', 'pending-approvals', or 'manage-balance'
  const [activeTab, setActiveTab] = useState('my-leaves');

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    status: '',
    leaveType: '',
    page: 1,
    limit: 10,
  });

  const [searchTerm, setSearchTerm] = useState('');

  const isAdminOrHR = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';
  const isAdminOrHROnly = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    if (activeTab === 'my-leaves') {
      loadLeaves();
      loadLeaveBalance();
    } else if (activeTab === 'pending-approvals' && isAdminOrHR) {
      loadPendingLeaves();
    }
    // No need to load anything for 'manage-balance' - the AdminLeaveBalanceManager handles its own data
  }, [filters.year, filters.status, filters.leaveType, filters.page, activeTab]);

  const loadLeaves = async () => {
    try {
      console.log('Loading my leaves...');
      const response = await apiService.getMyLeaves(filters);
      console.log('My leaves response:', response);
      setLeaves(response.data?.leaves || []);
      setSummary(response.data?.summary || {});
      setLoading(false);
    } catch (error) {
      console.error('Failed to load leaves', error);
      showError('Failed to load leaves');
      setLoading(false);
    }
  };

  const loadPendingLeaves = async () => {
    try {
      console.log('Loading pending leaves for approval...');
      const response = await apiService.getPendingLeaves(filters);
      console.log('Pending leaves response:', response);
      setPendingLeaves(response.data?.leaves || []);
      setPendingCount(response.data?.pagination?.totalRecords || 0);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load pending leaves', error);
      showError('Failed to load pending leaves');
      setLoading(false);
    }
  };

  const loadLeaveBalance = async () => {
    try {
      const response = await apiService.getLeaveBalance();
      setLeaveBalance(response.data?.balance || []);
    } catch (error) {
      console.error('Failed to load leave balance');
    }
  };

  const handleApplyLeave = async (formData) => {
    try {
      console.log('Applying leave', formData);
      await apiService.applyLeave(formData);
      showSuccess('Leave application submitted successfully!');
      setShowApplyModal(false);
      loadLeaves();
      loadLeaveBalance();

      // Refresh pending leaves if admin is viewing
      if (isAdminOrHR && activeTab === 'pending-approvals') {
        loadPendingLeaves();
      }
    } catch (error) {
      console.error('Apply leave error:', error);
      showError(error.message || 'Failed to apply leave');
    }
  };

  const handleApproveReject = async (leaveId, status, comments) => {
    try {
      console.log(`${status} leave`, leaveId);
      await apiService.updateLeaveStatus(leaveId, { status, comments });
      showSuccess(`Leave ${status.toLowerCase()} successfully!`);
      setShowApprovalModal(false);
      setSelectedLeave(null);
      loadPendingLeaves();
    } catch (error) {
      console.error(`Failed to ${status.toLowerCase()} leave`, error);
      showError(error.message || `Failed to ${status.toLowerCase()} leave`);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (window.confirm('Are you sure you want to cancel this leave application?')) {
      try {
        await apiService.cancelLeave(leaveId);
        showSuccess('Leave application cancelled successfully!');
        loadLeaves();
        loadLeaveBalance();
      } catch (error) {
        showError(error.message || 'Failed to cancel leave');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-4 w-4" />;
      case 'Rejected': return <XCircle className="h-4 w-4" />;
      case 'Pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredLeaves = leaves.filter(leave =>
    leave.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPendingLeaves = pendingLeaves.filter(leave =>
    leave.employee?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.employee?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.employee?.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.leaveType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && activeTab !== 'manage-balance') {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">
            {activeTab === 'my-leaves' ? 'Manage your leave applications and balance' : 
             activeTab === 'pending-approvals' ? 'Review and approve pending leave requests' :
             'Manage employee leave balances'}
          </p>
        </div>
        {activeTab !== 'manage-balance' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Apply Leave</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs for Admin/HR/Manager */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b">
          <button
            onClick={() => {
              setActiveTab('my-leaves');
              setFilters({ ...filters, page: 1 });
            }}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'my-leaves'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Leaves
          </button>

          {isAdminOrHR && (
            <button
              onClick={() => {
                setActiveTab('pending-approvals');
                setFilters({ ...filters, page: 1 });
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === 'pending-approvals'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Approvals
              {pendingCount > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {isAdminOrHROnly && (
            <button
              onClick={() => {
                setActiveTab('manage-balance');
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'manage-balance'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manage Balance
            </button>
          )}
        </div>
      </div>

      {/* My Leaves Tab Content */}
      {activeTab === 'my-leaves' && (
        <>
          {/* Leave Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {leaveBalance.map((balance) => (
              <div key={balance.code} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{balance.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      balance.currentBalance > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {balance.isPaid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-gray-900">{balance.currentBalance}</span>
                    <span className="text-sm text-gray-500">/ {balance.maxBalance}</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-medium">{balance.currentBalance} days</span>
                    </div>
                    {balance.usedBalance > 0 && (
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span className="font-medium">{balance.usedBalance} days</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{summary.approved || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.pending || 0}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Days</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.totalDays || 0}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* My Leaves Table */}
          <LeaveHistoryTable
            leaves={filteredLeaves}
            filters={filters}
            setFilters={setFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            summary={summary}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            onViewDetails={(leave) => {
              setSelectedLeave(leave);
              setShowDetailsModal(true);
            }}
            onCancel={handleCancelLeave}
            onRefresh={loadLeaves}
            showEmployeeColumn={false}
          />
        </>
      )}

      {/* Pending Approvals Tab Content */}
      {activeTab === 'pending-approvals' && isAdminOrHR && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">Pending Leave Requests</h2>
            <p className="text-gray-600">
              {pendingCount} {pendingCount !== 1 ? 'leaves' : 'leave'} waiting for your approval
            </p>
          </div>
          <LeaveHistoryTable
            leaves={filteredPendingLeaves}
            filters={filters}
            setFilters={setFilters}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            summary={{ total: pendingCount }}
            getStatusColor={getStatusColor}
            getStatusIcon={getStatusIcon}
            onViewDetails={(leave) => {
              setSelectedLeave(leave);
              setShowApprovalModal(true);
            }}
            onRefresh={loadPendingLeaves}
            showEmployeeColumn={true}
            showApprovalActions={true}
            onApprove={(leave) => handleApproveReject(leave._id, 'Approved', '')}
            onReject={(leave) => {
              setSelectedLeave(leave);
              setShowApprovalModal(true);
            }}
          />
        </>
      )}

      {/* Manage Balance Tab - Show AdminLeaveBalanceManager Component */}
      {activeTab === 'manage-balance' && isAdminOrHROnly && (
        <AdminLeaveBalanceManager />
      )}

      {/* Modals */}
      {showApplyModal && (
        <ApplyLeaveModal
          leaveBalance={leaveBalance}
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleApplyLeave}
        />
      )}

      {showDetailsModal && selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedLeave(null);
          }}
          onCancel={handleCancelLeave}
        />
      )}

      {showApprovalModal && selectedLeave && (
        <ApprovalModal
          leave={selectedLeave}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedLeave(null);
          }}
          onApprove={(comments) => handleApproveReject(selectedLeave._id, 'Approved', comments)}
          onReject={(comments) => handleApproveReject(selectedLeave._id, 'Rejected', comments)}
        />
      )}
    </div>
  );
};

// Reusable Leave History Table Component
const LeaveHistoryTable = ({
  leaves,
  filters,
  setFilters,
  searchTerm,
  setSearchTerm,
  summary,
  getStatusColor,
  getStatusIcon,
  onViewDetails,
  onCancel,
  onRefresh,
  showEmployeeColumn = false,
  showApprovalActions = false,
  onApprove,
  onReject,
}) => {
  return (
    <>
      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={showEmployeeColumn ? "Search by employee, type, or reason..." : "Search leaves by type, reason, or status..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={filters.year}
              onChange={(e) =>
                setFilters({ ...filters, year: e.target.value, page: 1 })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>

            {!showApprovalActions && (
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value, page: 1 })
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            )}

            <button
              onClick={onRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Leave List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {showApprovalActions ? "Pending Requests" : "Leave History"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {summary.total || leaves.length} {showApprovalActions ? "pending request(s)" : `application(s) in ${filters.year}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {showEmployeeColumn && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                {!showApprovalActions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  {showEmployeeColumn && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{leave.employee?.employeeId}</p>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {leave.leaveType}
                      </p>
                      {leave.isHalfDay && (
                        <p className="text-xs text-gray-500">Half Day</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(leave.startDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      to {new Date(leave.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                    <div className="truncate" title={leave.reason}>
                      {leave.reason}
                    </div>
                  </td>
                  {!showApprovalActions && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          leave.status
                        )}`}
                      >
                        {getStatusIcon(leave.status)}
                        <span>{leave.status}</span>
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewDetails(leave)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {showApprovalActions ? (
                        <>
                          <button
                            onClick={() => onApprove(leave)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Approve"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onReject(leave)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Reject"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        leave.status === "Pending" && onCancel && (
                          <button
                            onClick={() => onCancel(leave._id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Cancel Leave"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {leaves.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No leaves found.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Apply Leave Modal Component
const ApplyLeaveModal = ({ leaveBalance, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    leaveType: "CASUAL",
    startDate: "",
    endDate: "",
    isHalfDay: false,
    halfDayType: "First Half",
    reason: "",
    emergencyContact: "",
  });
  const [calculating, setCalculating] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);

  const selectedLeaveType = leaveBalance.find(
    (lt) => lt.code === formData.leaveType
  );

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      setCalculating(true);
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const days = formData.isHalfDay ? 0.5 : diffDays;
      setCalculatedDays(days);
      setCalculating(false);
    }
  };

  useEffect(() => {
    calculateDays();
  }, [formData.startDate, formData.endDate, formData.isHalfDay]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = () => {
    return (
      formData.startDate &&
      formData.endDate &&
      formData.reason.trim() &&
      calculatedDays > 0
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {leaveBalance.map((balance) => (
                <button
                  key={balance.code}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, leaveType: balance.code })
                  }
                  className={`p-3 border rounded-lg text-left transition-all ${
                    formData.leaveType === balance.code
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {balance.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Balance: {balance.currentBalance} days
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                min={
                  formData.startDate || new Date().toISOString().split("T")[0]
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Half Day Options */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isHalfDay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isHalfDay: e.target.checked,
                    halfDayType: e.target.checked ? "First Half" : null,
                  })
                }
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Half Day
              </span>
            </label>

            {formData.isHalfDay && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Half Day Type
                </label>
                <select
                  value={formData.halfDayType}
                  onChange={(e) =>
                    setFormData({ ...formData, halfDayType: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="First Half">First Half (AM)</option>
                  <option value="Second Half">Second Half (PM)</option>
                </select>
              </div>
            )}
          </div>

          {/* Duration Calculation */}
          {calculatedDays > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-900">
                  Total Duration
                </span>
                <span className="text-lg font-bold text-blue-900">
                  {calculatedDays} day{calculatedDays !== 1 ? "s" : ""}
                </span>
              </div>
              {selectedLeaveType &&
                calculatedDays > selectedLeaveType.currentBalance && (
                  <div className="flex items-center space-x-2 mt-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      Insufficient balance. Available:{" "}
                      {selectedLeaveType.currentBalance} days
                    </span>
                  </div>
                )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Please provide detailed reason for your leave application..."
              required
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={(e) =>
                setFormData({ ...formData, emergencyContact: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Emergency contact number during leave"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="submit"
              disabled={!isFormValid() || calculating}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {calculating ? "Calculating..." : "Submit Application"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Leave Details Modal Component
const LeaveDetailsModal = ({ leave, onClose, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Leave Application Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Leave Type
              </label>
              <p className="text-gray-900 font-medium">{leave.leaveType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Status
              </label>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    leave.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : leave.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : leave.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {leave.status === "Approved" && (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  {leave.status === "Rejected" && (
                    <XCircle className="h-3 w-3" />
                  )}
                  {leave.status === "Pending" && <Clock className="h-3 w-3" />}
                  <span>{leave.status}</span>
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Start Date
              </label>
              <p className="text-gray-900">
                {new Date(leave.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                End Date
              </label>
              <p className="text-gray-900">
                {new Date(leave.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Duration
              </label>
              <p className="text-gray-900">
                {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
              </p>
              {leave.isHalfDay && (
                <p className="text-sm text-gray-600">{leave.halfDayType}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Applied On
              </label>
              <p className="text-gray-900">
                {new Date(
                  leave.appliedOn || leave.createdAt
                ).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-sm font-medium text-gray-600">Reason</label>
            <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
              {leave.reason}
            </p>
          </div>

          {/* Approval Information */}
          {(leave.managerApproval || leave.hrApproval) && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Approval Details</h3>
              <div className="space-y-3">
                {leave.managerApproval && (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Manager Approval</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          leave.managerApproval.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : leave.managerApproval.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {leave.managerApproval.status}
                      </span>
                    </div>
                    {leave.managerApproval.comments && (
                      <p className="text-sm text-gray-600 mt-2">
                        {leave.managerApproval.comments}
                      </p>
                    )}
                    {leave.managerApproval.approvedOn && (
                      <p className="text-xs text-gray-500 mt-1">
                        On{" "}
                        {new Date(
                          leave.managerApproval.approvedOn
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {leave.hrApproval && (
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">HR Approval</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          leave.hrApproval.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : leave.hrApproval.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {leave.hrApproval.status}
                      </span>
                    </div>
                    {leave.hrApproval.comments && (
                      <p className="text-sm text-gray-600 mt-2">
                        {leave.hrApproval.comments}
                      </p>
                    )}
                    {leave.hrApproval.approvedOn && (
                      <p className="text-xs text-gray-500 mt-1">
                        On{" "}
                        {new Date(
                          leave.hrApproval.approvedOn
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t">
            {leave.status === "Pending" && onCancel && (
              <button
                onClick={() => {
                  onCancel(leave._id);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Cancel Application
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Approval Modal Component
const ApprovalModal = ({ leave, onClose, onApprove, onReject }) => {
  const [comments, setComments] = useState("");
  const [action, setAction] = useState(""); // "approve" or "reject"

  const handleSubmit = () => {
    if (action === "approve") {
      onApprove(comments);
    } else if (action === "reject") {
      if (!comments.trim()) {
        alert("Please provide a reason for rejection");
        return;
      }
      onReject(comments);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Review Leave Application</h2>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Employee</label>
              <p className="text-gray-900">{leave.employee?.firstName} {leave.employee?.lastName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Leave Type</label>
              <p className="text-gray-900">{leave.leaveType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Start Date</label>
              <p className="text-gray-900">{new Date(leave.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">End Date</label>
              <p className="text-gray-900">{new Date(leave.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Duration</label>
              <p className="text-gray-900">{leave.totalDays} days</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Reason</label>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg mt-1">{leave.reason}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments {action === "reject" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add your comments here..."
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => {
              setAction("approve");
              handleSubmit();
            }}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={() => {
              setAction("reject");
              handleSubmit();
            }}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reject
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeavesPage;
