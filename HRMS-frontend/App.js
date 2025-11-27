import React from 'react';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import MainApp from './MainApp';

const App = () => (
  <NotificationProvider>
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  </NotificationProvider>
);

export default App;
