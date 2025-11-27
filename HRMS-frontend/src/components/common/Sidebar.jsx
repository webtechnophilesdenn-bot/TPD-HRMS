import React from "react";
import {
  Home,
  Users,
  Clock,
  Calendar,
  DollarSign,
  UserPlus,
  Package,
  BookOpen,
  Megaphone,
  Award,
  FileText,
  Bot,
  UserCheck,
  UserX,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, onClose, activeMenu, setActiveMenu }) => {
  const { user } = useAuth();

  // Only these roles can see onboarding/offboarding
  const isAdminOrHR =
    user?.role === "admin" || user?.role === "hr" || user?.role === "manager";

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "employees", label: "Employees", icon: Users },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "leaves", label: "Leave Management", icon: Calendar },
    { id: "payroll", label: "Payroll", icon: DollarSign },
    { id: "recruitment", label: "Recruitment", icon: UserPlus },
    // Only show these if not a normal employee
    ...(isAdminOrHR
      ? [
          { id: "onboarding", label: "Onboarding", icon: UserCheck },
          { id: "offboarding", label: "Offboarding", icon: UserX },
        ]
      : []),
    { id: "assets", label: "Assets", icon: Package },
    { id: "training", label: "Training & LMS", icon: BookOpen },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "recognition", label: "Recognition", icon: Award },
    { id: "compliance", label: "Compliance & Policy", icon: Shield },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-20 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div className="h-full flex flex-col pt-4">
          <div className="px-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.employee?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user?.employee?.name || user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.employee?.employeeId || user?.employeeId || "EMP001"}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveMenu(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeMenu === item.id
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                setActiveMenu("chatbot");
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <Bot className="h-5 w-5" />
              <span className="font-medium">AI Assistant</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
