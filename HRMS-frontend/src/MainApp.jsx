// HRMS-frontend/src/MainApp.jsx
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Login from './pages/Login';

// Existing Pages
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
import CompliancePage from './pages/Compliance';

// ✅ NEW: Feature Pages
import ExpensesPage from './pages/Expenses';
import ExpenseApproval from './pages/ExpenseApproval'; // ✅ NEW - HR/Admin view
import EventsPage from './pages/Events';
import BirthdayCalendar from './pages/BirthdayCalendar';
import MeetingsPage from './pages/Meetings';
import ContractsPage from './pages/Contracts';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const renderPage = () => {
    switch (activeMenu) {
      case 'dashboard': 
        return <Dashboard />;
      
      case 'employees': 
        return <EmployeesPage />;
      
      case 'attendance': 
        return <AttendancePage />;
      
      case 'leaves': 
        return <LeavesPage />;
      
      case 'payroll': 
        return <PayrollPage />;
      
      case 'recruitment': 
        return <RecruitmentPage />;
      
      case 'onboarding': 
        return <OnboardingPage />;
      
      case 'offboarding': 
        return <OffboardingPage />;
      
      case 'assets': 
        return <AssetsPage />;
      
      case 'training': 
        return <TrainingPage />;
      
      case 'announcements': 
        return <AnnouncementsPage />;
      
      case 'recognition': 
        return <RecognitionPage />;
      
      case 'compliance': 
        return <CompliancePage />;
      
      case 'reports': 
        return <ReportsPage />;
      
      case 'chatbot': 
        return <ChatbotPage />;
      
      case 'contracts': 
        return <ContractsPage />;
      
      // ==================== EXPENSE ROUTES ====================
      // ✅ MY EXPENSES - All users
      case 'expenses': 
        return <ExpensesPage />;
      
      // ✅ EXPENSE APPROVAL - HR/Admin only
      case 'expense-approval': 
        if (user?.role === 'hr' || user?.role === 'admin') {
          return <ExpenseApproval />;
        } else {
          return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600">Only HR and Admin can access expense approval.</p>
                <button 
                  onClick={() => setActiveMenu('expenses')}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go to My Expenses
                </button>
              </div>
            </div>
          );
        }
      // ==================== END EXPENSE ROUTES ====================
      
      // ✅ OTHER NEW FEATURES
      case 'events': 
        return <EventsPage />;
      
      case 'birthdays': 
        return <BirthdayCalendar />;
      
      case 'meetings': 
        return <MeetingsPage />;
      
      default: 
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100'>
        <div className='text-center'>
          <div className='animate-spin h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4'></div>
          <p className='text-gray-700 font-medium text-lg'>Loading HRMS...</p>
          <p className='text-gray-500 text-sm mt-2'>Please wait while we set things up</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        user={user}
      />
      <div className='flex'>
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          user={user}
        />
        <main className='flex-1 min-w-0 lg:ml-64 transition-all duration-300'>
          <div className='p-6'>
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainApp;
