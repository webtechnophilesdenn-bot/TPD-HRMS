import React, { useState, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/apiService";

const Navbar = ({ onMenuClick, onProfileClick, onSettingsClick }) => {
  const { user, logout, refreshUser } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [employeeData, setEmployeeData] = useState(null);

  // Fetch fresh employee data on mount
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await apiService.getMyProfile();
        if (response.success) {
          setEmployeeData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch employee data:", error);
      }
    };

    if (user) {
      fetchEmployeeData();
    }
  }, [user]);

  // Listen for employee update events
  useEffect(() => {
    const handleEmployeeUpdate = async () => {
      try {
        const response = await apiService.getMyProfile();
        if (response.success) {
          setEmployeeData(response.data);
          if (refreshUser) {
            await refreshUser();
          }
        }
      } catch (error) {
        console.error("Failed to refresh employee data:", error);
      }
    };

    window.addEventListener("employeeUpdated", handleEmployeeUpdate);

    return () => {
      window.removeEventListener("employeeUpdated", handleEmployeeUpdate);
    };
  }, [refreshUser]);

  // Use fresh employee data if available, fallback to user context
  const displayName = employeeData
    ? `${employeeData.firstName} ${employeeData.lastName}`
    : user?.employee?.name || "User";

  const displayEmail =
    employeeData?.personalEmail || user?.employee?.email || "user@company.com";
  const displayEmployeeId =
    employeeData?.employeeId || user?.employee?.employeeId || "EMP001";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const handleProfileClick = () => {
    setShowProfile(false);
    if (onProfileClick) {
      onProfileClick();
    } else {
      window.location.href = "/profile";
    }
  };

  const handleSettingsClick = () => {
    setShowProfile(false);
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      window.location.href = "/settings";
    }
  };

  const handleLogout = () => {
    setShowProfile(false);
    logout();
    window.location.href = "/login";
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 fixed w-full z-40 top-0">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={onMenuClick}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Logo - Visible on all screens */}
              <div className="flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="HRMS Logo"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <div className="h-10 w-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg items-center justify-center hidden">
                  <span className="text-white text-lg font-bold">HRMS</span>
                </div>
              </div>
            </div>

            {/* Center - Search Bar */}
            <div className="hidden md:block flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees, leaves, attendance..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center border-2 border-white">
                    {notifications}
                  </span>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-blue-100">
                    <span className="text-white font-semibold text-sm">
                      {displayInitial}
                    </span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role || "Employee"}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${
                      showProfile ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {displayEmail}
                      </p>
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        {displayEmployeeId}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3 text-gray-400" />
                        My Profile
                      </button>
                      <button
                        onClick={handleSettingsClick}
                        className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                        Settings
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Click outside to close dropdown */}
      {showProfile && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowProfile(false)}
        />
      )}

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  );
};

export default Navbar;
