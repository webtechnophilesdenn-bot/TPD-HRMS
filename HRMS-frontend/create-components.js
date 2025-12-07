const fs = require('fs');
const path = require('path');

const files = {
  // Hooks
  'src/hooks/useAuth.js': `import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};`,

  'src/hooks/useNotification.js': `import { useContext } from 'react';
import { NotificationContext } from '../contexts/NotificationContext';

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};`,

  // Contexts
  'src/contexts/AuthContext.jsx': `import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const mockUser = { name: 'Admin User', email };
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};`,

  'src/contexts/NotificationContext.jsx': `import React, { createContext, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const showSuccess = (message) => showNotification(message, 'success');
  const showError = (message) => showNotification(message, 'error');
  const showInfo = (message) => showNotification(message, 'info');

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map(notif => {
          const bgColor = notif.type === 'success' ? 'bg-green-500' : notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500';
          return (
            <div key={notif.id} className={\`px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 \${bgColor}\`}>
              {notif.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="flex-1">{notif.message}</span>
              <button onClick={() => removeNotification(notif.id)} className="hover:opacity-75">
                <X size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};`,

  // Components
  'src/components/common/Navbar/Navbar.jsx': `import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-gray-100">
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-indigo-600">HR Management</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-md hover:bg-gray-100 relative">
              <Bell className="h-6 w-6 text-gray-600" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <User size={20} />
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
            </div>
            
            <button onClick={logout} className="p-2 rounded-md hover:bg-gray-100" title="Logout">
              <LogOut className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;`,

  'src/components/common/Navbar/index.js': `export { default } from './Navbar';`,

  'src/components/common/Sidebar/Sidebar.jsx': `import React from 'react';
import { Home, Users, Clock, Calendar, DollarSign, Briefcase, Package, BookOpen, Megaphone, Award, FileText, Bot, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, activeMenu, setActiveMenu }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leaves', label: 'Leaves', icon: Calendar },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
    { id: 'onboarding', label: 'Onboarding', icon: Users },
    { id: 'offboarding', label: 'Offboarding', icon: Users },
    { id: 'assets', label: 'Assets', icon: Package },
    { id: 'training', label: 'Training', icon: BookOpen },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'recognition', label: 'Recognition', icon: Award },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'chatbot', label: 'AI Assistant', icon: Bot },
  ];

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    onClose();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose}></div>}
      
      <aside className={\`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg transform transition-transform duration-300 z-40 \${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0\`}>
        <div className="flex items-center justify-between p-4 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <nav className="p-4 overflow-y-auto h-full">
          <ul className="space-y-2">
            {menuItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={\`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors \${activeMenu === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'}\`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;`,

  'src/components/common/Sidebar/index.js': `export { default } from './Sidebar';`,

  'src/components/common/StatCard/StatCard.jsx': `import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, bgColor = 'bg-indigo-50', iconColor = 'text-indigo-600' }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={\`text-sm mt-1 \${trend.isPositive ? 'text-green-600' : 'text-red-600'}\`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={\`\${bgColor} p-3 rounded-lg\`}>
          <Icon className={\`h-6 w-6 \${iconColor}\`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;`,

  'src/components/common/StatCard/index.js': `export { default } from './StatCard';`,

  // Pages
  'src/pages/Dashboard/Dashboard.jsx': `import React from 'react';
import { Users, Clock, Calendar, DollarSign } from 'lucide-react';
import StatCard from '../../components/common/StatCard';

const Dashboard = () => {
  const stats = [
    { title: 'Total Employees', value: '248', icon: Users, trend: { value: '+12%', isPositive: true } },
    { title: 'Present Today', value: '235', icon: Clock, trend: { value: '94.8%', isPositive: true }, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { title: 'Pending Leaves', value: '12', icon: Calendar, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { title: 'Monthly Payroll', value: '$125K', icon: DollarSign, bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-700">John Doe checked in at 9:00 AM</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-gray-700">New leave request from Sarah Smith</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg font-medium transition">Add Employee</button>
            <button className="p-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg font-medium transition">Mark Attendance</button>
            <button className="p-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-lg font-medium transition">Process Leave</button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg font-medium transition">Run Payroll</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;`,

  'src/pages/Dashboard/index.js': `export { default } from './Dashboard';`,

  'src/pages/Login/Login.jsx': `import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showError, showSuccess } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      showSuccess('Login successful!');
    } catch (error) {
      showError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HR Management</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="you@example.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="password" required />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">Demo: admin@example.com / password</p>
      </div>
    </div>
  );
};

export default Login;`,

  'src/pages/Login/index.js': `export { default } from './Login';`,
};

// Create template pages
const pageTemplates = ['Employees', 'Attendance', 'Leaves', 'Payroll', 'Recruitment', 'Onboarding', 'Offboarding', 'Assets', 'Training', 'Announcements', 'Recognition', 'Reports', 'Chatbot'];

pageTemplates.forEach(page => {
  files[`src/pages/${page}/${page}Page.jsx`] = `import React from 'react';

const ${page}Page = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">${page}</h1>
        <p className="text-gray-600">Manage ${page.toLowerCase()} information</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">This page is under development.</p>
      </div>
    </div>
  );
};

export default ${page}Page;`;

  files[`src/pages/${page}/index.js`] = `export { default } from './${page}Page';`;
});

// Write all files
Object.entries(files).forEach(([filepath, content]) => {
  const fullPath = path.join(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Created ${filepath}`);
});

console.log('\n========================================');
console.log('✓ ALL FILES CREATED SUCCESSFULLY!');
console.log('========================================\n');
console.log('Next steps:');
console.log('1. Run: npm start');
console.log('2. Open http://localhost:3000');
console.log('3. Login with: admin@example.com / password\n');
