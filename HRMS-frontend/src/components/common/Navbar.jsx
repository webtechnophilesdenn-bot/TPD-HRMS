import React, { useState } from "react";
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

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(3);

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-200 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Logo Section - Keeping the img */}
            <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo.png" 
                  alt="HRMS Pro Logo" 
                  className="h-12 w-auto object-contain" 
                />
                
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search employees, leaves, attendance..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 hover:bg-white"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 group">
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                  {notifications}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-200 group"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                  <span className="text-white font-medium text-sm">
                    {user?.employee?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors duration-200">
                    {user?.employee?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-indigo-500 transition-colors duration-200">
                    {user?.role || "Employee"}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 border border-gray-200 backdrop-blur-sm bg-white/95 z-40">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.employee?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {user?.employee?.email || "user@company.com"}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium mt-1">
                      ID: {user?.employee?.employeeId || "EMP001"}
                    </p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <button className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150">
                      <User className="h-4 w-4 mr-3 text-gray-400" />
                      My Profile
                    </button>
                    <button className="w-full text-left flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150">
                      <Settings className="h-4 w-4 mr-3 text-gray-400" />
                      Account Settings
                    </button>
                  </div>
                  
                  {/* Logout */}
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
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

      {/* Click outside to close dropdown */}
      {showProfile && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowProfile(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;