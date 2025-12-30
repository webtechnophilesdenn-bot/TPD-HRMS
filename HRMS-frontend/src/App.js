import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Navbar from "./components/common/Navbar";
import Sidebar from "./components/common/Sidebar";
import Login from "./components/auth/Login";

// Dashboard & Core Pages
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

// Other Feature Pages
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

// ✅ EXPENSE PAGES
import ExpensesPage from './pages/Expenses';
import ExpenseApproval from './pages/ExpenseApproval'; // ✅ ADDED - HR/Admin view
import BirthdayCalendar from './pages/BirthdayCalendar';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [meetingId, setMeetingId] = useState(null);

  const renderPage = () => {
    // Special case for meeting room
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

      // ==================== EXPENSE ROUTES ====================
      // ✅ MY EXPENSES - All users can create/view their expenses
      case "expenses":
        return <ExpensesPage />;

      // ✅ EXPENSE APPROVAL - Only HR and Admin can approve
      case "expense-approval":
        if (user?.role === "hr" || user?.role === "admin") {
          return <ExpenseApproval />;
        } else {
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md mx-auto">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-4">Only HR and Admin can access expense approval.</p>
                <button 
                  onClick={() => setActiveMenu('expenses')}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go to My Expenses
                </button>
              </div>
            </div>
          );
        }
      // ==================== END EXPENSE ROUTES ====================

      // ✅ BIRTHDAYS ROUTE
      case "birthdays":
        return <BirthdayCalendar />;

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium text-lg">Loading HRMS...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we set things up</p>
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
      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeMenu={activeMenu}
          setActiveMenu={(menu) => {
            setActiveMenu(menu);
            if (menu !== "meeting-room") {
              setMeetingId(null);
            }
          }}
        />
        <main className="flex-1 min-w-0 lg:ml-64 transition-all duration-300">
          <div className=" pt-2 ">
            {renderPage()}
          </div>
        </main>
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
