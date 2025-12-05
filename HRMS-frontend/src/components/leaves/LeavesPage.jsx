import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Filter,
  Search,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Users,
  TrendingUp,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { apiService } from "../../services/apiService";
import AdminLeaveBalanceManager from "./AdminLeaveBalanceManager";

const LeavesPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // State for employee's own leaves
  const [leaves, setLeaves] = useState([]);
  const [summary, setSummary] = useState({});
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  // State for pending leaves (admin/HR)
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  // ✅ NEW: State for approved leaves
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [employeesOnLeaveToday, setEmployeesOnLeaveToday] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // ✅ UPDATED: Active tab with new options
  const [activeTab, setActiveTab] = useState("my-leaves");

  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    status: "",
    leaveType: "",
    page: 1,
    limit: 10,
  });

  const [searchTerm, setSearchTerm] = useState("");

  // Leave application form state
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    isHalfDay: false,
    halfDayType: "First Half",
    reason: "",
    emergencyContact: "",
    addressDuringLeave: "",
  });

  // Approval modal state
  const [approvalForm, setApprovalForm] = useState({
    status: "Approved",
    comments: "",
  });

  const isAdminOrHR =
    user?.role === "admin" || user?.role === "hr" || user?.role === "manager";
  const isAdminOrHROnly = user?.role === "admin" || user?.role === "hr";

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  useEffect(() => {
    if (activeTab === "my-leaves") {
      loadLeaves();
      loadLeaveBalance();
    } else if (activeTab === "pending-approvals" && isAdminOrHR) {
      loadPendingLeaves();
    } else if (activeTab === "approved-leaves" && isAdminOrHR) {
      loadApprovedLeaves();
    } else if (activeTab === "on-leave-today" && isAdminOrHR) {
      loadEmployeesOnLeaveToday();
    }
  }, [
    filters.year,
    filters.status,
    filters.leaveType,
    filters.page,
    activeTab,
  ]);

  const loadLeaveTypes = async () => {
    try {
      const response = await apiService.getLeaveTypes();
      setLeaveTypes(response.data || []);
    } catch (error) {
      console.error("Failed to load leave types", error);
    }
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      console.log("Loading my leaves...");
      const response = await apiService.getMyLeaves(filters);
      console.log("My leaves response:", response);
      setLeaves(response.data?.leaves || []);
      setSummary(response.data?.summary || {});
      setLoading(false);
    } catch (error) {
      console.error("Failed to load leaves", error);
      showError("Failed to load leaves");
      setLoading(false);
    }
  };

  const loadPendingLeaves = async () => {
    try {
      setLoading(true);
      console.log("Loading pending leaves for approval...");
      const response = await apiService.getPendingLeaves(filters);
      console.log("Pending leaves response:", response);
      setPendingLeaves(response.data?.leaves || []);
      setPendingCount(response.data?.pagination?.totalRecords || 0);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load pending leaves", error);
      showError("Failed to load pending leaves");
      setLoading(false);
    }
  };

  // ✅ NEW: Load approved leaves
  const loadApprovedLeaves = async () => {
    try {
      setLoading(true);
      console.log("Loading approved leaves...");
      const response = await apiService.getApprovedLeaves({
        year: filters.year,
        leaveType: filters.leaveType,
        page: filters.page,
        limit: 50,
      });
      setApprovedLeaves(response.data?.leaves || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load approved leaves", error);
      showError("Failed to load approved leaves");
      setLoading(false);
    }
  };

  // ✅ NEW: Load employees on leave today
  const loadEmployeesOnLeaveToday = async () => {
    try {
      setLoading(true);
      console.log("Loading employees on leave today...");
      const response = await apiService.getEmployeesOnLeaveToday();
      setEmployeesOnLeaveToday(response.data?.leaves || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load employees on leave today", error);
      showError("Failed to load employees on leave today");
      setLoading(false);
    }
  };

  const loadLeaveBalance = async () => {
    try {
      const response = await apiService.getLeaveBalance();
      setLeaveBalance(response.data?.balance || []);
    } catch (error) {
      console.error("Failed to load leave balance");
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      console.log("Applying leave", leaveForm);
      await apiService.applyLeave(leaveForm);
      showSuccess("Leave application submitted successfully!");
      setShowApplyModal(false);
      resetLeaveForm();
      loadLeaves();
      loadLeaveBalance();
      if (isAdminOrHR && activeTab === "pending-approvals") {
        loadPendingLeaves();
      }
    } catch (error) {
      console.error("Apply leave error:", error);
      showError(error.message || "Failed to apply leave");
    }
  };

  const handleApproveReject = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;

    try {
      console.log(`${approvalForm.status} leave`, selectedLeave._id);
      await apiService.updateLeaveStatus(selectedLeave._id, approvalForm);
      showSuccess(`Leave ${approvalForm.status.toLowerCase()} successfully!`);
      setShowApprovalModal(false);
      setSelectedLeave(null);
      resetApprovalForm();
      loadPendingLeaves();
      if (activeTab === "approved-leaves") {
        loadApprovedLeaves();
      }
    } catch (error) {
      console.error(
        `Failed to ${approvalForm.status.toLowerCase()} leave`,
        error
      );
      showError(
        error.message ||
          `Failed to ${approvalForm.status.toLowerCase()} leave`
      );
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (
      window.confirm("Are you sure you want to cancel this leave application?")
    ) {
      try {
        await apiService.cancelLeave(leaveId);
        showSuccess("Leave application cancelled successfully!");
        loadLeaves();
        loadLeaveBalance();
      } catch (error) {
        showError(error.message || "Failed to cancel leave");
      }
    }
  };

  const resetLeaveForm = () => {
    setLeaveForm({
      leaveType: "",
      startDate: "",
      endDate: "",
      isHalfDay: false,
      halfDayType: "First Half",
      reason: "",
      emergencyContact: "",
      addressDuringLeave: "",
    });
  };

  const resetApprovalForm = () => {
    setApprovalForm({
      status: "Approved",
      comments: "",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "Cancelled":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // ✅ Render Leave Application Modal
  const renderApplyLeaveModal = () => {
    if (!showApplyModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Apply for Leave
            </h2>
            <button
              onClick={() => {
                setShowApplyModal(false);
                resetLeaveForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type *
              </label>
              <select
                value={leaveForm.leaveType}
                onChange={(e) =>
                  setLeaveForm({ ...leaveForm, leaveType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Half Day */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHalfDay"
                checked={leaveForm.isHalfDay}
                onChange={(e) =>
                  setLeaveForm({ ...leaveForm, isHalfDay: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isHalfDay" className="text-sm text-gray-700">
                Half Day Leave
              </label>
            </div>

            {/* Half Day Type */}
            {leaveForm.isHalfDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Half Day Type
                </label>
                <select
                  value={leaveForm.halfDayType}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, halfDayType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="First Half">First Half</option>
                  <option value="Second Half">Second Half</option>
                </select>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) =>
                    setLeaveForm({ ...leaveForm, endDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <textarea
                value={leaveForm.reason}
                onChange={(e) =>
                  setLeaveForm({ ...leaveForm, reason: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reason for leave..."
                required
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                value={leaveForm.emergencyContact}
                onChange={(e) =>
                  setLeaveForm({
                    ...leaveForm,
                    emergencyContact: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Phone number"
              />
            </div>

            {/* Address During Leave */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address During Leave
              </label>
              <textarea
                value={leaveForm.addressDuringLeave}
                onChange={(e) =>
                  setLeaveForm({
                    ...leaveForm,
                    addressDuringLeave: e.target.value,
                  })
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter address where you can be reached..."
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowApplyModal(false);
                  resetLeaveForm();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ✅ Render Approval Modal
  const renderApprovalModal = () => {
    if (!showApprovalModal || !selectedLeave) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full">
          {/* Modal Header */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900">
              Review Leave Application
            </h2>
            <button
              onClick={() => {
                setShowApprovalModal(false);
                setSelectedLeave(null);
                resetApprovalForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {/* Leave Details */}
            <div className="mb-6 space-y-3 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-medium text-gray-900">
                    {selectedLeave.employee?.firstName}{" "}
                    {selectedLeave.employee?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employee ID</p>
                  <p className="font-medium text-gray-900">
                    {selectedLeave.employee?.employeeId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Leave Type</p>
                  <p className="font-medium text-gray-900">
                    {selectedLeave.leaveType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-medium text-gray-900">
                    {selectedLeave.totalDays} day
                    {selectedLeave.totalDays !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedLeave.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedLeave.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium text-gray-900">
                  {selectedLeave.reason}
                </p>
              </div>
            </div>

            {/* Approval Form */}
            <form onSubmit={handleApproveReject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decision
                </label>
                <select
                  value={approvalForm.status}
                  onChange={(e) =>
                    setApprovalForm({ ...approvalForm, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Approved">Approve</option>
                  <option value="Rejected">Reject</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comments
                </label>
                <textarea
                  value={approvalForm.comments}
                  onChange={(e) =>
                    setApprovalForm({
                      ...approvalForm,
                      comments: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add comments (optional)..."
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowApprovalModal(false);
                    setSelectedLeave(null);
                    resetApprovalForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-lg text-white ${
                    approvalForm.status === "Approved"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {approvalForm.status === "Approved" ? "Approve" : "Reject"}{" "}
                  Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Render Details Modal
  const renderDetailsModal = () => {
    if (!showDetailsModal || !selectedLeave) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              Leave Details
            </h2>
            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedLeave(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(
                  selectedLeave.status
                )}`}
              >
                {getStatusIcon(selectedLeave.status)}
                {selectedLeave.status}
              </span>
              <span className="text-sm text-gray-500">
                Applied on{" "}
                {new Date(
                  selectedLeave.appliedOn || selectedLeave.createdAt
                ).toLocaleDateString()}
              </span>
            </div>

            {/* Leave Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Leave Type</p>
                <p className="font-medium text-gray-900">
                  {selectedLeave.leaveType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-medium text-gray-900">
                  {selectedLeave.totalDays} day
                  {selectedLeave.totalDays !== 1 ? "s" : ""}
                  {selectedLeave.isHalfDay && (
                    <span className="text-sm text-gray-600">
                      {" "}
                      ({selectedLeave.halfDayType})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedLeave.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">End Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedLeave.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <p className="text-sm text-gray-600 mb-1">Reason</p>
              <p className="text-gray-900">{selectedLeave.reason}</p>
            </div>

            {/* Emergency Contact */}
            {selectedLeave.emergencyContact && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Emergency Contact</p>
                <p className="text-gray-900">{selectedLeave.emergencyContact}</p>
              </div>
            )}

            {/* Address During Leave */}
            {selectedLeave.addressDuringLeave && (
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Address During Leave
                </p>
                <p className="text-gray-900">
                  {selectedLeave.addressDuringLeave}
                </p>
              </div>
            )}

            {/* Approval Status */}
            {selectedLeave.managerApproval && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Manager Approval
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        selectedLeave.managerApproval.status
                      )}`}
                    >
                      {selectedLeave.managerApproval.status}
                    </span>
                  </div>
                  {selectedLeave.managerApproval.comments && (
                    <div>
                      <p className="text-sm text-gray-600">Comments:</p>
                      <p className="text-sm text-gray-900">
                        {selectedLeave.managerApproval.comments}
                      </p>
                    </div>
                  )}
                  {selectedLeave.managerApproval.approvedOn && (
                    <p className="text-sm text-gray-500">
                      On{" "}
                      {new Date(
                        selectedLeave.managerApproval.approvedOn
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {selectedLeave.hrApproval && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  HR Approval
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        selectedLeave.hrApproval.status
                      )}`}
                    >
                      {selectedLeave.hrApproval.status}
                    </span>
                  </div>
                  {selectedLeave.hrApproval.comments && (
                    <div>
                      <p className="text-sm text-gray-600">Comments:</p>
                      <p className="text-sm text-gray-900">
                        {selectedLeave.hrApproval.comments}
                      </p>
                    </div>
                  )}
                  {selectedLeave.hrApproval.approvedOn && (
                    <p className="text-sm text-gray-500">
                      On{" "}
                      {new Date(
                        selectedLeave.hrApproval.approvedOn
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="border-t px-6 py-4 flex justify-end">
            <button
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedLeave(null);
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Render My Leaves Tab
  const renderMyLeaves = () => {
    return (
      <div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.total || 0}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {summary.approved || 0}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {summary.pending || 0}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Days</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.totalDays || 0}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Leave Balance Cards */}
        {leaveBalance.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Leave Balance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {leaveBalance.map((balance) => (
                <div
                  key={balance.code}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-4 border border-blue-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {balance.name}
                    </h4>
                    <span className="text-2xl font-bold text-blue-600">
                      {balance.currentBalance}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Opening:</span>
                      <span className="font-medium">
                        {balance.openingBalance}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span className="font-medium">{balance.usedBalance}</span>
                    </div>
                    {balance.accruedBalance > 0 && (
                      <div className="flex justify-between">
                        <span>Accrued:</span>
                        <span className="font-medium">
                          {balance.accruedBalance}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={filters.year}
                onChange={(e) =>
                  setFilters({ ...filters, year: parseInt(e.target.value) })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={filters.leaveType}
                onChange={(e) =>
                  setFilters({ ...filters, leaveType: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {leaveTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Apply Leave
            </button>
          </div>
        </div>

        {/* Leaves Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              My Leave Applications
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {leaves.length} application(s) in {filters.year}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Loading leaves...</p>
            </div>
          ) : leaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {leave.leaveType}
                          {leave.isHalfDay && " (Half Day)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(leave.startDate).toLocaleDateString()} to{" "}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(
                            leave.status
                          )}`}
                        >
                          {getStatusIcon(leave.status)}
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {leave.status === "Pending" && (
                            <button
                              onClick={() => handleCancelLeave(leave._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Cancel Leave"
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
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No leave applications found</p>
              <button
                onClick={() => setShowApplyModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply for Leave
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ Render Pending Approvals Tab
  const renderPendingApprovals = () => {
    return (
      <div>
        {/* Notification Banner */}
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">
                <span className="font-semibold">{pendingCount}</span>{" "}
                {pendingCount !== 1 ? "leaves" : "leave"} waiting for your
                approval
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <select
              value={filters.leaveType}
              onChange={(e) =>
                setFilters({ ...filters, leaveType: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {leaveTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>

            <button
              onClick={loadPendingLeaves}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Pending Leaves Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Approvals
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {pendingLeaves.length} pending request(s)
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Loading pending leaves...</p>
            </div>
          ) : pendingLeaves.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee
                    </th>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingLeaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {leave.employee?.firstName}{" "}
                            {leave.employee?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {leave.employee?.employeeId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {leave.leaveType}
                          {leave.isHalfDay && " (Half Day)"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(leave.startDate).toLocaleDateString()} to{" "}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setApprovalForm({ status: "Approved", comments: "" });
                              setShowApprovalModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Approve"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLeave(leave);
                              setApprovalForm({ status: "Rejected", comments: "" });
                              setShowApprovalModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Reject"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No pending approvals</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ✅ NEW: Render Approved Leaves Tab
  const renderApprovedLeaves = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading approved leaves...</p>
        </div>
      );
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
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    year: parseInt(e.target.value),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Type
              </label>
              <select
                value={filters.leaveType}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, leaveType: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {leaveTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadApprovedLeaves}
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
              <h2 className="text-lg font-semibold text-gray-900">
                Approved Leave History
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {approvedLeaves.length} approved leave
                {approvedLeaves.length !== 1 ? "s" : ""} in {filters.year}
              </p>
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approvedLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {leave.employee?.firstName}{" "}
                          {leave.employee?.lastName}
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
                      {new Date(leave.startDate).toLocaleDateString()} to{" "}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {leave.hrApproval?.approvedBy?.firstName ||
                        leave.managerApproval?.approvedBy?.firstName ||
                        "System"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(
                        leave.hrApproval?.approvedOn ||
                          leave.managerApproval?.approvedOn ||
                          leave.updatedAt
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedLeave(leave);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {approvedLeaves.length === 0 && (
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

  // ✅ NEW: Render Employees on Leave Today Tab
  const renderEmployeesOnLeaveToday = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading...</p>
        </div>
      );
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return (
      <div>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Employees On Leave Today
              </h2>
              <p className="text-purple-100">{today}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">
                {employeesOnLeaveToday.length}
              </div>
              <div className="text-purple-100">
                employee{employeesOnLeaveToday.length !== 1 ? "s" : ""} on
                leave
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex justify-end">
          <button
            onClick={loadEmployeesOnLeaveToday}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Employee Cards */}
        {employeesOnLeaveToday.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeesOnLeaveToday.map((leave) => (
              <div
                key={leave._id}
                className="bg-white rounded-lg shadow p-6 border border-gray-200"
              >
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
                        {leave.employee?.firstName?.charAt(0)}
                        {leave.employee?.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {leave.employee?.employeeId}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {leave.employee?.designation}
                    </p>
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
                      {new Date(leave.startDate).toLocaleDateString()} -{" "}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Days:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {leave.reason && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600">Reason:</p>
                      <p className="text-sm text-gray-900 mt-1">
                        {leave.reason}
                      </p>
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
            <p className="text-gray-500">All team members are present today!</p>
          </div>
        )}
      </div>
    );
  };

  // ✅ MAIN RENDER
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Leave Management
        </h1>
        <p className="text-gray-600">
          {activeTab === "my-leaves"
            ? "Manage your leave applications and balance"
            : activeTab === "pending-approvals"
            ? "Review and approve pending leave requests"
            : activeTab === "approved-leaves"
            ? "View approved leave history"
            : activeTab === "on-leave-today"
            ? "Employees currently on leave"
            : "Manage employee leave balances"}
        </p>
      </div>

      {/* ✅ Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("my-leaves")}
            className={`py-2 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "my-leaves"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            My Leaves
          </button>

          {isAdminOrHR && (
            <>
              <button
                onClick={() => setActiveTab("pending-approvals")}
                className={`py-2 px-4 border-b-2 transition-colors relative whitespace-nowrap ${
                  activeTab === "pending-approvals"
                    ? "border-yellow-600 text-yellow-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Pending Approvals
                {pendingCount > 0 && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("approved-leaves")}
                className={`py-2 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "approved-leaves"
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Approved Leaves
              </button>

              <button
                onClick={() => setActiveTab("on-leave-today")}
                className={`py-2 px-4 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === "on-leave-today"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                On Leave Today
                {employeesOnLeaveToday.length > 0 && (
                  <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {employeesOnLeaveToday.length}
                  </span>
                )}
              </button>
            </>
          )}

          {isAdminOrHROnly && (
            <button
              onClick={() => setActiveTab("manage-balance")}
              className={`py-2 px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "manage-balance"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-800"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Manage Balances
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "my-leaves" && renderMyLeaves()}
      {activeTab === "pending-approvals" && isAdminOrHR && renderPendingApprovals()}
      {activeTab === "approved-leaves" && isAdminOrHR && renderApprovedLeaves()}
      {activeTab === "on-leave-today" && isAdminOrHR && renderEmployeesOnLeaveToday()}
      {activeTab === "manage-balance" && isAdminOrHROnly && (
        <AdminLeaveBalanceManager />
      )}

      {/* Modals */}
      {renderApplyLeaveModal()}
      {renderApprovalModal()}
      {renderDetailsModal()}
    </div>
  );
};

export default LeavesPage;
