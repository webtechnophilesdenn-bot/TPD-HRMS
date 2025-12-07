import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";
import EmployeesPage from "./components/employees/EmployeesPage";
import AttendancePage from "./components/attendance/AttendancePage";
import LeavesPage from "./components/leaves/LeavesPage";
import ContractsPage from "./components/legal/ContractsPage";

// Meeting Pages
import MeetingsPage from './pages/MeetingsPage';
import MeetingRoom from './pages/MeetingRoom';

// Payroll Pages
import PayrollDashboard from "./components/payroll/PayrollDashboard";
import EmployeePayslipView from "./components/payroll/EmployeePayslipView";
import SalaryStructureView from "./components/payroll/SalaryStructureView";

import RecruitmentPage from "./components/recruitment/RecruitmentPage";
import AssetsPage from "./components/assets/AssetsPage";
import TrainingPage from "./components/training/TrainingPage";
import AnnouncementsPage from "./components/announcements/AnnouncementsPage";
import RecognitionPage from "./components/recognition/RecognitionPage";
import ReportsPage from "./components/reports/ReportsPage";
import ChatbotPage from "./components/chatbot/ChatbotPage";
import OnboardingPage from "./components/onboarding/OnboardingPage";
import OffboardingPage from "./components/offboarding/OffboardingPage";
import CompliancePage from "./components/compliancePage/CompliancePage";
import EventsPage from "./components/Events/EventsPage";

const AppContent = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [meetingId, setMeetingId] = useState(null); // For meeting room navigation

  const renderPage = () => {
    // Special case for meeting room (needs meetingId)
    if (activeMenu === "meeting-room" && meetingId) {
      return <MeetingRoom meetingId={meetingId} />;
    }

    switch (activeMenu) {
      case "dashboard":
        return <Dashboard />;

      case "employees":
        return <EmployeesPage />;

      case "attendance":
        return <AttendancePage />;

      case "leaves":
        return <LeavesPage />;

      // ==================== PAYROLL ROUTES ====================
      case "payroll":
        // Show different views based on user role
        if (user?.role === "admin" || user?.role === "hr") {
          return <PayrollDashboard />;
        } else {
          return <EmployeePayslipView />;
        }
      case "payroll-payslips":
        return <EmployeePayslipView />;
      case "payroll-salary-structure":
        return <SalaryStructureView />;
      case "payroll-management":
        return <PayrollDashboard />;
      // ==================== END PAYROLL ROUTES ====================

      case "recruitment":
        return <RecruitmentPage />;

      // ==================== EVENTS ROUTE ====================
      case "events":
        return <EventsPage />;
      // ==================== END EVENTS ROUTE ====================

      // ==================== MEETINGS ROUTE ====================
      case "meetings":
        return <MeetingsPage onJoinMeeting={(id) => {
          setMeetingId(id);
          setActiveMenu("meeting-room");
        }} />;
      // ==================== END MEETINGS ROUTE ====================

      case "contracts":
        return (
          <ContractsPage
            isAdmin={user?.role === "admin" || user?.role === "hr"}
          />
        );

      case "onboarding":
        return <OnboardingPage />;

      case "offboarding":
        return <OffboardingPage />;

      case "assets":
        return <AssetsPage />;

      case "training":
        return <TrainingPage />;

      case "announcements":
        return <AnnouncementsPage />;

      case "recognition":
        return <RecognitionPage />;

      case "compliance":
        return <CompliancePage />;

      case "reports":
        return <ReportsPage />;

      case "chatbot":
        return <ChatbotPage />;

      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex ">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeMenu={activeMenu}
          setActiveMenu={(menu) => {
            setActiveMenu(menu);
            // Reset meetingId when changing menu
            if (menu !== "meeting-room") {
              setMeetingId(null);
            }
          }}
        />
        <main className="flex-1 min-w-0">{renderPage()}</main>
      </div>
    </div>
  );
};

const App = () => (
  <NotificationProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </NotificationProvider>
);

export default App;
