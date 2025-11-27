import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import EmployeesPage from './pages/Employees';
import AttendancePage from './pages/Attendance';
import LeavesPage from './pages/Leaves';
import PayrollPage from './pages/Payroll';
import RecruitmentPage from './pages/Recruitment';
import OnboardingPage from './pages/Onboarding';
import OffboardingPage from './pages/Offboarding';
import AssetsPage from './pages/Assets';
import TrainingPage from './pages/Training';
import AnnouncementsPage from './pages/Announcements';
import RecognitionPage from './pages/Recognition';
import ReportsPage from './pages/Reports';
import ChatbotPage from './pages/Chatbot';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const renderPage = () => {
    switch (activeMenu) {
      case 'dashboard': return <Dashboard />;
      case 'employees': return <EmployeesPage />;
      case 'attendance': return <AttendancePage />;
      case 'leaves': return <LeavesPage />;
      case 'payroll': return <PayrollPage />;
      case 'recruitment': return <RecruitmentPage />;
      case 'onboarding': return <OnboardingPage />;
      case 'offboarding': return <OffboardingPage />;
      case 'assets': return <AssetsPage />;
      case 'training': return <TrainingPage />;
      case 'announcements': return <AnnouncementsPage />;
      case 'recognition': return <RecognitionPage />;
      case 'reports': return <ReportsPage />;
      case 'chatbot': return <ChatbotPage />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className='flex pt-16'>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
        />
        <main className='flex-1 min-w-0'>
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default MainApp;
