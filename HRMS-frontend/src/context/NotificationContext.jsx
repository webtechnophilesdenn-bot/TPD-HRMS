import React, { createContext, useState, useContext } from "react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const showSuccess = (message) => showNotification(message, "success");
  const showError = (message) => showNotification(message, "error");
  const showInfo = (message) => showNotification(message, "info");

  return (
    <NotificationContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white ${
              notif.type === "success"
                ? "bg-green-500"
                : notif.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          >
            {notif.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Create and export the hook
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export default NotificationContext;
