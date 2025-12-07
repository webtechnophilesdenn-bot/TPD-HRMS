import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  Star,
  TrendingUp,
  ThumbsUp,
  MessageCircle,
  Eye,
  Trophy,
  Gift,
  Target,
  Sparkles,
  Heart,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";

const RecognitionPage = () => {
  const { showSuccess, showError } = useNotification();
  const { user } = useAuth();

  const [recognitions, setRecognitions] = useState([]);
  const [myRecognitions, setMyRecognitions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showGiveRecognition, setShowGiveRecognition] = useState(false);

  const canGiveRecognition =
    user?.role && ["manager", "hr", "admin"].includes(user.role.toLowerCase());

  const [filters, setFilters] = useState({
    type: "",
    category: "",
    department: "",
    year: new Date().getFullYear(),
    search: "",
  });

  const [newRecognition, setNewRecognition] = useState({
    employee: "",
    type: "Spot Award",
    category: "Performance",
    title: "",
    description: "",
    points: 100,
    badge: "star-performer",
    rewards: {
      monetary: { amount: 0, currency: "INR" },
    },
    visibility: "Public",
  });

  // Recognition types and categories constants
  // Recognition types and categories constants - Match backend schema
  const RECOGNITION_TYPES = [
    "Spot Award",
    "Employee of the Month",
    "Employee of the Quarter",
    "Employee of the Year",
    "Star Performer",
    "Team Player",
    "Innovation Award",
    "Customer Champion",
    "Leadership Excellence",
    "Service Excellence",
    "Rising Star",
    "Mentor of the Month",
    "Safety Champion",
    "Quality Excellence",
    "Sales Achiever",
  ];

  const RECOGNITION_CATEGORIES = [
    "Performance",
    "Behavior",
    "Achievement",
    "Service",
    "Innovation",
    "Leadership",
  ];

  const BADGE_TYPES = [
    { value: "star-performer", label: "Star Performer" },
    { value: "team-player", label: "Team Player" },
    { value: "innovator", label: "Innovator" },
    { value: "leader", label: "Leader" },
    { value: "customer-champion", label: "Customer Champion" },
  ];

  useEffect(() => {
    loadRecognitions();
    loadMyRecognitions();
    loadAnalytics();
    loadEmployees();
  }, [filters, activeTab]);

  // Safe data extraction functions
  const extractArrayFromResponse = (response, possibleKeys = []) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;

    if (response.data) {
      if (Array.isArray(response.data)) return response.data;

      for (const key of possibleKeys) {
        if (response.data[key] && Array.isArray(response.data[key])) {
          return response.data[key];
        }
      }

      if (typeof response.data === "object") {
        return [response.data];
      }
    }

    for (const key of possibleKeys) {
      if (response[key] && Array.isArray(response[key])) {
        return response[key];
      }
    }

    if (typeof response === "object" && response !== null) {
      return [response];
    }

    return [];
  };

  const loadRecognitions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllRecognitions(filters);
      const recognitionsData = extractArrayFromResponse(response, [
        "recognitions",
        "data",
      ]);
      setRecognitions(recognitionsData);
    } catch (error) {
      console.error("Failed to load recognitions:", error);
      showError("Failed to load recognitions");
      setRecognitions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRecognitions = async () => {
    try {
      const response = await apiService.getMyRecognitions();
      const myRecognitionsData = extractArrayFromResponse(response, [
        "recognitions",
        "data",
      ]);
      setMyRecognitions(myRecognitionsData);
    } catch (error) {
      console.error("Failed to load my recognitions:", error);
      setMyRecognitions([]);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiService.getRecognitionAnalytics(filters);
      setAnalytics(response?.data || response || {});
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setAnalytics({});
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await apiService.getAllEmployees();
      const employeesData = extractArrayFromResponse(response, [
        "employees",
        "users",
        "data",
      ]);
      const safeEmployees = employeesData.map((emp) => ({
        _id: emp._id || emp.id || "",
        firstName: emp.firstName || emp.name || "Unknown",
        lastName: emp.lastName || "",
        // Extract the name property from objects, or use fallback
        department:
          typeof emp.department === "object"
            ? emp.department?.name || "General"
            : emp.department || "General",
        designation:
          typeof emp.designation === "object"
            ? emp.designation?.name || "Employee"
            : emp.designation || "Employee",
        profilePicture: emp.profilePicture || "",
      }));
      setEmployees(safeEmployees);
    } catch (error) {
      console.error("Failed to load employees:", error);
      setEmployees([]);
    }
  };

  const handleGiveRecognition = async (e) => {
    e.preventDefault();

    if (!newRecognition.employee) {
      showError("Please select an employee to recognize");
      return;
    }

    try {
      await apiService.giveRecognition(newRecognition);
      showSuccess("Recognition given successfully!");
      setShowGiveRecognition(false);
      resetRecognitionForm();
      loadRecognitions();
      loadMyRecognitions();
      loadAnalytics();
    } catch (error) {
      showError(error.message || "Failed to give recognition");
    }
  };

  const resetRecognitionForm = () => {
    setNewRecognition({
      employee: "",
      type: "Spot Award",
      category: "Performance",
      title: "",
      description: "",
      points: 100,
      badge: "star-performer",
      rewards: {
        monetary: { amount: 0, currency: "INR" },
      },
      visibility: "Public",
    });
  };

  const handleAddReaction = async (recognitionId, reactionType) => {
    try {
      await apiService.addReaction(recognitionId, reactionType);
      showSuccess("Reaction added!");
      loadRecognitions();
    } catch (error) {
      showError("Failed to add reaction");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      category: "",
      department: "",
      year: new Date().getFullYear(),
      search: "",
    });
  };

  // Safe data access functions
  const getEmployeeName = (employee) => {
    if (!employee) return "Unknown Employee";
    if (typeof employee === "string") return employee;
    return (
      `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||
      "Unknown Employee"
    );
  };

  const getEmployeeInitials = (employee) => {
    if (!employee) return "UU";
    if (typeof employee === "string") return "EE";
    const firstName = employee.firstName || "";
    const lastName = employee.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "EE";
  };

  const getEmployeeDepartment = (employee) => {
    if (!employee) return "Unknown Department";
    if (typeof employee === "string") return "General";
    return employee.department || "General";
  };

  const getBadgeIcon = (badge) => {
    const icons = {
      "star-performer": <Star className="h-5 w-5 text-yellow-500" />,
      "team-player": <Users className="h-5 w-5 text-blue-500" />,
      innovator: <Sparkles className="h-5 w-5 text-purple-500" />,
      leader: <Trophy className="h-5 w-5 text-orange-500" />,
      "customer-champion": <Heart className="h-5 w-5 text-red-500" />,
    };
    return icons[badge] || <Award className="h-5 w-5 text-gray-500" />;
  };

  const formatPoints = (points) => {
    if (!points) return "0";
    return points.toLocaleString();
  };

  const displayedRecognitions =
    activeTab === "my-recognitions" ? myRecognitions : recognitions;

  const filteredRecognitions = displayedRecognitions.filter((recognition) => {
    const searchLower = filters.search.toLowerCase();
    const employeeName = getEmployeeName(recognition.employee).toLowerCase();
    const description = (recognition.description || "").toLowerCase();
    const title = (recognition.title || "").toLowerCase();

    return (
      employeeName.includes(searchLower) ||
      description.includes(searchLower) ||
      title.includes(searchLower)
    );
  });

  // Safe analytics data extraction
  const safeOverview = analytics.overview || {};
  const safeTopEmployees = analytics.topEmployees || [];
  const safeByType = analytics.byType || [];
  const safeByCategory = analytics.byCategory || [];

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Employee Recognition
          </h1>
          <p className="text-gray-600 mt-1">
            Celebrate achievements and boost morale across your organization
          </p>
        </div>
        {canGiveRecognition && (
          <button
            onClick={() => setShowGiveRecognition(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Give Recognition</span>
          </button>
        )}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recognitions</p>
              <p className="text-2xl font-bold text-gray-900">
                {safeOverview.totalRecognitions || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Points Awarded</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPoints(safeOverview.totalPointsAwarded)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Performer</p>
              <p className="text-lg font-bold text-gray-900">
                {safeTopEmployees[0]
                  ? getEmployeeName(safeTopEmployees[0].employee)
                  : "--"}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(
                  (safeOverview.totalRecognitions / (employees.length || 1)) *
                    100
                ) || 0}
                %
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === "all"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All Recognitions
          </button>
          <button
            onClick={() => setActiveTab("my-recognitions")}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === "my-recognitions"
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Recognitions
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-3 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search recognitions..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {RECOGNITION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {RECOGNITION_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {filters.type || filters.category || filters.search ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Recognitions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecognitions.length > 0 ? (
          filteredRecognitions.map((recognition) => (
            <div
              key={recognition._id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">
                      {getEmployeeInitials(recognition.employee)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getEmployeeName(recognition.employee)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getEmployeeDepartment(recognition.employee)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getBadgeIcon(recognition.badge)}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                    {recognition.type || "Award"}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {recognition.category || "General"}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">
                  {recognition.title || "Recognition Award"}
                </h4>
                <p className="text-sm text-gray-600">
                  {recognition.description || "Great work!"}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleAddReaction(recognition._id, "like")}
                    className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span className="text-sm">
                      {recognition.reactions?.like || 0}
                    </span>
                  </button>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {recognition.comments?.length || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-yellow-600">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">
                    {recognition.points || 0} pts
                  </span>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Given by {getEmployeeName(recognition.givenBy)} •{" "}
                {new Date(recognition.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {activeTab === "my-recognitions"
                ? "You haven't received any recognitions yet."
                : "No recognitions match your filters."}
            </p>
          </div>
        )}
      </div>

      {/* Give Recognition Modal */}
      {showGiveRecognition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Give Recognition</h2>
              <button
                onClick={() => setShowGiveRecognition(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleGiveRecognition} className="space-y-3">
              {/* Employee Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Employee *
                </label>
                <select
                  value={newRecognition.employee}
                  onChange={(e) =>
                    setNewRecognition({
                      ...newRecognition,
                      employee: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Choose an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recognition Type *
                </label>
                <select
                  value={newRecognition.type}
                  onChange={(e) =>
                    setNewRecognition({
                      ...newRecognition,
                      type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {RECOGNITION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={newRecognition.category}
                  onChange={(e) =>
                    setNewRecognition({
                      ...newRecognition,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {RECOGNITION_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Badge */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge
                </label>
                <select
                  value={newRecognition.badge}
                  onChange={(e) =>
                    setNewRecognition({
                      ...newRecognition,
                      badge: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {BADGE_TYPES.map((badge) => (
                    <option key={badge.value} value={badge.value}>
                      {badge.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newRecognition.title}
                  onChange={(e) =>
                    setNewRecognition({
                      ...newRecognition,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Outstanding Performance"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newRecognition.description}
                  onChange={(e) =>
                    setNewRecognition({
                      ...newRecognition,
                      description: e.target.value,
                    })
                  }
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Describe why this employee deserves recognition..."
                  required
                />
              </div>

              {/* Points */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  value={newRecognition.points}
                  onChange={(e) =>
                    setNewRecognition({
                      ...newRecognition,
                      points: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  step="50"
                />
              </div>

              {/* Monetary Reward */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monetary Reward (Optional)
                </label>
                <div className="flex space-x-3">
                  <input
                    type="number"
                    value={newRecognition.rewards.monetary.amount}
                    onChange={(e) =>
                      setNewRecognition({
                        ...newRecognition,
                        rewards: {
                          ...newRecognition.rewards,
                          monetary: {
                            ...newRecognition.rewards.monetary,
                            amount: parseInt(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Amount"
                    min="0"
                  />
                  <select
                    value={newRecognition.rewards.monetary.currency}
                    onChange={(e) =>
                      setNewRecognition({
                        ...newRecognition,
                        rewards: {
                          ...newRecognition.rewards,
                          monetary: {
                            ...newRecognition.rewards.monetary,
                            currency: e.target.value,
                          },
                        },
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={newRecognition.visibility}
                  onChange={(e) =>
                    setNewRecognition({
                      ...newRecognition,
                      visibility: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                  <option value="Team">Team Only</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Give Recognition
                </button>
                <button
                  type="button"
                  onClick={() => setShowGiveRecognition(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecognitionPage;
