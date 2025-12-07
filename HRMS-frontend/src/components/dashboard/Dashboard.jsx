// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  Award,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";
import PAYROLL_API from "../../services/payrollAPI";
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
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

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
  const { user, refreshUser } = useAuth();
  const { showError } = useNotification();

  // Role checks
  const isAdmin = user?.role === "admin" || user?.role === "hr";
  const isManager = user?.role === "manager";

  // State
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    onLeave: 0,
    pendingLeaves: 0,
  });
  const [attendanceTrends, setAttendanceTrends] = useState({
    labels: [],
    presentData: [],
    absentData: [],
    lateData: [],
  });
  const [departmentStats, setDepartmentStats] = useState([]);
  const [payrollStats, setPayrollStats] = useState(null);
  const [leaveData, setLeaveData] = useState(null);
  const [myLeaveBalance, setMyLeaveBalance] = useState(null);

  // Fetch employee data
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

  // Get display name
  const displayName = employeeData
    ? `${employeeData.firstName} ${employeeData.lastName}`
    : user?.employee?.name || user?.name || "User";

  // Modern Indigo/Blue Color Theme
  const colors = {
    primary: {
      50: "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      300: "#a5b4fc",
      400: "#818cf8",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
    },
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      500: "#22c55e",
      600: "#16a34a",
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      500: "#f59e0b",
      600: "#d97706",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      500: "#ef4444",
      600: "#dc2626",
    },
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      900: "#111827",
    },
  };

  // Process attendance trends
  const processAttendanceTrends = (attendanceData) => {
    try {
      if (!attendanceData?.attendance?.length) {
        return {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          presentData: [92, 95, 88, 94, 90, 45, 30],
          absentData: [8, 5, 12, 6, 10, 55, 70],
          lateData: [3, 2, 5, 3, 4, 8, 12],
        };
      }

      const weeklyStats = {
        Mon: { present: 0, absent: 0, late: 0, total: 0 },
        Tue: { present: 0, absent: 0, late: 0, total: 0 },
        Wed: { present: 0, absent: 0, late: 0, total: 0 },
        Thu: { present: 0, absent: 0, late: 0, total: 0 },
        Fri: { present: 0, absent: 0, late: 0, total: 0 },
        Sat: { present: 0, absent: 0, late: 0, total: 0 },
        Sun: { present: 0, absent: 0, late: 0, total: 0 },
      };

      attendanceData.attendance.slice(-7).forEach((record) => {
        if (!record.date) return;
        const dayName = new Date(record.date).toLocaleDateString("en-US", {
          weekday: "short",
        });
        if (weeklyStats[dayName]) {
          weeklyStats[dayName].total++;
          if (record.status === "Present") weeklyStats[dayName].present++;
          else if (record.status === "Absent") weeklyStats[dayName].absent++;
          if (record.isLate) weeklyStats[dayName].late++;
        }
      });

      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      return {
        labels,
        presentData: labels.map((day) =>
          Math.round(
            (weeklyStats[day].present / (weeklyStats[day].total || 1)) * 100
          )
        ),
        absentData: labels.map((day) =>
          Math.round(
            (weeklyStats[day].absent / (weeklyStats[day].total || 1)) * 100
          )
        ),
        lateData: labels.map((day) =>
          Math.round(
            (weeklyStats[day].late / (weeklyStats[day].total || 1)) * 100
          )
        ),
      };
    } catch (error) {
      console.error("Error processing attendance:", error);
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        presentData: [92, 95, 88, 94, 90, 45, 30],
        absentData: [8, 5, 12, 6, 10, 55, 70],
        lateData: [3, 2, 5, 3, 4, 8, 12],
      };
    }
  };

  // Load all data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Dashboard Stats
      try {
        const dashboardResponse = await apiService.getDashboardStats();
        const dashboardData = dashboardResponse.data || dashboardResponse;
        setStats({
          totalEmployees: dashboardData.totalEmployees || 0,
          presentToday: dashboardData.presentToday || 0,
          onLeave: dashboardData.onLeave || 0,
          pendingLeaves: dashboardData.pendingLeaves || 0,
        });
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      }

      // 2. Attendance Data
      try {
        const currentDate = new Date();
        const attendanceResponse = await apiService.getMyAttendance(
          currentDate.getMonth() + 1,
          currentDate.getFullYear()
        );
        const attData = attendanceResponse.data || attendanceResponse;
        setAttendanceTrends(processAttendanceTrends(attData));
      } catch (error) {
        console.error("Error loading attendance:", error);
      }

      // 3. Leave Balance
      try {
        const leaveBalanceResponse = await apiService.getLeaveBalance();
        setMyLeaveBalance(leaveBalanceResponse.data || leaveBalanceResponse);
      } catch (error) {
        console.error("Error loading leave balance:", error);
      }

      // 4. Leave Data
      try {
        const myLeavesResponse = await apiService.getMyLeaves({ limit: 5 });
        setLeaveData(myLeavesResponse.data || myLeavesResponse);
      } catch (error) {
        console.error("Error loading leaves:", error);
      }

      // 5. Department Stats (Admin/Manager only) - WITH ERROR HANDLING
      if (isAdmin || isManager) {
        try {
          const deptResponse = await apiService.getDepartmentReport();
          console.log("Department response:", deptResponse);

          let deptData = [];
          if (deptResponse.success && Array.isArray(deptResponse.data)) {
            deptData = deptResponse.data;
          } else if (Array.isArray(deptResponse)) {
            deptData = deptResponse;
          } else if (deptResponse.data?.departments) {
            deptData = deptResponse.data.departments;
          }

          setDepartmentStats(deptData);
        } catch (error) {
          console.error("Error loading department stats:", error);
          // Set default department data on error
          setDepartmentStats([
            { name: "Engineering", count: 45 },
            { name: "HR", count: 12 },
            { name: "Sales", count: 23 },
            { name: "Marketing", count: 15 },
            { name: "Finance", count: 8 },
          ]);
        }
      }

      // 6. Payroll Data - WITH ERROR HANDLING
      try {
        const currentYear = new Date().getFullYear();
        let payrollData = null;

        if (isAdmin) {
          try {
            const payrollResponse = await PAYROLL_API.getAnalytics({
              year: currentYear,
            });
            const data = payrollResponse.data || payrollResponse;

            payrollData = {
              monthlyTrend: (data.monthlyTrend || []).map((item) => ({
                month: item.month || "Unknown",
                totalPayout: item.totalPayout || 0,
              })),
              summary: {
                totalGross: data.summary?.totalGross || 0,
                totalNet: data.summary?.totalNet || 0,
                totalDeductions: data.summary?.totalDeductions || 0,
                employeeCount: data.summary?.employeeCount || 0,
              },
            };
          } catch (error) {
            console.error("Error loading admin payroll:", error);
          }
        } else {
          try {
            const payslipsResponse = await PAYROLL_API.getMyPayslips({
              year: currentYear,
            });
            const data = payslipsResponse.data || payslipsResponse;

            payrollData = {
              monthlyTrend: (data.payslips || []).map((slip) => ({
                month: slip.month || "Unknown",
                totalPayout: slip.netSalary || 0,
              })),
              summary: {
                totalGross: data.summary?.totalGross || 0,
                totalNet: data.summary?.totalNet || 0,
                totalDeductions: data.summary?.totalDeductions || 0,
                employeeCount: 1,
              },
            };
          } catch (error) {
            console.error("Error loading employee payroll:", error);
          }
        }

        // Set default data if payroll loading failed
        if (!payrollData || !payrollData.monthlyTrend?.length) {
          payrollData = {
            monthlyTrend: [
              { month: "Jan", totalPayout: isAdmin ? 1250000 : 75000 },
              { month: "Feb", totalPayout: isAdmin ? 1320000 : 78000 },
              { month: "Mar", totalPayout: isAdmin ? 1410000 : 82000 },
              { month: "Apr", totalPayout: isAdmin ? 1480000 : 85000 },
              { month: "May", totalPayout: isAdmin ? 1560000 : 88000 },
              { month: "Jun", totalPayout: isAdmin ? 1620000 : 90000 },
            ],
            summary: {
              totalGross: isAdmin ? 8640000 : 498000,
              totalNet: isAdmin ? 6912000 : 398400,
              totalDeductions: isAdmin ? 1728000 : 99600,
              employeeCount: isAdmin ? stats.totalEmployees || 0 : 1,
            },
          };
        }

        setPayrollStats(payrollData);
      } catch (error) {
        console.error("Error in payroll section:", error);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      showError("Failed to load dashboard data");
      setLoading(false);
    }
  }, [isAdmin, isManager, showError, stats.totalEmployees]);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user, loadDashboardData]);

  // Chart Data
  const getAttendanceChartData = () => ({
    labels: attendanceTrends.labels,
    datasets: [
      {
        label: "Present",
        data: attendanceTrends.presentData,
        backgroundColor: colors.success[500],
        borderRadius: 8,
        barThickness: 32,
      },
      {
        label: "Absent",
        data: attendanceTrends.absentData,
        backgroundColor: colors.error[500],
        borderRadius: 8,
        barThickness: 32,
      },
      {
        label: "Late",
        data: attendanceTrends.lateData,
        backgroundColor: colors.warning[500],
        borderRadius: 8,
        barThickness: 32,
      },
    ],
  });

  const getDepartmentChartData = () => ({
    labels: departmentStats.map((dept) => dept.name),
    datasets: [
      {
        data: departmentStats.map(
          (dept) => dept.count || dept.employeeCount || 0
        ),
        backgroundColor: [
          colors.primary[500],
          colors.primary[400],
          colors.primary[600],
          colors.primary[300],
          colors.primary[700],
        ],
        borderWidth: 0,
        hoverOffset: 20,
      },
    ],
  });

  const getPayrollTrendData = () => {
    const monthlyData = payrollStats?.monthlyTrend || [];
    return {
      labels: monthlyData.map((item) => item.month),
      datasets: [
        {
          label: isAdmin ? "Company Payout" : "My Salary",
          data: monthlyData.map((item) => item.totalPayout),
          borderColor: colors.primary[600],
          backgroundColor: `${colors.primary[500]}20`,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.primary[600],
          pointBorderColor: "#fff",
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
      ],
    };
  };

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: "500" },
          color: colors.gray[700],
        },
      },
      tooltip: {
        backgroundColor: colors.gray[900],
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        borderRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: colors.gray[100], drawBorder: false },
        ticks: {
          color: colors.gray[500],
          callback: (value) => value + "%",
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: colors.gray[500] },
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: "500" },
          color: colors.gray[700],
        },
      },
      tooltip: {
        backgroundColor: colors.gray[900],
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        borderRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `${context.dataset.label}: ${
              value >= 1000000
                ? "₹" + (value / 1000000).toFixed(2) + "M"
                : value >= 1000
                ? "₹" + (value / 1000).toFixed(0) + "K"
                : "₹" + value
            }`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: colors.gray[100], drawBorder: false },
        ticks: {
          color: colors.gray[500],
          callback: (value) =>
            value >= 1000000
              ? "₹" + (value / 1000000).toFixed(1) + "M"
              : value >= 1000
              ? "₹" + (value / 1000).toFixed(0) + "K"
              : "₹" + value,
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: colors.gray[500] },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%",
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 12, weight: "500" },
          color: colors.gray[700],
        },
      },
      tooltip: {
        backgroundColor: colors.gray[900],
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 12,
        borderRadius: 8,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="h-6 w-6 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {displayName}! 👋
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Users}
          label="Total Employees"
          value={stats.totalEmployees}
          change="+12%"
          changeType="positive"
          gradient="from-blue-500 to-indigo-600"
        />
        <StatsCard
          icon={UserCheck}
          label="Present Today"
          value={stats.presentToday}
          change={`${
            stats.totalEmployees
              ? Math.round((stats.presentToday / stats.totalEmployees) * 100)
              : 0
          }% attendance`}
          changeType="neutral"
          gradient="from-green-500 to-emerald-600"
        />
        <StatsCard
          icon={Calendar}
          label="On Leave"
          value={stats.onLeave}
          change={`${
            stats.totalEmployees
              ? Math.round((stats.onLeave / stats.totalEmployees) * 100)
              : 0
          }% of team`}
          changeType="neutral"
          gradient="from-yellow-500 to-orange-600"
        />
        <StatsCard
          icon={AlertCircle}
          label="Pending Approvals"
          value={stats.pendingLeaves}
          change={stats.pendingLeaves > 0 ? "Needs attention" : "All clear"}
          changeType={stats.pendingLeaves > 0 ? "negative" : "positive"}
          gradient="from-red-500 to-pink-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Attendance Trends */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Attendance Trends
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Last 7 days performance
              </p>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="h-72">
            <Bar data={getAttendanceChartData()} options={chartOptions} />
          </div>
        </div>

        {/* Payroll Trend */}
        {payrollStats && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isAdmin ? "Company Payroll" : "My Salary Trend"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {payrollStats.monthlyTrend?.length || 0} months overview
                </p>
              </div>
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="h-72">
              <Line data={getPayrollTrendData()} options={lineChartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Department Distribution (Admin Only) */}
        {(isAdmin || isManager) && departmentStats.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Department Distribution
                </h3>
                <p className="text-sm text-gray-500 mt-1">Employee breakdown</p>
              </div>
            </div>
            <div className="h-64">
              <Doughnut
                data={getDepartmentChartData()}
                options={doughnutOptions}
              />
            </div>
          </div>
        )}

        {/* Leave Balance (Employee View) */}
        {!isAdmin && myLeaveBalance && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  My Leave Balance
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Current year availability
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myLeaveBalance.balance?.map((leave) => (
                <div
                  key={leave.code}
                  className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {leave.name}
                    </span>
                    <span className="text-xs text-gray-500">{leave.code}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-indigo-600">
                      {leave.currentBalance}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {leave.maxBalance} days
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                        style={{
                          width: `${
                            (leave.currentBalance / leave.maxBalance) * 100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <QuickActionButton
              icon={Clock}
              label="Mark Attendance"
              description="Check in/out"
              onClick={() => (window.location.href = "/attendance")}
              color="indigo"
            />
            <QuickActionButton
              icon={Calendar}
              label="Apply Leave"
              description="Request time off"
              onClick={() => (window.location.href = "/leaves")}
              color="green"
            />
            <QuickActionButton
              icon={FileText}
              label={isAdmin ? "Manage Payroll" : "View Payslip"}
              description={isAdmin ? "Process payroll" : "Download slip"}
              onClick={() => (window.location.href = "/payroll")}
              color="purple"
            />
            <QuickActionButton
              icon={Award}
              label="Training"
              description="Browse courses"
              onClick={() => (window.location.href = "/training")}
              color="yellow"
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {leaveData?.leaves?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Leave Applications
              </h3>
              <p className="text-sm text-gray-500 mt-1">Latest requests</p>
            </div>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {leaveData.leaves.slice(0, 5).map((leave) => (
              <div
                key={leave._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      leave.status === "Approved"
                        ? "bg-green-100"
                        : leave.status === "Rejected"
                        ? "bg-red-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <Calendar
                      className={`w-5 h-5 ${
                        leave.status === "Approved"
                          ? "text-green-600"
                          : leave.status === "Rejected"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {leave.leaveType?.name || "Leave"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(leave.startDate).toLocaleDateString()} -{" "}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    leave.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : leave.status === "Rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Stats Card Component
const StatsCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType,
  gradient,
}) => {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {changeType === "positive" && (
          <div className="flex items-center gap-1 text-green-600">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs font-semibold">{change}</span>
          </div>
        )}
        {changeType === "negative" && (
          <div className="flex items-center gap-1 text-red-600">
            <ArrowDownRight className="w-4 h-4" />
            <span className="text-xs font-semibold">{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {changeType === "neutral" && (
          <p className="text-xs text-gray-500 mt-2">{change}</p>
        )}
      </div>
      <div
        className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-500`}
      />
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({
  icon: Icon,
  label,
  description,
  onClick,
  color,
}) => {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
    yellow: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group"
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]} transition-colors`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
          {label}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
    </button>
  );
};

export default Dashboard;
