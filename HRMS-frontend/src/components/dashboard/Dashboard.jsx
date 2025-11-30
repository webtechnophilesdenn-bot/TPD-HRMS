// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect, useCallback } from "react"; // ✅ SINGLE import with all hooks
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
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";
import PAYROLL_API from "../../services/payrollAPI";
import StatCard from "../common/StatCard";
import QuickActionCard from "../common/QuickActionCard";

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
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "hr";

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

      // Load compliance stats if admin
      if (isAdmin) {
        try {
          const complianceResponse = await apiService.getComplianceDashboard();
          console.log("✅ Compliance stats:", complianceResponse);
          setComplianceStats(complianceResponse.data || complianceResponse);
        } catch (error) {
          console.error("❌ Error loading compliance stats:", error);
        }

        // Load Payroll Analytics
        try {
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          const payrollResponse = await PAYROLL_API.getAnalytics({
            year: currentYear,
            month: currentMonth,
          });
          console.log("✅ Payroll analytics:", payrollResponse);
          setPayrollStats(payrollResponse.data?.summary || null);
        } catch (error) {
          console.error("❌ Error loading payroll stats:", error);
        }
      } else {
        // Load pending acknowledgments for regular employees
        try {
          const ackResponse = await apiService.getMyPendingAcknowledgments();
          console.log("✅ Pending acknowledgments:", ackResponse);
          setComplianceStats({
            pendingAcknowledgments: ackResponse.data?.length || 0,
          });
        } catch (error) {
          console.error("❌ Error loading acknowledgments:", error);
        }

        // Load Employee Payroll Stats
        try {
          const currentYear = new Date().getFullYear();
          const payslipsResponse = await PAYROLL_API.getMyPayslips({
            year: currentYear,
          });
          console.log("✅ Employee payslips:", payslipsResponse);
          setPayrollStats(payslipsResponse.data?.summary || null);
        } catch (error) {
          console.error("❌ Error loading employee payroll stats:", error);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("❌ Failed to load dashboard data:", error);
      showError("Failed to load dashboard data");
      setLoading(false);
    }
  }, [isAdmin, showError]); // ✅ Add dependencies

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]); // ✅ Fixed dependency

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name || user?.email || "User"}! 👋
        </h1>
        <p className="mt-2 text-indigo-100">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={stats.totalEmployees || 0}
          change="+12%"
          changeType="increase"
          bgColor="bg-blue-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Present Today"
          value={stats.presentToday || 0}
          change="91%"
          changeType="neutral"
          bgColor="bg-green-500"
        />
        <StatCard
          icon={Calendar}
          label="On Leave"
          value={stats.onLeave || 0}
          change="-3%"
          changeType="decrease"
          bgColor="bg-orange-500"
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Approvals"
          value={stats.pendingLeaves || 0}
          change={
            stats.pendingLeaves > 0 ? `${stats.pendingLeaves} new` : "All clear"
          }
          changeType={stats.pendingLeaves > 0 ? "increase" : "neutral"}
          bgColor="bg-red-500"
        />
      </div>

      {/* Payroll Statistics */}
      {payrollStats && (
        <>
          <div className="flex items-center gap-2 mt-8 mb-4">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {isAdmin ? "Payroll Overview" : "My Salary Overview"}
            </h2>
          </div>

          {isAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={DollarSign}
                label="Total Gross Payout"
                value={formatCurrency(payrollStats.totalGross)}
                change={`${payrollStats.employeeCount || 0} employees`}
                changeType="neutral"
                bgColor="bg-green-500"
              />
              <StatCard
                icon={DollarSign}
                label="Total Net Payout"
                value={formatCurrency(payrollStats.totalNet)}
                change="This month"
                changeType="neutral"
                bgColor="bg-blue-500"
              />
              <StatCard
                icon={TrendingUp}
                label="Total Deductions"
                value={formatCurrency(payrollStats.totalDeductions)}
                change="PF, ESI, Tax"
                changeType="neutral"
                bgColor="bg-red-500"
              />
              <StatCard
                icon={Users}
                label="Payroll Processed"
                value={payrollStats.employeeCount || 0}
                change={new Date().toLocaleString("default", {
                  month: "long",
                })}
                changeType="neutral"
                bgColor="bg-purple-500"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={DollarSign}
                label="Total Earnings (YTD)"
                value={formatCurrency(payrollStats.totalEarnings)}
                change={`${payrollStats.count || 0} payslips`}
                changeType="neutral"
                bgColor="bg-green-500"
              />
              <StatCard
                icon={DollarSign}
                label="Total Deductions (YTD)"
                value={formatCurrency(payrollStats.totalDeductions)}
                change={`Year ${new Date().getFullYear()}`}
                changeType="neutral"
                bgColor="bg-red-500"
              />
              <StatCard
                icon={TrendingUp}
                label="Net Salary (YTD)"
                value={formatCurrency(payrollStats.totalNetSalary)}
                change="Take home"
                changeType="neutral"
                bgColor="bg-blue-500"
              />
              <StatCard
                icon={FileText}
                label="Payslips Available"
                value={payrollStats.count || 0}
                change="View all"
                changeType="neutral"
                bgColor="bg-purple-500"
              />
            </div>
          )}
        </>
      )}

      {/* Event Calendar Widget */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
          </div>
          <button
            onClick={() => (window.location.href = "/events")}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View All →
          </button>
        </div>

        <UpcomingEventsWidget />
      </div>

      {/* Compliance Statistics */}
      {complianceStats && (
        <>
          <div className="flex items-center gap-2 mt-8 mb-4">
            <Shield className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Compliance & Policy
            </h2>
          </div>

          {isAdmin ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={FileText}
                label="Total Policies"
                value={complianceStats.policies?.total || 0}
                change={`${
                  complianceStats.policies?.completionRate || 0
                }% completion`}
                changeType="neutral"
                bgColor="bg-indigo-500"
              />
              <StatCard
                icon={Clock}
                label="Pending Acknowledgments"
                value={complianceStats.policies?.pending || 0}
                change={`${complianceStats.policies?.completed || 0} completed`}
                changeType={
                  complianceStats.policies?.pending > 0 ? "increase" : "neutral"
                }
                bgColor="bg-yellow-500"
              />
              <StatCard
                icon={AlertTriangle}
                label="Expired Documents"
                value={complianceStats.documents?.expired || 0}
                change={`${
                  complianceStats.documents?.expiringSoon || 0
                } expiring soon`}
                changeType={
                  complianceStats.documents?.expired > 0
                    ? "increase"
                    : "neutral"
                }
                bgColor="bg-red-500"
              />
              <StatCard
                icon={CheckCircle}
                label="Active Documents"
                value={complianceStats.documents?.active || 0}
                change={`${complianceStats.documents?.total || 0} total`}
                changeType="neutral"
                bgColor="bg-green-500"
              />
            </div>
          ) : (
            complianceStats.pendingAcknowledgments > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={AlertCircle}
                  label="Pending Policy Acknowledgments"
                  value={complianceStats.pendingAcknowledgments || 0}
                  change={
                    complianceStats.pendingAcknowledgments > 0
                      ? "Action Required"
                      : "All Clear"
                  }
                  changeType={
                    complianceStats.pendingAcknowledgments > 0
                      ? "increase"
                      : "neutral"
                  }
                  bgColor="bg-yellow-500"
                />
              </div>
            )
          )}
        </>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickActionCard
            icon={Clock}
            label="Check In"
            color="bg-green-500"
            onClick={() => (window.location.href = "/attendance")}
          />
          <QuickActionCard
            icon={Calendar}
            label="Apply Leave"
            color="bg-blue-500"
            onClick={() => (window.location.href = "/leaves")}
          />
          <QuickActionCard
            icon={FileText}
            label={isAdmin ? "Manage Payroll" : "View Payslip"}
            color="bg-purple-500"
            onClick={() => (window.location.href = "/payroll")}
          />
          <QuickActionCard
            icon={BookOpen}
            label="Training"
            color="bg-orange-500"
            onClick={() => (window.location.href = "/training")}
          />
          {complianceStats?.pendingAcknowledgments > 0 && (
            <QuickActionCard
              icon={Shield}
              label="Review Policies"
              color="bg-yellow-500"
              badge={complianceStats.pendingAcknowledgments}
              onClick={() => (window.location.href = "/compliance")}
            />
          )}
        </div>
      </div>

      {/* Alerts */}
      {isAdmin && stats.pendingLeaves > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">
              Pending Leave Approvals
            </h3>
          </div>
          <p className="text-red-800 mb-3">
            You have {stats.pendingLeaves} pending leave{" "}
            {stats.pendingLeaves === 1 ? "request" : "requests"} that require
            your attention.
          </p>
          <button
            onClick={() => (window.location.href = "/leaves?tab=pending")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Review Requests
          </button>
        </div>
      )}

      {!isAdmin && complianceStats?.pendingAcknowledgments > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-yellow-900">
              Pending Policy Acknowledgments
            </h3>
          </div>
          <p className="text-yellow-800 mb-3">
            You have {complianceStats.pendingAcknowledgments} pending policy{" "}
            {complianceStats.pendingAcknowledgments === 1
              ? "acknowledgment"
              : "acknowledgments"}{" "}
            that require your attention.
          </p>
          <button
            onClick={() => (window.location.href = "/compliance")}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Review Now
          </button>
        </div>
      )}

      {isAdmin && complianceStats?.documents?.expiringSoon > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-orange-900">
              Documents Expiring Soon
            </h3>
          </div>
          <p className="text-orange-800 mb-3">
            {complianceStats.documents.expiringSoon} compliance{" "}
            {complianceStats.documents.expiringSoon === 1
              ? "document"
              : "documents"}{" "}
            will expire in the next 30 days.
          </p>
          <button
            onClick={() => (window.location.href = "/compliance?tab=documents")}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            View Documents
          </button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Attendance marked
              </p>
              <p className="text-xs text-gray-500">Today at 9:00 AM</p>
            </div>
          </div>
          {stats.pendingLeaves > 0 && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {stats.pendingLeaves} leave request
                  {stats.pendingLeaves !== 1 ? "s" : ""} pending
                </p>
                <p className="text-xs text-gray-500">Needs approval</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ UpcomingEventsWidget Component
const UpcomingEventsWidget = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      const response = await apiService.getAllEvents({
        startDate: new Date().toISOString(),
        limit: 5,
      });
      setEvents(response.data?.events || []);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event) => (
        <div
          key={event._id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => (window.location.href = "/events")}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{event.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(event.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {event.location && (
                <p className="text-xs text-gray-400 mt-1">📍 {event.location}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
