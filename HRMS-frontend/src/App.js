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
import PayrollPage from "./components/payroll/PayrollPage";
import RecruitmentPage from "./components/recruitment/RecruitmentPage";
import AssetsPage from "./components/assets/AssetsPage";
import TrainingPage from "./components/training/TrainingPage";
import AnnouncementsPage from "./components/announcements/AnnouncementsPage";
import RecognitionPage from "./components/recognition/RecognitionPage";
import ReportsPage from "./components/reports/ReportsPage";
import ChatbotPage from "./components/chatbot/ChatbotPage";
import OnboardingPage from "./components/onboarding/OnboardingPage";
import OffboardingPage from "./components/offboarding/OffboardingPage";
import CompliancePage from "./components/compliancePage/CompliancePage"; // ✅ Add this import

const AppContent = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const renderPage = () => {
    switch (activeMenu) {
      case "dashboard":
        return <Dashboard />;
      case "employees":
        return <EmployeesPage />;
      case "attendance":
        return <AttendancePage />;
      case "leaves":
        return <LeavesPage />;
      case "payroll":
        return <PayrollPage />;
      case "recruitment":
        return <RecruitmentPage />;
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
      case "compliance": // ✅ Add this case
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
      <div className="flex pt-16">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
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
