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
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-1.5 rounded-md text-gray-500 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Logo Section - Mobile Only */}
            <div className="flex-shrink-0 flex items-center lg:hidden">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-8 w-auto object-contain" 
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees, leaves, attendance..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell className="h-[18px] w-[18px]" />
              {notifications > 0 && (
                <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center border-2 border-white">
                  {notifications}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center ring-2 ring-indigo-100">
                  <span className="text-white font-semibold text-sm">
                    {user?.employee?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.employee?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role || "Employee"}
                  </p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                  {/* User Info */}
                  <div className="px-3 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.employee?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {user?.employee?.email || "user@company.com"}
                    </p>
                    <p className="text-xs text-indigo-600 font-medium mt-0.5">
                      {user?.employee?.employeeId || "EMP001"}
                    </p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-1">
                    <button className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="h-4 w-4 mr-2.5 text-gray-400" />
                      My Profile
                    </button>
                    <button className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="h-4 w-4 mr-2.5 text-gray-400" />
                      Settings
                    </button>
                  </div>
                  
                  {/* Logout */}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2.5" />
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