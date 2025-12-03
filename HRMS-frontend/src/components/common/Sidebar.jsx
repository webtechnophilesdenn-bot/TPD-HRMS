// src/components/common/Sidebar.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSignature,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ isOpen, onClose, activeMenu, setActiveMenu }) => {
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState({
    hrManagement: true,
    employeeServices: true,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);

  const MIN_WIDTH = 74;
  const MAX_WIDTH = 400;
  const DEFAULT_WIDTH = 256;

  const isAdminOrHR =
    user?.role === "admin" || user?.role === "hr" || user?.role === "manager";

  const toggleSection = (section) => {
    if (!isCollapsed) {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setSidebarWidth(isCollapsed ? DEFAULT_WIDTH : MIN_WIDTH);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing.current) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
        setIsCollapsed(newWidth <= 80);
      }
    },
    [MIN_WIDTH, MAX_WIDTH]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${sidebarWidth}px`
    );
  }, [sidebarWidth]);

  const menuStructure = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      standalone: true,
    },
    {
      section: "HR Management",
      key: "hrManagement",
      items: [
        { id: "employees", label: "Employees", icon: Users },
        { id: "attendance", label: "Attendance", icon: Clock },
        { id: "leaves", label: "Leave Management", icon: Calendar },
        { id: "payroll", label: "Payroll", icon: DollarSign },
        { id: "recruitment", label: "Recruitment", icon: UserPlus },
        { id: "events", label: "Events Calendar", icon: Calendar },
        ...(isAdminOrHR
          ? [
              { id: "onboarding", label: "Onboarding", icon: UserCheck },
              { id: "offboarding", label: "Offboarding", icon: UserX },
            ]
          : []),
      ],
    },
    {
      section: "Employee Services",
      key: "employeeServices",
      items: [
        { id: "assets", label: "Assets", icon: Package },
        { id: "training", label: "Training & LMS", icon: BookOpen },
        { id: "recognition", label: "Recognition", icon: Award },
      ],
    },
    {
      section: "Communication",
      key: "communication",
      items: [{ id: "announcements", label: "Announcements", icon: Megaphone }],
    },
    {
      section: "Administration",
      key: "administration",
      items: [
        { id: "compliance", label: "Compliance & Policy", icon: Shield },
        ...(isAdminOrHR
          ? [{ id: "reports", label: "Reports", icon: FileText }]
          : []),
        { id: "contracts", label: "Legal & Contracts", icon: FileSignature },
      ],
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px` }}
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="Company Logo" 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg items-center justify-center hidden">
                <span className="text-white text-base font-bold">HR</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain mx-auto"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg items-center justify-center mx-auto hidden">
              <span className="text-white text-base font-bold">HR</span>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className={`p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-700 ${isCollapsed ? 'absolute right-2 top-4' : ''}`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* User Profile */}
        <div
          className={`px-4 py-3 border-b border-gray-200 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? "" : "space-x-3"}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ring-2 ring-indigo-100">
              {user?.employee?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.employee?.name || user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.employee?.employeeId || user?.employeeId || "EMP001"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="space-y-1">
            {menuStructure.map((group) => {
              if (group.standalone) {
                const Icon = group.icon;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveMenu(group.id);
                      onClose();
                    }}
                    className={`w-full flex items-center ${
                      isCollapsed ? "justify-center px-2" : "space-x-2.5 px-3"
                    } py-2 rounded-lg text-sm font-medium transition-all ${
                      activeMenu === group.id
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    title={isCollapsed ? group.label : ""}
                  >
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!isCollapsed && <span>{group.label}</span>}
                  </button>
                );
              }

              const isExpanded = expandedSections[group.key];
              const ExpandIcon = isExpanded ? ChevronDown : ChevronRight;

              return (
                <div key={group.key} className="py-1">
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(group.key)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      <span>{group.section}</span>
                      <ExpandIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isCollapsed && (
                    <div className="h-px bg-gray-200 mx-2 my-1.5" />
                  )}

                  {(isExpanded || isCollapsed) && (
                    <div className={`${isCollapsed ? "" : "mt-0.5"} space-y-0.5`}>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveMenu(item.id);
                              onClose();
                            }}
                            className={`w-full flex items-center ${
                              isCollapsed ? "justify-center px-2" : "space-x-2.5 px-3"
                            } py-2 rounded-lg text-sm font-medium transition-all ${
                              activeMenu === item.id
                                ? "bg-indigo-50 text-indigo-600"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                            title={isCollapsed ? item.label : ""}
                          >
                            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* AI Assistant Button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => {
              setActiveMenu("chatbot");
              onClose();
            }}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center px-2" : "justify-center space-x-2 px-3"
            } py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm font-medium text-sm`}
            title={isCollapsed ? "AI Assistant" : ""}
          >
            <Bot className="w-[18px] h-[18px]" />
            {!isCollapsed && <span>AI Assistant</span>}
          </button>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-indigo-500 transition-colors group"
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gray-300 rounded-full group-hover:bg-indigo-500 transition-colors" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;