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
  const [attendanceTrends, setAttendanceTrends] = useState({
    labels: [],
    presentData: [],
    absentData: [],
    lateData: [],
  });
  const [departmentStats, setDepartmentStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "hr";

  // Professional color palette
  const colors = {
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
    },
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
    },
    warning: {
      50: "#fffbeb",
      100: "#fef3c7",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
    },
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  };

  // Function to process attendance data for trends
  const processAttendanceTrends = (attendanceData) => {
    try {
      console.log("📊 Processing attendance trends:", attendanceData);

      if (
        !attendanceData ||
        !attendanceData.attendance ||
        !Array.isArray(attendanceData.attendance)
      ) {
        console.log("📊 No attendance data available, using defaults");
        return {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          presentData: [85, 92, 78, 95, 88, 45, 30],
          absentData: [15, 8, 22, 5, 12, 55, 70],
          lateData: [5, 3, 8, 2, 4, 10, 15],
        };
      }

      // Group attendance by day of week
      const weeklyStats = {
        Mon: { present: 0, absent: 0, late: 0, total: 0 },
        Tue: { present: 0, absent: 0, late: 0, total: 0 },
        Wed: { present: 0, absent: 0, late: 0, total: 0 },
        Thu: { present: 0, absent: 0, late: 0, total: 0 },
        Fri: { present: 0, absent: 0, late: 0, total: 0 },
        Sat: { present: 0, absent: 0, late: 0, total: 0 },
        Sun: { present: 0, absent: 0, late: 0, total: 0 },
      };

      // Get data for last 7 days
      const last7Days = attendanceData.attendance.slice(-7);

      last7Days.forEach((record) => {
        if (!record.date) return;

        const date = new Date(record.date);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

        if (weeklyStats[dayName]) {
          weeklyStats[dayName].total++;

          if (record.status === "Present") {
            weeklyStats[dayName].present++;
          } else if (record.status === "Absent") {
            weeklyStats[dayName].absent++;
          }

          if (record.isLate) {
            weeklyStats[dayName].late++;
          }
        }
      });

      // Calculate percentages
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const presentData = [];
      const absentData = [];
      const lateData = [];

      labels.forEach((day) => {
        const stats = weeklyStats[day];
        const total = stats.total || 1; // Avoid division by zero
        presentData.push(Math.round((stats.present / total) * 100));
        absentData.push(Math.round((stats.absent / total) * 100));
        lateData.push(Math.round((stats.late / total) * 100));
      });

      console.log("📊 Processed trends:", {
        labels,
        presentData,
        absentData,
        lateData,
      });

      return { labels, presentData, absentData, lateData };
    } catch (error) {
      console.error("❌ Error processing attendance trends:", error);
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        presentData: [85, 92, 78, 95, 88, 45, 30],
        absentData: [15, 8, 22, 5, 12, 55, 70],
        lateData: [5, 3, 8, 2, 4, 10, 15],
      };
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
      totalEmployees:
        dashboardData.totalEmployees || dashboardData.employees || 0,
      presentToday: dashboardData.presentToday || dashboardData.present || 0,
      onLeave: dashboardData.onLeave || dashboardData.leave || 0,
      pendingLeaves:
        dashboardData.pendingLeaves || dashboardData.pendingApprovals || 0,
    };

    console.log("📈 Extracted stats:", extractedStats);
    setStats(extractedStats);

    // Load attendance data for all users
    try {
      const currentDate = new Date();
      const attendanceResponse = isAdmin
        ? await apiService.getAttendanceReport(
            currentDate.getMonth() + 1,
            currentDate.getFullYear()
          )
        : await apiService.getMyAttendance(
            currentDate.getMonth() + 1,
            currentDate.getFullYear()
          );
      console.log("📊 Attendance response:", attendanceResponse);

      const attendanceData = attendanceResponse.data || attendanceResponse;
      setAttendanceData(attendanceData);

      // Process attendance trends
      const trends = processAttendanceTrends(attendanceData);
      setAttendanceTrends(trends);
    } catch (attendanceError) {
      console.error("❌ Error loading attendance data:", attendanceError);
    }

    // Load department stats for admin only
    if (isAdmin) {
      try {
        const deptResponse = await apiService.getDepartmentReport();
        console.log("📊 Department stats response:", deptResponse);

        // Handle different response formats
        let departmentData = [];
        if (Array.isArray(deptResponse.data)) {
          departmentData = deptResponse.data;
        } else if (Array.isArray(deptResponse)) {
          departmentData = deptResponse;
        } else if (
          deptResponse.data &&
          Array.isArray(deptResponse.data.departments)
        ) {
          departmentData = deptResponse.data.departments;
        } else if (
          deptResponse.departments &&
          Array.isArray(deptResponse.departments)
        ) {
          departmentData = deptResponse.departments;
        }

        setDepartmentStats(departmentData);
      } catch (deptError) {
        console.error("❌ Error loading department stats:", deptError);
        // Set default department data
        setDepartmentStats([
          { name: "Engineering", count: 45 },
          { name: "HR", count: 12 },
          { name: "Sales", count: 23 },
          { name: "Marketing", count: 15 },
          { name: "Finance", count: 8 },
        ]);
      }

      // Load compliance stats for admin
      try {
        const complianceResponse = await apiService.getComplianceDashboard();
        setComplianceStats(complianceResponse.data || complianceResponse);
      } catch (complianceError) {
        console.error("❌ Error loading compliance stats:", complianceError);
      }
    } else {
      // Employee-specific compliance data
      try {
        const ackResponse = await apiService.getMyPendingAcknowledgments();
        setComplianceStats({
          pendingAcknowledgments: ackResponse.data?.length || 0,
        });
      } catch (complianceError) {
        console.error("❌ Error loading employee compliance:", complianceError);
      }
    }

    // ========== FIXED: LOAD PAYROLL DATA FOR ALL USERS ==========
    try {
      let payrollData = null;
      
      if (isAdmin) {
        // Admin: Try to get analytics first
        try {
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();

          console.log("💰 Admin: Fetching payroll analytics...");
          const payrollResponse = await PAYROLL_API.getAnalytics({
            year: currentYear,
            month: currentMonth,
          });

          console.log("💰 Admin payroll analytics response:", payrollResponse);

          if (payrollResponse) {
            const data = payrollResponse.data || payrollResponse;
            
            // Handle different response structures
            let monthlyTrend = [];
            let summary = {};

            if (data.monthlyTrend && Array.isArray(data.monthlyTrend)) {
              monthlyTrend = data.monthlyTrend;
            } else if (data.trend && Array.isArray(data.trend)) {
              monthlyTrend = data.trend;
            } else if (data.chartData && Array.isArray(data.chartData)) {
              monthlyTrend = data.chartData;
            } else if (data.data && Array.isArray(data.data)) {
              monthlyTrend = data.data;
            }

            // Normalize monthly trend data
            const normalizedMonthlyTrend = monthlyTrend.map((item) => ({
              month: item.month || item.label || item.name || item.date || "Unknown",
              totalPayout: item.totalPayout || item.value || item.amount || item.total || 0,
            }));

            if (data.summary && typeof data.summary === 'object') {
              summary = data.summary;
            } else if (data.overview && typeof data.overview === 'object') {
              summary = data.overview;
            } else if (data.stats && typeof data.stats === 'object') {
              summary = data.stats;
            } else {
              // Extract from root level
              summary = {
                totalGross: data.totalGross || data.totalPayout || data.grossSalary || 0,
                totalNet: data.totalNet || data.netAmount || data.netSalary || 0,
                totalDeductions: data.totalDeductions || data.deductions || 0,
                employeeCount: data.employeeCount || data.totalEmployees || data.count || 0,
              };
            }

            payrollData = {
              monthlyTrend: normalizedMonthlyTrend,
              summary: {
                totalGross: summary.totalGross || summary.grossAmount || 0,
                totalNet: summary.totalNet || summary.netAmount || 0,
                totalDeductions: summary.totalDeductions || summary.deductions || 0,
                employeeCount: summary.employeeCount || summary.count || 0,
              },
            };
          }
        } catch (analyticsError) {
          console.log("💰 Admin analytics failed, trying alternative...", analyticsError);
          
          // Fallback: Try to get payroll list and generate trend
          try {
            const currentYear = new Date().getFullYear();
            const payrollsResponse = await PAYROLL_API.getAllPayrolls({
              year: currentYear,
            });
            
            console.log("💰 Admin fallback payrolls:", payrollsResponse);
            
            if (payrollsResponse && payrollsResponse.data) {
              // Generate monthly trend from payrolls
              const payrolls = Array.isArray(payrollsResponse.data) 
                ? payrollsResponse.data 
                : (payrollsResponse.data.payrolls || []);
              
              const monthlyMap = {};
              payrolls.forEach(payroll => {
                if (payroll.month && payroll.totalNet) {
                  const monthKey = new Date(payroll.payrollDate || payroll.month).toLocaleString('default', { month: 'short' });
                  if (!monthlyMap[monthKey]) {
                    monthlyMap[monthKey] = 0;
                  }
                  monthlyMap[monthKey] += payroll.totalNet;
                }
              });
              
              const monthlyTrend = Object.keys(monthlyMap).map(month => ({
                month,
                totalPayout: monthlyMap[month]
              })).sort((a, b) => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return months.indexOf(a.month) - months.indexOf(b.month);
              });
              
              // Calculate summary
              const totalNet = payrolls.reduce((sum, payroll) => sum + (payroll.totalNet || 0), 0);
              const totalGross = payrolls.reduce((sum, payroll) => sum + (payroll.totalGross || 0), 0);
              const totalDeductions = payrolls.reduce((sum, payroll) => sum + (payroll.totalDeductions || 0), 0);
              
              payrollData = {
                monthlyTrend,
                summary: {
                  totalGross,
                  totalNet,
                  totalDeductions,
                  employeeCount: stats.totalEmployees || 0,
                },
              };
            }
          } catch (fallbackError) {
            console.error("💰 Admin fallback also failed:", fallbackError);
          }
        }
      } else {
        // Employee: Get payslips
        try {
          const currentYear = new Date().getFullYear();
          const payslipsResponse = await PAYROLL_API.getMyPayslips({
            year: currentYear,
          });

          console.log("💰 Employee payslips response:", payslipsResponse);

          const data = payslipsResponse.data || payslipsResponse;
          let monthlyTrend = [];
          let summary = {};

          if (data.monthlyData && Array.isArray(data.monthlyData)) {
            monthlyTrend = data.monthlyData;
          } else if (data.payslips && Array.isArray(data.payslips)) {
            // Create monthly trend from payslips
            const monthlyMap = {};
            data.payslips.forEach(payslip => {
              if (payslip.month && payslip.netSalary) {
                const monthKey = payslip.month;
                if (!monthlyMap[monthKey]) {
                  monthlyMap[monthKey] = 0;
                }
                monthlyMap[monthKey] += payslip.netSalary;
              }
            });
            
            monthlyTrend = Object.keys(monthlyMap).map(month => ({
              month,
              totalPayout: monthlyMap[month]
            }));
          }

          if (data.summary && typeof data.summary === 'object') {
            summary = data.summary;
          } else if (data.overview && typeof data.overview === 'object') {
            summary = data.overview;
          } else {
            summary = {
              totalGross: data.totalEarnings || data.grossSalary || 0,
              totalNet: data.totalNetSalary || data.netSalary || 0,
              totalDeductions: data.totalDeductions || data.deductions || 0,
              employeeCount: 1,
            };
          }

          payrollData = {
            monthlyTrend,
            summary: {
              totalGross: summary.totalGross || summary.totalEarnings || summary.grossSalary || 0,
              totalNet: summary.totalNet || summary.totalNetSalary || summary.netSalary || 0,
              totalDeductions: summary.totalDeductions || summary.deductions || 0,
              employeeCount: summary.employeeCount || summary.count || 1,
            },
          };
        } catch (employeePayrollError) {
          console.error("💰 Error loading employee payroll:", employeePayrollError);
        }
      }

      // If payroll data is still null, set default data
      if (!payrollData) {
        console.log("💰 Setting default payroll data");
        payrollData = {
          monthlyTrend: isAdmin ? [
            { month: "Jan", totalPayout: 1250000 },
            { month: "Feb", totalPayout: 1320000 },
            { month: "Mar", totalPayout: 1410000 },
            { month: "Apr", totalPayout: 1480000 },
            { month: "May", totalPayout: 1560000 },
            { month: "Jun", totalPayout: 1620000 },
          ] : [
            { month: "Jan", totalPayout: 75000 },
            { month: "Feb", totalPayout: 78000 },
            { month: "Mar", totalPayout: 82000 },
            { month: "Apr", totalPayout: 85000 },
            { month: "May", totalPayout: 88000 },
            { month: "Jun", totalPayout: 90000 },
          ],
          summary: {
            totalGross: isAdmin ? 8640000 : 498000,
            totalNet: isAdmin ? 6912000 : 398400,
            totalDeductions: isAdmin ? 1728000 : 99600,
            employeeCount: isAdmin ? stats.totalEmployees || 0 : 1,
          },
        };
      }

      console.log("💰 Final payroll data:", payrollData);
      setPayrollStats(payrollData);
      
    } catch (payrollError) {
      console.error("❌ General payroll error:", payrollError);
      // Set default payroll data on error
      setPayrollStats({
        monthlyTrend: isAdmin ? [
          { month: "Jan", totalPayout: 1250000 },
          { month: "Feb", totalPayout: 1320000 },
          { month: "Mar", totalPayout: 1410000 },
          { month: "Apr", totalPayout: 1480000 },
          { month: "May", totalPayout: 1560000 },
          { month: "Jun", totalPayout: 1620000 },
        ] : [
          { month: "Jan", totalPayout: 75000 },
          { month: "Feb", totalPayout: 78000 },
          { month: "Mar", totalPayout: 82000 },
          { month: "Apr", totalPayout: 85000 },
          { month: "May", totalPayout: 88000 },
          { month: "Jun", totalPayout: 90000 },
        ],
        summary: {
          totalGross: isAdmin ? 8640000 : 498000,
          totalNet: isAdmin ? 6912000 : 398400,
          totalDeductions: isAdmin ? 1728000 : 99600,
          employeeCount: isAdmin ? stats.totalEmployees || 0 : 1,
        },
      });
    }

    setLoading(false);
  } catch (error) {
    console.error("❌ Failed to load dashboard data:", error);
    showError("Failed to load dashboard data");
    setLoading(false);
  }
}, [isAdmin, showError, stats.totalEmployees]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Dynamic attendance chart data
  const getAttendanceChartData = () => ({
    labels: attendanceTrends.labels,
    datasets: [
      {
        label: "Present %",
        data: attendanceTrends.presentData,
        backgroundColor: colors.success[500],
        borderColor: colors.success[600],
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: "Absent %",
        data: attendanceTrends.absentData,
        backgroundColor: colors.error[500],
        borderColor: colors.error[600],
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6,
      },
      {
        label: "Late %",
        data: attendanceTrends.lateData,
        backgroundColor: colors.warning[500],
        borderColor: colors.warning[600],
        borderWidth: 2,
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  });

  // Safe data extraction for department chart
  const getDepartmentChartData = () => {
    // Ensure departmentStats is an array
    const safeDepartmentStats = Array.isArray(departmentStats)
      ? departmentStats
      : [];

    return {
      labels:
        safeDepartmentStats.length > 0
          ? safeDepartmentStats.map((dept) => dept.name)
          : ["Engineering", "HR", "Sales", "Marketing", "Finance"],
      datasets: [
        {
          data:
            safeDepartmentStats.length > 0
              ? safeDepartmentStats.map(
                  (dept) => dept.count || dept.employeeCount || 0
                )
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

  // Dynamic payroll trend data based on actual data
  const getPayrollTrendData = () => {
    console.log("📈 Generating payroll trend chart data:", payrollStats);

    if (
      payrollStats &&
      Array.isArray(payrollStats.monthlyTrend) &&
      payrollStats.monthlyTrend.length > 0
    ) {
      console.log("✅ Using real payroll trend data");
      return {
        labels: payrollStats.monthlyTrend.map((item) => item.month),
        datasets: [
          {
            label: "Total Payout",
            data: payrollStats.monthlyTrend.map((item) => item.totalPayout),
            borderColor: colors.primary[500],
            backgroundColor: colors.primary[50],
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: colors.primary[500],
            pointBorderColor: colors.primary[700],
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      };
    }

    // Default data if no payroll trend available
    console.log("⚠️ Using fallback payroll trend data");
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Total Payout",
          data: [1250000, 1320000, 1410000, 1480000, 1560000, 1620000],
          borderColor: colors.primary[500],
          backgroundColor: colors.primary[50],
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.primary[500],
          pointBorderColor: colors.primary[700],
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  };

  const departmentDistributionData = getDepartmentChartData();
  const payrollTrendData = getPayrollTrendData();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          color: colors.gray[700],
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + "%";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Percentage (%)",
          color: colors.gray[600],
        },
        grid: {
          color: colors.gray[100],
        },
        ticks: {
          color: colors.gray[500],
          callback: function (value) {
            return value + "%";
          },
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

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 15,
          color: colors.gray[700],
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          },
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
          callback: function (value) {
            if (value >= 1000000) {
              return "₹" + (value / 1000000).toFixed(1) + "M";
            } else if (value >= 1000) {
              return "₹" + (value / 1000).toFixed(0) + "K";
            }
            return "₹" + value;
          },
        },
        title: {
          display: true,
          text: "Amount (₹)",
          color: colors.gray[600],
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
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 15,
          color: colors.gray[700],
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} employees (${percentage}%)`;
          },
        },
      },
    },
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => (window.location.href = "/attendance/reports")}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View Report
          </button>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Refresh Data
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
          change={`${Math.round(
            ((stats.presentToday || 0) / (stats.totalEmployees || 1)) * 100
          )}% attendance`}
          changeType="neutral"
          bgColor={colors.success[500]}
          textColor="text-white"
        />
        <StatCard
          icon={Calendar}
          label="On Leave"
          value={stats.onLeave || 0}
          change={`${Math.round(
            ((stats.onLeave || 0) / (stats.totalEmployees || 1)) * 100
          )}% of workforce`}
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
            <h3 className="text-lg font-semibold text-gray-900">
              Attendance Trends (Last 7 Days)
            </h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            <Bar data={getAttendanceChartData()} options={chartOptions} />
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Department Distribution
            </h3>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
          <div className="h-80">
            <Doughnut
              data={departmentDistributionData}
              options={doughnutOptions}
            />
          </div>
        </div>
      </div>

     {/* Payroll & Financials */}
{payrollStats && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Payroll Trend */}
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Payroll Trend {isAdmin ? "(Company)" : "(Personal)"}
          {payrollStats.monthlyTrend.length > 0 ? ` (${payrollStats.monthlyTrend.length} months)` : ''}
        </h3>
        <button 
          className="text-gray-400 hover:text-gray-600"
          onClick={() => (window.location.href = "/payroll")}
          title="View detailed analytics"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      <div className="h-80">
        <Line data={payrollTrendData} options={lineChartOptions} />
      </div>
    </div>

    {/* Payroll Summary */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {isAdmin ? "Company Payroll" : "My Payroll"}
        </h3>
        <button 
          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          onClick={() => (window.location.href = "/payroll")}
        >
          Details →
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <span className="text-gray-600">Total {isAdmin ? "Gross" : "Earnings"}</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(payrollStats.summary.totalGross)}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <span className="text-gray-600">Total Net</span>
          <span className="font-semibold text-gray-900">
            {formatCurrency(payrollStats.summary.totalNet)}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <span className="text-gray-600">Deductions</span>
          <span className="font-semibold text-red-600">
            {formatCurrency(payrollStats.summary.totalDeductions)}
          </span>
        </div>
        {isAdmin && (
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="text-gray-600">Employees</span>
            <span className="font-semibold text-gray-900">
              {payrollStats.summary.employeeCount || stats.totalEmployees || 0}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* Quick Actions & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Quick Actions
          </h3>
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
            <h3 className="text-lg font-semibold text-gray-900">
              Compliance Status
            </h3>
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
              value={
                complianceStats?.policies?.pending ||
                complianceStats?.pendingAcknowledgments ||
                0
              }
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
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Activity
          </h3>
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
              title={`${stats.pendingLeaves} pending leave ${
                stats.pendingLeaves !== 1 ? "requests" : "request"
              }`}
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
          {payrollStats && payrollStats.summary.totalNet > 0 && (
            <ActivityItem
              icon={DollarSign}
              iconColor="text-green-500"
              title="Payroll processed"
              time="This month"
              description={`Total payout: ${formatCurrency(payrollStats.summary.totalNet)}`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard-specific QuickActionCard (renamed to avoid conflict)
const DashboardQuickActionCard = ({
  icon: Icon,
  label,
  description,
  color,
  onClick,
  badge,
}) => (
  <button
    onClick={onClick}
    className="w-full p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-left group"
  >
    <div className="flex items-center gap-3">
      <div
        className="p-2 rounded-lg group-hover:scale-105 transition-transform duration-200"
        style={{ backgroundColor: color + "20" }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 group-hover:text-gray-700">
          {label}
        </h4>
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
const ComplianceStatCard = ({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  description,
}) => (
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