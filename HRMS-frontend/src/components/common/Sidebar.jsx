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
  Video,
  Receipt,
  Cake,
  CalendarDays,
  CheckCircle, // ✅ NEW - For Expense Approval
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiService } from "../../services/apiService";

const Sidebar = ({ isOpen, onClose, activeMenu, setActiveMenu }) => {
  const { user, refreshUser } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    hrManagement: true,
    employeeServices: true,
    financial: true, // ✅ NEW - Financial section
    communication: true,
    administration: true,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const sidebarRef = useRef(null);
  const isResizing = useRef(false);

  const MIN_WIDTH = 70;
  const MAX_WIDTH = 400;
  const DEFAULT_WIDTH = 240;

  const isAdminOrHR =
    user?.role === "admin" || user?.role === "hr" || user?.role === "manager";

  // Fetch employee data for display
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

  const displayName = employeeData
    ? `${employeeData.firstName} ${employeeData.lastName}`
    : user?.employee?.name || "User";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayRole = user?.role || "Employee";

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

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current) return;

    const newWidth = e.clientX;
    if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
      setSidebarWidth(newWidth);
      setIsCollapsed(newWidth <= 80);
    }
  }, []);

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
      section: "HR MANAGEMENT",
      key: "hrManagement",
      items: [
        {
          id: "employees",
          label: isAdminOrHR ? "Employees" : "My Info",
          icon: Users,
        },
        {
          id: "attendance",
          label: "Attendance",
          icon: Clock,
        },
        {
          id: "leaves",
          label: "Leave Management",
          icon: Calendar,
        },
        {
          id: "recruitment",
          label: "Recruitment",
          icon: UserPlus,
        },
        {
          id: "events",
          label: "Events Calendar",
          icon: CalendarDays,
        },
        {
          id: "meetings",
          label: "Meetings",
          icon: Video,
        },
        ...(isAdminOrHR
          ? [
              {
                id: "onboarding",
                label: "Onboarding",
                icon: UserCheck,
              },
              {
                id: "offboarding",
                label: "Offboarding",
                icon: UserX,
              },
            ]
          : []),
      ],
    },
    // ==================== ✅ NEW: FINANCIAL SECTION ====================
    {
      section: "FINANCIAL",
      key: "financial",
      items: [
        {
          id: "payroll",
          label: "Payroll",
          icon: DollarSign,
        },
        {
          id: "expenses",
          label: "My Expenses",
          icon: Receipt,
        },
        // ✅ Expense Approval - Only for HR/Admin
        ...(isAdminOrHR
          ? [
              {
                id: "expense-approval",
                label: "Expense Approval",
                icon: CheckCircle,
              },
            ]
          : []),
      ],
    },
    // ==================== END FINANCIAL SECTION ====================
    {
      section: "EMPLOYEE SERVICES",
      key: "employeeServices",
      items: [
        {
          id: "assets",
          label: "Assets",
          icon: Package,
        },
        {
          id: "training",
          label: "Training & LMS",
          icon: BookOpen,
        },
        {
          id: "recognition",
          label: "Recognition",
          icon: Award,
        },
      ],
    },
    {
      section: "COMMUNICATION",
      key: "communication",
      items: [
        {
          id: "announcements",
          label: "Announcements",
          icon: Megaphone,
        },
        {
          id: "birthdays",
          label: "Birthdays",
          icon: Cake,
        },
      ],
    },
    {
      section: "ADMINISTRATION",
      key: "administration",
      items: [
        {
          id: "compliance",
          label: "Compliance & Policy",
          icon: Shield,
        },
        ...(isAdminOrHR
          ? [
              {
                id: "reports",
                label: "Reports",
                icon: FileText,
              },
            ]
          : []),
        {
          id: "contracts",
          label: "Legal & Contracts",
          icon: FileSignature,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        style={{
          width: `${sidebarWidth}px`,
          top: "64px",
          height: "calc(100vh - 64px)",
        }}
        className={`fixed left-0 bg-white border-r border-gray-200 z-40 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* User Profile Section with Collapse Button */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base ring-2 ring-blue-100 flex-shrink-0">
                {displayInitial}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {displayRole}
                  </p>
                </div>
              )}
            </div>
            {/* Collapse Button */}
            <button
              onClick={toggleCollapse}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronsRight className="w-5 h-5" />
              ) : (
                <ChevronsLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
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
                      isCollapsed ? "justify-center px-2" : "space-x-3 px-3"
                    } py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeMenu === group.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    title={isCollapsed ? group.label : ""}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{group.label}</span>}
                  </button>
                );
              }

              const isExpanded = expandedSections[group.key];
              const ExpandIcon = isExpanded ? ChevronDown : ChevronRight;

              return (
                <div key={group.key} className="py-2">
                  {!isCollapsed && (
                    <button
                      onClick={() => toggleSection(group.key)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
                    >
                      <span>{group.section}</span>
                      <ExpandIcon className="w-4 h-4" />
                    </button>
                  )}
                  {isCollapsed && (
                    <div className="h-px bg-gray-200 mx-3 my-2" />
                  )}
                  {(isExpanded || isCollapsed) && (
                    <div className="space-y-1 mt-1">
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
                              isCollapsed
                                ? "justify-center px-2"
                                : "space-x-3 px-3"
                            } py-2.5 rounded-lg text-sm font-medium transition-all ${
                              activeMenu === item.id
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                            title={isCollapsed ? item.label : ""}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
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
              isCollapsed
                ? "justify-center px-2"
                : "justify-center space-x-2 px-3"
            } py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md font-medium text-sm`}
            title={isCollapsed ? "AI Assistant" : ""}
          >
            <Bot className="w-5 h-5" />
            {!isCollapsed && <span>AI Assistant</span>}
          </button>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors group"
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
