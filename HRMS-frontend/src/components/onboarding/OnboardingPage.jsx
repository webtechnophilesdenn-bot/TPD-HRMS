import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  UserCheck,
  Download,
  Upload,
  Calendar,
  Users,
  MoreVertical,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { apiService } from "../../services/apiService";

const OnboardingPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [onboardings, setOnboardings] = useState([]);
  const [myOnboarding, setMyOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    if (user?.role === "hr" || user?.role === "admin") {
      loadOnboardings();
    } else {
      loadMyOnboarding();
    }
  }, [user]);

  const loadOnboardings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllOnboardings();
      console.log("Full API Response:", response);
      
      // Handle different possible response structures
      let onboardingsData = [];
      
      if (Array.isArray(response)) {
        onboardingsData = response;
      } else if (Array.isArray(response.data)) {
        onboardingsData = response.data;
      } else if (Array.isArray(response.onboardings)) {
        onboardingsData = response.onboardings;
      } else if (response.data && Array.isArray(response.data.onboardings)) {
        onboardingsData = response.data.onboardings;
      } else {
        console.warn("Unexpected response structure:", response);
        onboardingsData = [];
      }
      
      console.log("Final onboardings data:", onboardingsData);
      setOnboardings(onboardingsData);
    } catch (error) {
      console.error("Load onboardings error:", error);
      showError("Failed to load onboardings");
      setOnboardings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyOnboarding = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyOnboarding();
      console.log("My onboarding response:", response);
      setMyOnboarding(response.data || response);
    } catch (error) {
      if (error.message.includes("404")) {
        setMyOnboarding(null);
      } else {
        showError("Failed to load onboarding");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (onboardingId, taskId, completed) => {
    try {
      await apiService.updateOnboardingTask(onboardingId, taskId, !completed);
      showSuccess("Task updated successfully");
      if (user?.role === "hr" || user?.role === "admin") {
        loadOnboardings();
      } else {
        loadMyOnboarding();
      }
    } catch (error) {
      showError("Failed to update task");
    }
  };

  const toggleRowExpansion = (onboardingId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(onboardingId)) {
      newExpanded.delete(onboardingId);
    } else {
      newExpanded.add(onboardingId);
    }
    setExpandedRows(newExpanded);
  };

  // Safe filtering
  const filteredOnboardings = Array.isArray(onboardings) 
    ? onboardings.filter((onboarding) => {
        if (!onboarding || !onboarding.employee) return false;
        
        const matchesSearch =
          onboarding.employee?.firstName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          onboarding.employee?.lastName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          onboarding.employee?.employeeId
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        if (activeTab === "all") return matchesSearch;
        if (activeTab === "pending")
          return matchesSearch && onboarding.status === "Pending";
        if (activeTab === "in-progress")
          return matchesSearch && onboarding.status === "In Progress";
        if (activeTab === "completed")
          return matchesSearch && onboarding.status === "Completed";

        return matchesSearch;
      })
    : [];

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-64">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Employee View
  if (user?.role !== "hr" && user?.role !== "admin") {
    return <EmployeeOnboardingView myOnboarding={myOnboarding} onTaskToggle={handleTaskToggle} />;
  }

  // HR/Admin View
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Management</h1>
          <p className="text-gray-600 mt-1">Manage employee onboarding processes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>New Onboarding</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Onboardings"
          value={onboardings.length}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={onboardings.filter((o) => o?.status === "Pending").length}
          color="bg-yellow-500"
        />
        <StatCard
          icon={UserCheck}
          label="In Progress"
          value={onboardings.filter((o) => o?.status === "In Progress").length}
          color="bg-orange-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={onboardings.filter((o) => o?.status === "Completed").length}
          color="bg-green-500"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "in-progress", label: "In Progress" },
                { key: "completed", label: "Completed" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeTab === tab.key
                      ? "bg-white text-indigo-600 shadow-sm font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOnboardings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No onboardings found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm || activeTab !== "all" 
                          ? "Try adjusting your search or filters"
                          : "Get started by creating a new onboarding process"
                        }
                      </p>
                      {!searchTerm && activeTab === "all" && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Onboarding</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOnboardings.map((onboarding) => (
                  <React.Fragment key={onboarding._id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {onboarding.employee?.firstName} {onboarding.employee?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {onboarding.employee?.employeeId}
                          </p>
                          <p className="text-xs text-gray-400">
                            {onboarding.employee?.department?.name || "No department"} • {onboarding.employee?.designation?.name || "No designation"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {onboarding.joiningDate ? new Date(onboarding.joiningDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${onboarding.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 min-w-8">
                            {onboarding.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={onboarding.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {onboarding.updatedAt ? new Date(onboarding.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleRowExpansion(onboarding._id)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1 px-3 py-1 rounded-md hover:bg-indigo-50 transition-colors"
                          >
                            {expandedRows.has(onboarding._id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => setSelectedOnboarding(onboarding)}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(onboarding._id) && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <OnboardingExpandedView 
                            onboarding={onboarding} 
                            onTaskToggle={handleTaskToggle}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateOnboardingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadOnboardings();
            showSuccess("Onboarding created successfully");
          }}
        />
      )}

      {/* View Details Modal */}
      {selectedOnboarding && (
        <OnboardingDetailsModal
          onboarding={selectedOnboarding}
          onClose={() => setSelectedOnboarding(null)}
          onUpdate={loadOnboardings}
        />
      )}
    </div>
  );
};

// Employee View Component
const EmployeeOnboardingView = ({ myOnboarding, onTaskToggle }) => {
  if (!myOnboarding) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <UserCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Onboarding Found
          </h3>
          <p className="text-gray-500 mb-4">
            Your onboarding process hasn't been initiated yet.
          </p>
          <p className="text-sm text-gray-400">
            Please contact HR for more information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Onboarding</h1>
        <p className="text-gray-600 mt-1">Track your onboarding progress</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Onboarding Progress</h2>
          <StatusBadge status={myOnboarding.status} />
        </div>

        <div className="mb-2 flex justify-between text-sm">
          <span className="font-medium text-gray-700">Overall Progress</span>
          <span className="font-semibold text-indigo-600">
            {myOnboarding.progress || 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${myOnboarding.progress || 0}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-gray-600">Joining Date</p>
            <p className="text-lg font-semibold text-gray-900">
              {myOnboarding.joiningDate ? new Date(myOnboarding.joiningDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          {myOnboarding.buddy && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-sm text-gray-600">Your Buddy</p>
              <p className="text-lg font-semibold text-gray-900">
                {myOnboarding.buddy.firstName} {myOnboarding.buddy.lastName}
              </p>
              <p className="text-xs text-gray-500 mt-1">{myOnboarding.buddy.email}</p>
            </div>
          )}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-600">Manager</p>
            <p className="text-lg font-semibold text-gray-900">
              {myOnboarding.manager?.firstName} {myOnboarding.manager?.lastName}
            </p>
            <p className="text-xs text-gray-500 mt-1">{myOnboarding.manager?.email}</p>
          </div>
        </div>
      </div>

      {/* Tasks Checklist */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Your Tasks</h2>
        <div className="space-y-3">
          {myOnboarding.tasks && Array.isArray(myOnboarding.tasks) && myOnboarding.tasks
            .filter((task) => task.assignedTo === "Employee")
            .map((task) => (
              <TaskItem 
                key={task._id} 
                task={task} 
                onToggle={() => onTaskToggle(myOnboarding._id, task._id, task.completed)}
              />
            ))}
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChecklistSection
          title="Pre-boarding"
          items={myOnboarding.preboarding}
        />
        <ChecklistSection
          title="IT Setup"
          items={myOnboarding.itSetup}
        />
        <ChecklistSection
          title="HR Setup"
          items={myOnboarding.hrSetup}
        />
        <ChecklistSection
          title="Training & Orientation"
          items={myOnboarding.training}
        />
      </div>
    </div>
  );
};

// Helper Components (keep the same as before)
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
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

const StatusBadge = ({ status }) => {
  const statusConfig = {
    "Pending": { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
    "In Progress": { color: "bg-blue-100 text-blue-800", label: "In Progress" },
    "Completed": { color: "bg-green-100 text-green-800", label: "Completed" }
  };

  const config = statusConfig[status] || statusConfig.Pending;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

const TaskItem = ({ task, onToggle }) => (
  <div
    className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
      task.completed
        ? "bg-green-50 border-green-200"
        : "bg-white border-gray-200 hover:border-gray-300"
    }`}
  >
    <input
      type="checkbox"
      checked={task.completed}
      onChange={onToggle}
      className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
    />
    <div className="flex-1">
      <h3
        className={`font-medium ${
          task.completed
            ? "line-through text-gray-500"
            : "text-gray-900"
        }`}
      >
        {task.title}
      </h3>
      {task.description && (
        <p className="text-sm text-gray-600 mt-1">
          {task.description}
        </p>
      )}
      <div className="flex items-center space-x-4 mt-2">
        <span className="text-xs text-gray-500">
          Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
        </span>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            task.priority === "High"
              ? "bg-red-100 text-red-800"
              : task.priority === "Medium"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {task.priority}
        </span>
        {task.completed && task.completedAt && (
          <span className="text-xs text-green-600">
            Completed: {new Date(task.completedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  </div>
);

const ChecklistSection = ({ title, items }) => {
  const itemEntries = Object.entries(items || {});

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {itemEntries.map(([key, value]) => (
          <label
            key={key}
            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <input
              type="checkbox"
              checked={value}
              readOnly
              className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
            />
            <span
              className={`text-sm ${
                value ? "text-gray-500 line-through" : "text-gray-900"
              }`}
            >
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())
                .replace(/([A-Z])/g, " $1")
                .trim()}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

const OnboardingExpandedView = ({ onboarding, onTaskToggle }) => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Tasks Breakdown</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">Employee Tasks</h5>
          <div className="space-y-2">
            {onboarding.tasks && Array.isArray(onboarding.tasks) && onboarding.tasks
              .filter(task => task.assignedTo === "Employee")
              .map(task => (
                <div key={task._id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onTaskToggle(onboarding._id, task._id, task.completed)}
                    className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className={task.completed ? "line-through text-gray-500" : "text-gray-900"}>
                    {task.title}
                  </span>
                </div>
              ))}
          </div>
        </div>
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-2">System Tasks</h5>
          <div className="space-y-2">
            {onboarding.tasks && Array.isArray(onboarding.tasks) && onboarding.tasks
              .filter(task => task.assignedTo !== "Employee")
              .map(task => (
                <div key={task._id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onTaskToggle(onboarding._id, task._id, task.completed)}
                    className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className={task.completed ? "line-through text-gray-500" : "text-gray-900"}>
                    {task.title} ({task.assignedTo})
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};


const CreateOnboardingModal = ({ onClose, onSuccess }) => {
  const { showSuccess, showError } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    joiningDate: "",
    buddy: "",
    manager: "",
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
      await apiService.createOnboarding(formData);
      showSuccess("Onboarding created successfully");
      onSuccess();
    } catch (error) {
      showError(error.message || "Failed to create onboarding");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Onboarding</h2>
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
              Joining Date
            </label>
            <input
              type="date"
              value={formData.joiningDate}
              onChange={(e) =>
                setFormData({ ...formData, joiningDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buddy (Optional)
            </label>
            <select
              value={formData.buddy}
              onChange={(e) =>
                setFormData({ ...formData, buddy: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Buddy</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Create
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

const OnboardingDetailsModal = ({ onboarding, onClose, onUpdate }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Onboarding Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
        {/* Add detailed onboarding view here */}
        <div className="space-y-4">
          <p>
            Employee: {onboarding.employee?.firstName}{" "}
            {onboarding.employee?.lastName}
          </p>
          <p>Status: {onboarding.status}</p>
          <p>Progress: {onboarding.progress}%</p>
          {/* Add more details as needed */}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
