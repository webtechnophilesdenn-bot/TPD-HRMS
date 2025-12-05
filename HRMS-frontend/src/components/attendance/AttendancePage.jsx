import React, { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  Download,
  RefreshCw,
  AlertCircle,
  Search,
  Building,
  TrendingUp,
  BarChart3,
  ArrowRight,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { apiService } from "../../services/apiService";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";

const AttendancePage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const userRole =
    user?.role === "admin" || user?.role === "hr" ? "admin" : "employee";
  const [activeTab, setActiveTab] = useState("myAttendance");
  const [activeView, setActiveView] = useState("summary"); // 'summary' or 'detail'
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState("");

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [stats, setStats] = useState({});
  const [todayStatus, setTodayStatus] = useState({});
  const [showRegularizeModal, setShowRegularizeModal] = useState(false);

  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: "",
    search: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadData();
  }, [filters.month, filters.year, filters.date, activeTab, activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "myAttendance" || userRole === "employee") {
        await loadMyAttendance();
        await loadTodayStatus();
      } else if (activeTab === "departments") {
        if (activeView === "summary") {
          await loadDepartmentSummary();
        } else if (selectedDepartment) {
          await loadDepartmentDetail(selectedDepartment);
        }
      } else if (activeTab === "teamAttendance") {
        await loadTeamAttendance();
      }
    } catch (error) {
      showError("Failed to load data");
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyAttendance = async () => {
    try {
      const response = await apiService.getMyAttendance(
        filters.month,
        filters.year,
        null,
        null,
        filters.status
      );
      setAttendance(response.data?.attendance || []);
      setStats(response.data?.summary || {});
    } catch (error) {
      console.error("Failed to load my attendance:", error);
      setAttendance([]);
      setStats({});
    }
  };

  const loadTeamAttendance = async () => {
    try {
      const response = await apiService.getTeamAttendance(
        filters.month,
        filters.year,
        null,
        filters.search,
        filters.status
      );
      setAttendance(response.data?.attendance || []);
      setStats(response.data?.summary || {});
    } catch (error) {
      console.error("Failed to load team attendance:", error);
      setAttendance([]);
      setStats({});
    }
  };

  const loadDepartmentSummary = async () => {
    try {
      const response = await apiService.getDepartmentAttendanceSummary(
        filters.date,
        filters.month,
        filters.year
      );
      setDepartmentStats(response.data?.departments || []);
    } catch (error) {
      console.error("Failed to load department summary:", error);
      setDepartmentStats([]);
    }
  };

  const loadDepartmentDetail = async (deptId) => {
    try {
      const response = await apiService.getDepartmentAttendanceDetail(deptId, {
        date: filters.date,
        month: filters.month,
        year: filters.year,
        status: filters.status,
      });
      setAttendance(response.data?.attendance || []);
      setStats(response.data?.summary || {});
    } catch (error) {
      console.error("Failed to load department detail:", error);
      setAttendance([]);
      setStats({});
    }
  };

  const loadTodayStatus = async () => {
    try {
      const response = await apiService.getAttendanceStats();
      setTodayStatus(response.data?.today || {});
    } catch (error) {
      console.error("Failed to load today status:", error);
      setTodayStatus({});
    }
  };

  const getIPAddress = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return "Unknown";
    }
  };

  const handleCheckIn = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: "Captured via GPS",
            };
            const deviceInfo = navigator.userAgent;
            const ipAddress = await getIPAddress();
            await apiService.checkIn(location, ipAddress, deviceInfo);
            showSuccess("Checked in successfully!");
            loadData();
          },
          async (error) => {
            const deviceInfo = navigator.userAgent;
            const ipAddress = await getIPAddress();
            await apiService.checkIn(
              { lat: 0, lng: 0, address: "Location not available" },
              ipAddress,
              deviceInfo
            );
            showSuccess("Checked in successfully!");
            loadData();
          }
        );
      }
    } catch (error) {
      showError(error.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: "Captured via GPS",
            };
            const deviceInfo = navigator.userAgent;
            const ipAddress = await getIPAddress();
            await apiService.checkOut(location, ipAddress, deviceInfo);
            showSuccess("Checked out successfully!");
            loadData();
          },
          async (error) => {
            const deviceInfo = navigator.userAgent;
            const ipAddress = await getIPAddress();
            await apiService.checkOut(
              { lat: 0, lng: 0, address: "Location not available" },
              ipAddress,
              deviceInfo
            );
            showSuccess("Checked out successfully!");
            loadData();
          }
        );
      }
    } catch (error) {
      showError(error.message || "Failed to check out");
    }
  };

  const handleRegularize = async (formData) => {
    try {
      await apiService.regularizeAttendance(formData);
      showSuccess("Regularization request submitted!");
      setShowRegularizeModal(false);
      loadData();
    } catch (error) {
      showError(error.message || "Failed to submit regularization");
    }
  };

  const handleDepartmentClick = (dept) => {
    setSelectedDepartment(dept.departmentId);
    setSelectedDepartmentName(dept.departmentName);
    setActiveView("detail");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800";
      case "Absent":
        return "bg-red-100 text-red-800";
      case "Half-Day":
        return "bg-yellow-100 text-yellow-800";
      case "On Leave":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMonthName = (monthNumber) => {
    return new Date(2000, monthNumber - 1).toLocaleString("default", {
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Attendance Management
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === "admin"
              ? "Manage team attendance"
              : "Track your attendance"}
          </p>
        </div>
        <div className="flex space-x-3">
          {(activeTab === "myAttendance" || userRole === "employee") && (
            <button
              onClick={() => setShowRegularizeModal(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Regularize</span>
            </button>
          )}
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      {userRole === "admin" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setActiveTab("myAttendance");
                setActiveView("summary");
              }}
              className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                activeTab === "myAttendance"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>My Attendance</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("departments");
                setActiveView("summary");
                setSelectedDepartment(null);
              }}
              className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                activeTab === "departments"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Building className="h-5 w-5" />
              <span>Departments</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("teamAttendance");
                setActiveView("summary");
              }}
              className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                activeTab === "teamAttendance"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Users className="h-5 w-5" />
              <span>All Employees</span>
            </button>
          </div>
        </div>
      )}

      {/* Department Summary View */}
      {activeTab === "departments" && activeView === "summary" && (
        <>
          {/* Date Filter for Departments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters({ ...filters, date: e.target.value })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={loadData}
                className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Department Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentStats.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No department data found</p>
              </div>
            ) : (
              departmentStats.map((dept) => (
                <div
                  key={dept.departmentId}
                  onClick={() => handleDepartmentClick(dept)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <Building className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {dept.departmentName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {dept.departmentCode}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Employees
                      </span>
                      <span className="font-semibold">
                        {dept.totalEmployees}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Present</span>
                      <span className="font-semibold text-green-600">
                        {dept.present}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Absent</span>
                      <span className="font-semibold text-red-600">
                        {dept.absent}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">On Leave</span>
                      <span className="font-semibold text-blue-600">
                        {dept.onLeave}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Late Arrivals
                      </span>
                      <span className="font-semibold text-orange-600">
                        {dept.late}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                          Attendance Rate
                        </span>
                        <span className="text-lg font-bold text-indigo-600">
                          {dept.attendanceRate || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all"
                          style={{ width: `${dept.attendanceRate || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Avg Working Hours</span>
                        <span className="font-semibold text-purple-600">
                          {dept.avgWorkingHours || 0} hrs
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-gray-600">Total Overtime</span>
                        <span className="font-semibold text-teal-600">
                          {dept.totalOvertime || 0} hrs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Department Detail View */}
      {activeTab === "departments" &&
        activeView === "detail" &&
        selectedDepartment && (
          <>
            <button
              onClick={() => {
                setActiveView("summary");
                setSelectedDepartment(null);
              }}
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-2"
            >
              <ArrowRight className="h-4 w-4 transform rotate-180" />
              <span>Back to Departments</span>
            </button>

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedDepartmentName}
                  </h2>
                  <p className="text-indigo-100 mt-1">
                    Department Attendance Overview
                  </p>
                </div>
                <Building className="h-12 w-12 text-white opacity-50" />
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) =>
                      setFilters({ ...filters, date: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Half-Day">Half Day</option>
                  </select>
                </div>
                <button
                  onClick={loadData}
                  className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Apply</span>
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">Present</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.present || 0}
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-gray-600">Absent</span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {stats.absent || 0}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">On Leave</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.onLeave || 0}
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-gray-600">Late</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.late || 0}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-600">Avg Hours</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.avgWorkingHours || 0}
                </p>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">
                Employee Attendance
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Check In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Check Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {attendance.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.employee?.employeeId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.employee?.firstName}{" "}
                          {record.employee?.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.employee?.designation?.title || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.checkIn
                            ? new Date(record.checkIn).toLocaleTimeString()
                            : "-"}
                          {record.isLate && record.checkIn && (
                            <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Late
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.checkOut
                            ? new Date(record.checkOut).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.workingHours
                            ? record.workingHours.toFixed(1)
                            : "0"}{" "}
                          hrs
                          {record.overtime > 0 && (
                            <span className="ml-2 text-xs text-purple-600">
                              +{record.overtime.toFixed(1)} OT
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                              record.status
                            )}`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {attendance.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No attendance records found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

      {/* My Attendance View */}
      {(activeTab === "myAttendance" || userRole === "employee") && (
        <>
          {/* Today's Status Card */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Today's Attendance</h2>
                <p className="text-blue-100 mt-1">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">Status</p>
                <span
                  className={
                    todayStatus.checkedIn ? "text-green-300" : "text-red-300"
                  }
                >
                  {todayStatus.checkedIn
                    ? todayStatus.checkedOut
                      ? "Completed"
                      : "Checked In"
                    : "Not Checked In"}
                </span>
                {todayStatus.workingHours > 0 && (
                  <p className="text-blue-100 mt-1">
                    {todayStatus.workingHours} Hours
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & Monthly Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mark Attendance Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Mark Attendance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Current Time
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {todayStatus.isLate && (
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                      Late
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleCheckIn}
                    disabled={todayStatus.checkedIn}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
                  >
                    <Clock className="h-5 w-5" />
                    <span>
                      {todayStatus.checkedIn ? "Checked In" : "Check In"}
                    </span>
                  </button>
                  <button
                    onClick={handleCheckOut}
                    disabled={!todayStatus.checkedIn || todayStatus.checkedOut}
                    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
                  >
                    <Clock className="h-5 w-5" />
                    <span>
                      {todayStatus.checkedOut ? "Checked Out" : "Check Out"}
                    </span>
                  </button>
                </div>

                {todayStatus.isLate && todayStatus.checkedIn && (
                  <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                    <AlertCircle className="h-4 w-4" />
                    <span>You were late by {todayStatus.lateBy} minutes</span>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">
                {getMonthName(filters.month)} {filters.year} Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-600">Present Days</span>
                  <span className="text-lg font-bold text-green-600">
                    {stats.present || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-600">Absent Days</span>
                  <span className="text-lg font-bold text-red-600">
                    {stats.absent || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-gray-600">Half Days</span>
                  <span className="text-lg font-bold text-yellow-600">
                    {stats.halfDay || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm text-gray-600">Late Arrivals</span>
                  <span className="text-lg font-bold text-orange-600">
                    {stats.late || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Hours</span>
                  <span className="text-lg font-bold text-blue-600">
                    {stats.totalWorkingHours
                      ? Number(stats.totalWorkingHours).toFixed(1)
                      : "0.0"}{" "}
                    hrs
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-600">Overtime</span>
                  <span className="text-lg font-bold text-purple-600">
                    {stats.totalOvertime
                      ? Number(stats.totalOvertime).toFixed(1)
                      : "0.0"}{" "}
                    hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={filters.month}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        month: parseInt(e.target.value),
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) =>
                      setFilters({ ...filters, year: parseInt(e.target.value) })
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Half-Day">Half Day</option>
                  </select>
                </div>
              </div>
              <button
                onClick={loadData}
                className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Attendance History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Working Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Overtime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.checkIn
                          ? new Date(record.checkIn).toLocaleTimeString()
                          : "-"}
                        {record.isLate && record.checkIn && (
                          <span className="ml-2 text-xs text-red-600">
                            Late ({record.lateBy} min)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleTimeString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.workingHours
                          ? Number(record.workingHours).toFixed(1)
                          : "0.0"}{" "}
                        hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.overtime ? record.overtime.toFixed(1) : "0"} hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                        {record.isRegularized && (
                          <span className="ml-2 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                            Regularized
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {attendance.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No attendance records found.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Team Attendance View (All Employees) */}
      {activeTab === "teamAttendance" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Month
                  </label>
                  <select
                    value={filters.month}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        month: parseInt(e.target.value),
                      })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) =>
                      setFilters({ ...filters, year: parseInt(e.target.value) })
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Half-Day">Half Day</option>
                  </select>
                </div>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalRecords || 0}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.present || 0}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.absent || 0}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Late</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {stats.lateCount || 0}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Avg Hours</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {stats.averageWorkingHours
                  ? stats.averageWorkingHours.toFixed(1)
                  : 0}
              </p>
            </div>
          </div>

          {/* Team Attendance Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Team Attendance</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Overtime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.employee?.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.employee?.firstName} {record.employee?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.employee?.department?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.checkIn
                          ? new Date(record.checkIn).toLocaleTimeString()
                          : "-"}
                        {record.isLate && record.checkIn && (
                          <span className="ml-1 text-xs text-red-600">
                            Late
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleTimeString()
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.workingHours
                          ? record.workingHours.toFixed(1)
                          : "0"}{" "}
                        hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.overtime
                          ? Number(record.overtime).toFixed(1)
                          : "0.0"}{" "}
                        hrs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {attendance.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No attendance records found.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Regularize Modal */}
      {showRegularizeModal && (
        <RegularizeModal
          onClose={() => setShowRegularizeModal(false)}
          onSubmit={handleRegularize}
        />
      )}
    </div>
  );
};

// Regularize Modal Component
const RegularizeModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    checkIn: "09:30",
    checkOut: "18:30",
    reason: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Regularize Attendance</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check In
              </label>
              <input
                type="time"
                value={formData.checkIn}
                onChange={(e) =>
                  setFormData({ ...formData, checkIn: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check Out
              </label>
              <input
                type="time"
                value={formData.checkOut}
                onChange={(e) =>
                  setFormData({ ...formData, checkOut: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
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
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Please provide reason for regularization..."
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendancePage;
