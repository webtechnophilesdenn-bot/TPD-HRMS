import React, { createContext, useState, useEffect, useContext } from "react";
import { apiService } from "../services/apiService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = apiService.getProfile();

    if (token && savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await apiService.login(email, password);
    setUser(response.data.user);
    return response;
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  // NEW: Function to refresh user data
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await apiService.getMyProfile();
      
      if (response.success) {
        const employeeData = response.data;
        
        // Update user state with fresh employee data
        setUser(prevUser => ({
          ...prevUser,
          employee: {
            ...prevUser?.employee,
            name: `${employeeData.firstName} ${employeeData.lastName}`,
            firstName: employeeData.firstName,
            lastName: employeeData.lastName,
            email: employeeData.personalEmail,
            employeeId: employeeData.employeeId,
            ...employeeData
          }
        }));
        
        // Also update localStorage profile
        const currentProfile = apiService.getProfile();
        if (currentProfile) {
          localStorage.setItem('userProfile', JSON.stringify({
            ...currentProfile,
            employee: {
              ...currentProfile.employee,
              name: `${employeeData.firstName} ${employeeData.lastName}`,
              firstName: employeeData.firstName,
              lastName: employeeData.lastName,
              email: employeeData.personalEmail,
              employeeId: employeeData.employeeId,
              ...employeeData
            }
          }));
        }
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Create and export the hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
