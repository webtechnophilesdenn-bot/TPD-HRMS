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

  // ✅ Wrapped in useCallback to fix ESLint warning
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
  }, [handleMouseMove, handleMouseUp]); // ✅ Fixed dependencies

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
        { id: "events", label: "Events Calendar", icon: Calendar }, // ✅ Using Calendar icon
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
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px` }}
        className={`fixed top-16 left-0 bottom-0 bg-white border-r border-gray-200 z-10 transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col relative">
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-6 z-20 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>

          <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200">
            <div
              className={`flex items-center ${
                isCollapsed ? "justify-center" : "space-x-3"
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium">
                  {user?.employee?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
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

          <nav
            className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-1"
            style={{ overscrollBehavior: "contain" }}
          >
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
                      isCollapsed ? "justify-center" : "space-x-3"
                    } px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeMenu === group.id
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    title={isCollapsed ? group.label : ""}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{group.label}</span>
                    )}
                  </button>
                );
              }

              const isExpanded = expandedSections[group.key];
              const ExpandIcon = isExpanded ? ChevronDown : ChevronRight;

              return (
                <div key={group.key} className="space-y-1">
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(group.key)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      <span className="truncate">{group.section}</span>
                      <ExpandIcon className="h-4 w-4 flex-shrink-0" />
                    </button>
                  )}

                  {isCollapsed && (
                    <div className="border-t border-gray-200 my-2"></div>
                  )}

                  {(isExpanded || isCollapsed) && (
                    <div className="space-y-1">
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
                              isCollapsed ? "justify-center" : "space-x-3"
                            } px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                              activeMenu === item.id
                                ? "bg-indigo-50 text-indigo-600"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                            title={isCollapsed ? item.label : ""}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <button
              onClick={() => {
                setActiveMenu("chatbot");
                onClose();
              }}
              className={`w-full flex items-center ${
                isCollapsed
                  ? "justify-center px-3"
                  : "justify-center space-x-2 px-4"
              } py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm`}
              title={isCollapsed ? "AI Assistant" : ""}
            >
              <Bot className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">AI Assistant</span>
              )}
            </button>
          </div>

          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize hover:bg-indigo-400 transition-colors group"
          >
            <div className="absolute inset-y-0 -right-1 w-3 opacity-0 group-hover:opacity-100"></div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
