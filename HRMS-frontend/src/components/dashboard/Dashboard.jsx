// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  CheckCircle,
  Calendar,
  AlertCircle,
  Clock,
  FileText,
  BookOpen,
  Shield,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Eye,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";
import PAYROLL_API from "../../services/payrollAPI";
import StatCard from "../common/StatCard";
import QuickActionCard from "../common/QuickActionCard";

// Chart components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    pendingLeaves: 0,
  });
  const [complianceStats, setComplianceStats] = useState(null);
  const [payrollStats, setPayrollStats] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "hr";

  // Professional color palette
  const colors = {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      console.log("📊 Loading dashboard data...");

      // Load general dashboard stats
      const response = await apiService.getDashboardStats();
      console.log("✅ Dashboard stats response:", response);

      const dashboardData = response.data || response;

      const extractedStats = {
        totalEmployees: dashboardData.totalEmployees || dashboardData.employees || 0,
        presentToday: dashboardData.presentToday || dashboardData.present || 0,
        onLeave: dashboardData.onLeave || dashboardData.leave || 0,
        pendingLeaves: dashboardData.pendingLeaves || dashboardData.pendingApprovals || 0,
      };

      console.log("📈 Extracted stats:", extractedStats);
      setStats(extractedStats);

      // Load additional data for charts
      if (isAdmin) {
        try {
          // Load attendance trends
          const attendanceResponse = await apiService.getAttendanceReport(
            new Date().getMonth() + 1,
            new Date().getFullYear()
          );
          setAttendanceData(attendanceResponse.data || attendanceResponse);

          // Load department stats - with proper error handling
          try {
            const deptResponse = await apiService.getDepartmentReport();
            console.log("📊 Department stats response:", deptResponse);
            
            // Handle different response formats
            let departmentData = [];
            if (Array.isArray(deptResponse.data)) {
              departmentData = deptResponse.data;
            } else if (Array.isArray(deptResponse)) {
              departmentData = deptResponse;
            } else if (deptResponse.data && Array.isArray(deptResponse.data.departments)) {
              departmentData = deptResponse.data.departments;
            } else if (deptResponse.departments && Array.isArray(deptResponse.departments)) {
              departmentData = deptResponse.departments;
            }
            
            setDepartmentStats(departmentData);
          } catch (deptError) {
            console.error("❌ Error loading department stats:", deptError);
            // Set default department data
            setDepartmentStats([
              { name: 'Engineering', count: 45 },
              { name: 'HR', count: 12 },
              { name: 'Sales', count: 23 },
              { name: 'Marketing', count: 15 },
              { name: 'Finance', count: 8 }
            ]);
          }

          // Load compliance stats
          const complianceResponse = await apiService.getComplianceDashboard();
          setComplianceStats(complianceResponse.data || complianceResponse);

          // Load Payroll Analytics
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          const payrollResponse = await PAYROLL_API.getAnalytics({
            year: currentYear,
            month: currentMonth,
          });
          setPayrollStats(payrollResponse.data?.summary || null);
        } catch (error) {
          console.error("❌ Error loading additional stats:", error);
        }
      } else {
        // Employee-specific data
        try {
          const ackResponse = await apiService.getMyPendingAcknowledgments();
          setComplianceStats({
            pendingAcknowledgments: ackResponse.data?.length || 0,
          });

          const currentYear = new Date().getFullYear();
          const payslipsResponse = await PAYROLL_API.getMyPayslips({
            year: currentYear,
          });
          setPayrollStats(payslipsResponse.data?.summary || null);
        } catch (error) {
          console.error("❌ Error loading employee stats:", error);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Failed to load dashboard data:", error);
      showError("Failed to load dashboard data");
      setLoading(false);
    }
  }, [isAdmin, showError]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Safe data extraction for charts
  const getDepartmentChartData = () => {
    // Ensure departmentStats is an array
    const safeDepartmentStats = Array.isArray(departmentStats) ? departmentStats : [];
    
    return {
      labels: safeDepartmentStats.length > 0 
        ? safeDepartmentStats.map(dept => dept.name) 
        : ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance'],
      datasets: [
        {
          data: safeDepartmentStats.length > 0 
            ? safeDepartmentStats.map(dept => dept.count || dept.employeeCount || 0)
            : [45, 12, 23, 15, 8],
          backgroundColor: [
            colors.primary[500],
            colors.success[500],
            colors.warning[500],
            colors.error[500],
            colors.gray[500],
          ],
          borderWidth: 2,
          borderColor: colors.gray[100],
        },
      ],
    };
  };

  // Chart configurations
  const attendanceChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Present',
        data: [85, 92, 78, 95, 88, 45, 30],
        backgroundColor: colors.success[500],
        borderColor: colors.success[600],
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: 'Absent',
        data: [15, 8, 22, 5, 12, 55, 70],
        backgroundColor: colors.error[500],
        borderColor: colors.error[600],
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const payrollTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Payout',
        data: [1250000, 1320000, 1410000, 1480000, 1560000, 1620000],
        borderColor: colors.primary[500],
        backgroundColor: colors.primary[50],
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const departmentDistributionData = getDepartmentChartData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          color: colors.gray[700],
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: colors.gray[100],
        },
        ticks: {
          color: colors.gray[500],
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: colors.gray[500],
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          color: colors.gray[700],
        },
      },
    },
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Eye className="h-4 w-4" />
            View Report
          </button>
          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={stats.totalEmployees || 0}
          change="+12% from last month"
          changeType="increase"
          bgColor={colors.primary[500]}
          textColor="text-white"
        />
        <StatCard
          icon={CheckCircle}
          label="Present Today"
          value={stats.presentToday || 0}
          change={`${Math.round(((stats.presentToday || 0) / (stats.totalEmployees || 1)) * 100)}% attendance`}
          changeType="neutral"
          bgColor={colors.success[500]}
          textColor="text-white"
        />
        <StatCard
          icon={Calendar}
          label="On Leave"
          value={stats.onLeave || 0}
          change={`${Math.round(((stats.onLeave || 0) / (stats.totalEmployees || 1)) * 100)}% of workforce`}
          changeType="decrease"
          bgColor={colors.warning[500]}
          textColor="text-white"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Approvals"
          value={stats.pendingLeaves || 0}
          change={stats.pendingLeaves > 0 ? "Needs attention" : "All clear"}
          changeType={stats.pendingLeaves > 0 ? "increase" : "neutral"}
          bgColor={colors.error[500]}
          textColor="text-white"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Trends</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            <Bar data={attendanceChartData} options={chartOptions} />
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Distribution</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            <Doughnut data={departmentDistributionData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Payroll & Financials */}
      {payrollStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payroll Trend */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Payroll Trend</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
            <div className="h-80">
              <Line data={payrollTrendData} options={chartOptions} />
            </div>
          </div>

          {/* Payroll Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Payroll Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Gross</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(payrollStats.totalGross)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Net</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(payrollStats.totalNet)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Deductions</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(payrollStats.totalDeductions)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Employees</span>
                <span className="font-semibold text-gray-900">
                  {payrollStats.employeeCount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <DashboardQuickActionCard
              icon={Clock}
              label="Check In/Out"
              description="Mark your attendance"
              color={colors.primary[500]}
              onClick={() => (window.location.href = "/attendance")}
            />
            <DashboardQuickActionCard
              icon={Calendar}
              label="Apply Leave"
              description="Submit leave request"
              color={colors.success[500]}
              onClick={() => (window.location.href = "/leaves")}
            />
            <DashboardQuickActionCard
              icon={FileText}
              label={isAdmin ? "Manage Payroll" : "View Payslip"}
              description={isAdmin ? "Process payroll" : "Download payslip"}
              color={colors.warning[500]}
              onClick={() => (window.location.href = "/payroll")}
            />
            <DashboardQuickActionCard
              icon={BookOpen}
              label="Training"
              description="Browse courses"
              color={colors.error[500]}
              onClick={() => (window.location.href = "/training")}
            />
          </div>
        </div>

        {/* Compliance Status */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
            <button 
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              onClick={() => (window.location.href = "/compliance")}
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComplianceStatCard
              icon={CheckCircle}
              iconBg="bg-green-100"
              iconColor="text-green-600"
              label="Policies"
              value={complianceStats?.policies?.completed || 0}
              description="Completed"
            />
            <ComplianceStatCard
              icon={Clock}
              iconBg="bg-yellow-100"
              iconColor="text-yellow-600"
              label="Pending"
              value={complianceStats?.policies?.pending || complianceStats?.pendingAcknowledgments || 0}
              description="Requires action"
            />
            <ComplianceStatCard
              icon={FileText}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              label="Documents"
              value={complianceStats?.documents?.active || 0}
              description="Active"
            />
            <ComplianceStatCard
              icon={AlertTriangle}
              iconBg="bg-red-100"
              iconColor="text-red-600"
              label="Expiring"
              value={complianceStats?.documents?.expiringSoon || 0}
              description="Next 30 days"
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            View All →
          </button>
        </div>
        <div className="space-y-4">
          <ActivityItem
            icon={CheckCircle}
            iconColor="text-green-500"
            title="Attendance marked"
            time="Today at 9:00 AM"
            description="You checked in for the day"
          />
          {stats.pendingLeaves > 0 && (
            <ActivityItem
              icon={AlertCircle}
              iconColor="text-yellow-500"
              title={`${stats.pendingLeaves} pending leave ${stats.pendingLeaves !== 1 ? 'requests' : 'request'}`}
              time="Needs approval"
              description="Review and take action"
            />
          )}
          <ActivityItem
            icon={TrendingUp}
            iconColor="text-blue-500"
            title="Monthly report generated"
            time="Yesterday at 3:45 PM"
            description="Q4 performance analysis ready"
          />
        </div>
      </div>
    </div>
  );
};

// Dashboard-specific QuickActionCard (renamed to avoid conflict)
const DashboardQuickActionCard = ({ icon: Icon, label, description, color, onClick, badge }) => (
  <button
    onClick={onClick}
    className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group"
  >
    <div className="flex items-center gap-3">
      <div 
        className="p-2 rounded-lg group-hover:scale-105 transition-transform duration-200"
        style={{ backgroundColor: color + '20' }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 group-hover:text-gray-700">{label}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      {badge && (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          {badge}
        </span>
      )}
    </div>
  </button>
);

// Compliance Stat Card Component
const ComplianceStatCard = ({ icon: Icon, iconBg, iconColor, label, value, description }) => (
  <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2 rounded-lg ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <span className="font-medium text-gray-900">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

// Activity Item Component
const ActivityItem = ({ icon: Icon, iconColor, title, time, description }) => (
  <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
    <div className={`p-2 rounded-lg ${iconColor} bg-opacity-10`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="font-medium text-gray-900 truncate">{title}</p>
        <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
      </div>
      {description && (
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      )}
    </div>
  </div>
);

export default Dashboard;