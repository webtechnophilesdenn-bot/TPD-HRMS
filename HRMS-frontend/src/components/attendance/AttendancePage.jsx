import React, { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Filter,
  Download,
  Upload,
} from "lucide-react";
import { useNotification } from "../../context/NotificationContext";
import { apiService } from "../../services/apiService";

const AttendancePage = () => {
  const { showSuccess, showError } = useNotification();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState({});
  const [showRegularizeModal, setShowRegularizeModal] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: "",
  });

  useEffect(() => {
    loadAttendance();
    loadTodayStatus();
  }, [filters.month, filters.year, filters.status]);

 // In your React component - Add debugging
const loadAttendance = async () => {
  try {
    const response = await apiService.getMyAttendance(
      filters.month,
      filters.year,
      null,
      null,
      filters.status
    );
    
    console.log("Raw attendance data:", response.data?.attendance);
    console.log("Raw summary data:", response.data?.summary);
    
    setAttendance(response.data?.attendance || []);
    setStats(response.data?.summary || {});
    setLoading(false);
  } catch (error) {
    showError("Failed to load attendance");
    setLoading(false);
  }
};

  const loadTodayStatus = async () => {
    try {
      const response = await apiService.getAttendanceStats();
      setTodayStatus(response.data?.today || {});
    } catch (error) {
      console.error("Failed to load today status");
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

            // Get device info
            const deviceInfo = navigator.userAgent;
            const ipAddress = await getIPAddress();

            await apiService.checkIn(location, ipAddress, deviceInfo);
            showSuccess("Checked in successfully!");
            loadAttendance();
            loadTodayStatus();
          },
          (error) => {
            // Fallback without location
            handleCheckInWithoutLocation();
          }
        );
      } else {
        handleCheckInWithoutLocation();
      }
    } catch (error) {
      showError(error.message || "Failed to check in");
    }
  };

  const handleCheckInWithoutLocation = async () => {
    const deviceInfo = navigator.userAgent;
    const ipAddress = await getIPAddress();

    await apiService.checkIn(
      { lat: 0, lng: 0, address: "Location not available" },
      ipAddress,
      deviceInfo
    );
    showSuccess("Checked in successfully!");
    loadAttendance();
    loadTodayStatus();
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
            loadAttendance();
            loadTodayStatus();
          },
          (error) => {
            // Fallback without location
            handleCheckOutWithoutLocation();
          }
        );
      } else {
        handleCheckOutWithoutLocation();
      }
    } catch (error) {
      showError(error.message || "Failed to check out");
    }
  };

  const handleCheckOutWithoutLocation = async () => {
    const deviceInfo = navigator.userAgent;
    const ipAddress = await getIPAddress();

    await apiService.checkOut(
      { lat: 0, lng: 0, address: "Location not available" },
      ipAddress,
      deviceInfo
    );
    showSuccess("Checked out successfully!");
    loadAttendance();
    loadTodayStatus();
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

  const handleRegularize = async (formData) => {
    try {
      await apiService.regularizeAttendance(formData);
      showSuccess("Regularization request submitted!");
      setShowRegularizeModal(false);
      loadAttendance();
    } catch (error) {
      showError(error.message || "Failed to submit regularization");
    }
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
      case "Holiday":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString("default", { month: "long" });
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Attendance Management
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowRegularizeModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Regularize</span>
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

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
            <p className="text-lg font-semibold">
              Status:{" "}
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
            </p>
            {todayStatus.workingHours > 0 && (
              <p className="text-blue-100">Hours: {todayStatus.workingHours}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {todayStatus.checkedIn ? "Already Checked In" : "Check In"}
                </span>
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!todayStatus.checkedIn || todayStatus.checkedOut}
                className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
              >
                <Clock className="h-5 w-5" />
                <span>
                  {todayStatus.checkedOut ? "Already Checked Out" : "Check Out"}
                </span>
              </button>
            </div>

            {todayStatus.isLate && todayStatus.checkedIn && (
              <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>You were {todayStatus.lateBy} minutes late today</span>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
            <span>
              {getMonthName(filters.month)} {filters.year} Summary
            </span>
            <Filter className="h-5 w-5 text-gray-400" />
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
                  ? stats.totalWorkingHours.toFixed(1)
                  : "0"}{" "}
                hrs
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-600">Overtime</span>
              <span className="text-lg font-bold text-purple-600">
                {stats.totalOvertime ? stats.totalOvertime.toFixed(1) : "0"} hrs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-4">
            <select
              value={filters.month}
              onChange={(e) =>
                setFilters({ ...filters, month: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>

            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
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
              <option value="Half-Day">Half Day</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={loadAttendance}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Attendance History */}
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
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Overtime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Remarks
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
                      <span className="ml-1 text-xs text-red-600">(Late)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.checkOut
                      ? new Date(record.checkOut).toLocaleTimeString()
                      : "-"}
                    {record.isEarlyCheckout && record.checkOut && (
                      <span className="ml-1 text-xs text-orange-600">
                        (Early)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.workingHours ? record.workingHours.toFixed(1) : "0"}{" "}
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
                      {record.isRegularized && " ⚡"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {record.remarks || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {attendance.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No attendance records found for the selected period.
              </p>
            </div>
          )}
        </div>
      </div>

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
              rows="3"
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
