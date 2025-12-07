import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  UserX,
  Download,
  Upload,
  Calendar,
  Users,
  Package,
  FileText,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { apiService } from "../../services/apiService";

const OffboardingPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [offboardings, setOffboardings] = useState([]);
  const [myOffboarding, setMyOffboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [selectedOffboarding, setSelectedOffboarding] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user?.role === "hr" || user?.role === "admin") {
      loadOffboardings();
    } else {
      loadMyOffboarding();
    }
  }, [user]);
  
 const loadOffboardings = async () => {
  try {
    console.log("🔍 Loading offboardings...");
    const response = await apiService.getAllOffboardings();
    
    console.log("📦 Response received:", response);
    console.log("📊 Offboardings data:", response.data);
    
    // FIX: Backend returns response.data.offboardings, not response.offboardings
    if (response.data && response.data.offboardings) {
      setOffboardings(response.data.offboardings);
      console.log("✅ Set offboardings:", response.data.offboardings.length, "items");
    } else if (Array.isArray(response.offboardings)) {
      // Fallback if backend returns it directly
      setOffboardings(response.offboardings);
      console.log("✅ Set offboardings (direct):", response.offboardings.length, "items");
    } else {
      console.warn("⚠️ No offboardings data in response");
      setOffboardings([]);
    }
    
    setLoading(false);
  } catch (error) {
    console.error("❌ Failed to load offboardings:", error);
    showError("Failed to load offboardings");
    setLoading(false);
  }
};

const loadMyOffboarding = async () => {
  try {
    console.log("🔍 Loading my offboarding...");
    const response = await apiService.getMyOffboarding();
    
    console.log("📦 My offboarding response:", response);
    
    // FIX: Backend returns response.data, not response.data.data
    if (response && response.data) {
      setMyOffboarding(response.data);
      console.log("✅ My offboarding loaded");
    } else {
      console.log("ℹ️ No offboarding process found");
      setMyOffboarding(null);
    }
    
    setLoading(false);
  } catch (error) {
    console.error("❌ Error loading my offboarding:", error);
    if (error.message.includes("404")) {
      setMyOffboarding(null);
    } else {
      showError("Failed to load offboarding");
    }
    setLoading(false);
  }
};


  const handleAssetReturn = async (
    offboardingId,
    assetIndex,
    condition,
    notes
  ) => {
    try {
      await apiService.markAssetReturned(
        offboardingId,
        assetIndex,
        condition,
        notes
      );
      showSuccess("Asset marked as returned");
      if (user?.role === "hr" || user?.role === "admin") {
        loadOffboardings();
      } else {
        loadMyOffboarding();
      }
    } catch (error) {
      showError("Failed to update asset status");
    }
  };

  const handleClearanceUpdate = async (
    offboardingId,
    clearanceIndex,
    cleared,
    remarks
  ) => {
    try {
      await apiService.updateClearance(
        offboardingId,
        clearanceIndex,
        cleared,
        remarks
      );
      showSuccess("Clearance status updated");
      if (user?.role === "hr" || user?.role === "admin") {
        loadOffboardings();
      } else {
        loadMyOffboarding();
      }
    } catch (error) {
      showError("Failed to update clearance status");
    }
  };

  const filteredOffboardings = offboardings.filter((offboarding) => {
    const matchesSearch =
      offboarding.employee?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      offboarding.employee?.lastName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      offboarding.employee?.employeeId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "initiated")
      return matchesSearch && offboarding.status === "Initiated";
    if (activeTab === "in-progress")
      return matchesSearch && offboarding.status === "In Progress";
    if (activeTab === "completed")
      return matchesSearch && offboarding.status === "Completed";

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Employee View
  if (user?.role !== "hr" && user?.role !== "admin") {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-2xl font-bold text-gray-900">My Offboarding</h1>

        {myOffboarding ? (
          <>
            {/* Progress Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Offboarding Progress</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    myOffboarding.status === "Completed"
                      ? "bg-green-100 text-green-800"
                      : myOffboarding.status === "In Progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {myOffboarding.status}
                </span>
              </div>

              <div className="mb-2 flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-semibold">
                  {myOffboarding.progress || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: `${myOffboarding.progress || 0}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Last Working Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(
                      myOffboarding.lastWorkingDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Notice Period</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {myOffboarding.noticePeriod || "Standard"} days
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Exit Type</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {myOffboarding.exitType || "Resignation"}
                  </p>
                </div>
              </div>
            </div>

            {/* Assets to Return */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Assets to Return
              </h2>
              <div className="space-y-3">
                {myOffboarding.assets &&
                  myOffboarding.assets.map((asset, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        asset.returned
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Package
                          className={`h-5 w-5 ${
                            asset.returned ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                        <div>
                          <h3
                            className={`font-medium ${
                              asset.returned
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {asset.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {asset.type} • {asset.assetId}
                          </p>
                          {asset.returned && (
                            <p className="text-xs text-green-600 mt-1">
                              Returned on{" "}
                              {new Date(asset.returnDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {!asset.returned && (
                        <button
                          onClick={() =>
                            setSelectedOffboarding({
                              ...myOffboarding,
                              selectedAsset: index,
                            })
                          }
                          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Mark Returned
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Clearances */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Clearances
              </h2>
              <div className="space-y-3">
                {myOffboarding.clearances &&
                  myOffboarding.clearances.map((clearance, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        clearance.cleared
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <CheckCircle
                          className={`h-5 w-5 ${
                            clearance.cleared
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        />
                        <div>
                          <h3
                            className={`font-medium ${
                              clearance.cleared
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {clearance.department}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {clearance.requirements}
                          </p>
                          {clearance.cleared && (
                            <p className="text-xs text-green-600 mt-1">
                              Cleared on{" "}
                              {new Date(
                                clearance.clearedDate
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          clearance.cleared
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {clearance.cleared ? "Cleared" : "Pending"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Exit Interview */}
            {myOffboarding.exitInterview && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Exit Interview
                </h2>
                <div className="space-y-3">
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(
                      myOffboarding.exitInterview.date
                    ).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Conducted by:</strong>{" "}
                    {myOffboarding.exitInterview.conductedBy}
                  </p>
                  <p>
                    <strong>Overall Feedback:</strong>{" "}
                    {myOffboarding.exitInterview.overallFeedback}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <UserX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Offboarding Process
            </h3>
            <p className="text-gray-500">
              You don't have any active offboarding process.
            </p>
          </div>
        )}
      </div>
    );
  }

  // HR/Admin View
  return (
    <div className="p-6 space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Offboarding Management
        </h1>
        <button
          onClick={() => setShowInitiateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Initiate Offboarding</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Offboardings"
          value={offboardings.length}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="Initiated"
          value={offboardings.filter((o) => o.status === "Initiated").length}
          color="bg-yellow-500"
        />
        <StatCard
          icon={UserX}
          label="In Progress"
          value={offboardings.filter((o) => o.status === "In Progress").length}
          color="bg-orange-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={offboardings.filter((o) => o.status === "Completed").length}
          color="bg-green-500"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-3 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex space-x-2">
            <Filter className="h-5 w-5 text-gray-400 mt-2" />
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {["all", "initiated", "in-progress", "completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-sm rounded-md capitalize ${
                    activeTab === tab
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Offboarding List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Working Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Exit Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Progress
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
              {filteredOffboardings.map((offboarding) => (
                <tr key={offboarding._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {offboarding.employee?.firstName}{" "}
                        {offboarding.employee?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {offboarding.employee?.employeeId}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(offboarding.lastWorkingDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {offboarding.exitType || "Resignation"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${offboarding.progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {offboarding.progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        offboarding.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : offboarding.status === "In Progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {offboarding.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedOffboarding(offboarding)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Initiate Modal */}
      {showInitiateModal && (
        <InitiateOffboardingModal
          onClose={() => setShowInitiateModal(false)}
          onSuccess={() => {
            setShowInitiateModal(false);
            loadOffboardings();
          }}
        />
      )}

      {/* View Details Modal */}
      {selectedOffboarding && (
        <OffboardingDetailsModal
          offboarding={selectedOffboarding}
          onClose={() => setSelectedOffboarding(null)}
          onUpdate={loadOffboardings}
          onAssetReturn={handleAssetReturn}
          onClearanceUpdate={handleClearanceUpdate}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`${color} p-4 rounded-xl`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
    </div>
  </div>
);

const InitiateOffboardingModal = ({ onClose, onSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    lastWorkingDate: "",
    exitType: "Resignation",
    reason: "",
    noticePeriod: "30",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await apiService.getAllEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error("Failed to load employees");
    }
  };

  const handleSubmit = async () => {
    try {
      await apiService.initiateOffboarding(formData);
      showSuccess("Offboarding initiated successfully");
      onSuccess();
    } catch (error) {
      showError(error.message || "Failed to initiate offboarding");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Initiate Offboarding</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) =>
                setFormData({ ...formData, employeeId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Working Date
            </label>
            <input
              type="date"
              value={formData.lastWorkingDate}
              onChange={(e) =>
                setFormData({ ...formData, lastWorkingDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exit Type
            </label>
            <select
              value={formData.exitType}
              onChange={(e) =>
                setFormData({ ...formData, exitType: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Resignation">Resignation</option>
              <option value="Termination">Termination</option>
              <option value="Retirement">Retirement</option>
              <option value="End of Contract">End of Contract</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notice Period (days)
            </label>
            <input
              type="number"
              value={formData.noticePeriod}
              onChange={(e) =>
                setFormData({ ...formData, noticePeriod: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter reason for offboarding..."
            />
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Initiate
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
    </div>
  );
};

const OffboardingDetailsModal = ({
  offboarding,
  onClose,
  onUpdate,
  onAssetReturn,
  onClearanceUpdate,
}) => {
  const [showExitInterview, setShowExitInterview] = useState(false);
  const [interviewData, setInterviewData] = useState({
    date: new Date().toISOString().split("T")[0],
    conductedBy: "",
    overallFeedback: "",
    rehireEligible: true,
    feedbackPoints: [],
  });

  const handleConductInterview = async () => {
    try {
      await apiService.conductExitInterview(offboarding._id, interviewData);
      onUpdate();
      setShowExitInterview(false);
    } catch (error) {
      console.error("Failed to conduct exit interview");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Offboarding Details - {offboarding.employee?.firstName}{" "}
            {offboarding.employee?.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Basic Information</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Employee ID:</strong>{" "}
                  {offboarding.employee?.employeeId}
                </p>
                <p>
                  <strong>Last Working Date:</strong>{" "}
                  {new Date(offboarding.lastWorkingDate).toLocaleDateString()}
                </p>
                <p>
                  <strong>Exit Type:</strong> {offboarding.exitType}
                </p>
                <p>
                  <strong>Notice Period:</strong> {offboarding.noticePeriod}{" "}
                  days
                </p>
                <p>
                  <strong>Status:</strong>
                  <span
                    className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      offboarding.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : offboarding.status === "In Progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {offboarding.status}
                  </span>
                </p>
              </div>
            </div>

            {/* Assets */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Assets
              </h3>
              <div className="space-y-2">
                {offboarding.assets &&
                  offboarding.assets.map((asset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border-b"
                    >
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-gray-600">
                          {asset.type} • {asset.assetId}
                        </p>
                      </div>
                      {!asset.returned ? (
                        <button
                          onClick={() =>
                            onAssetReturn(
                              offboarding._id,
                              index,
                              "Good",
                              "Returned by employee"
                            )
                          }
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Mark Returned
                        </button>
                      ) : (
                        <span className="text-sm text-green-600">Returned</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Clearances and Actions */}
          <div className="space-y-4">
            {/* Clearances */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Department Clearances
              </h3>
              <div className="space-y-2">
                {offboarding.clearances &&
                  offboarding.clearances.map((clearance, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border-b"
                    >
                      <div>
                        <p className="font-medium">{clearance.department}</p>
                        <p className="text-sm text-gray-600">
                          {clearance.requirements}
                        </p>
                      </div>
                      {!clearance.cleared ? (
                        <button
                          onClick={() =>
                            onClearanceUpdate(
                              offboarding._id,
                              index,
                              true,
                              "All clearances completed"
                            )
                          }
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Mark Cleared
                        </button>
                      ) : (
                        <span className="text-sm text-green-600">Cleared</span>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Actions</h3>
              <div className="space-y-2">
                {!offboarding.exitInterview && (
                  <button
                    onClick={() => setShowExitInterview(true)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Conduct Exit Interview</span>
                  </button>
                )}
                <button className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Generate Exit Documents</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exit Interview Modal */}
        {showExitInterview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
              <h3 className="text-lg font-bold mb-4">Conduct Exit Interview</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={interviewData.date}
                    onChange={(e) =>
                      setInterviewData({
                        ...interviewData,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conducted By
                  </label>
                  <input
                    type="text"
                    value={interviewData.conductedBy}
                    onChange={(e) =>
                      setInterviewData({
                        ...interviewData,
                        conductedBy: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter interviewer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Feedback
                  </label>
                  <textarea
                    value={interviewData.overallFeedback}
                    onChange={(e) =>
                      setInterviewData({
                        ...interviewData,
                        overallFeedback: e.target.value,
                      })
                    }
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter overall feedback..."
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleConductInterview}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Submit Interview
                  </button>
                  <button
                    onClick={() => setShowExitInterview(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffboardingPage;
