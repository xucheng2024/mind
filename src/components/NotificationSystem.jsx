import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaTimes,
  FaExclamationCircle 
} from 'react-icons/fa';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Notification context
const NotificationContext = React.createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: NOTIFICATION_TYPES.INFO,
      title: '',
      message: '',
      duration: 5000,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (message, title = 'Success') => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title,
      message,
      duration: 3000
    });
  };

  const error = (message, title = 'Error') => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title,
      message,
      duration: 6000
    });
  };

  const warning = (message, title = 'Warning') => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title,
      message,
      duration: 4000
    });
  };

  const info = (message, title = 'Info') => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title,
      message,
      duration: 4000
    });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Notification container component
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <FaCheckCircle className="w-5 h-5 text-green-500" />;
      case NOTIFICATION_TYPES.ERROR:
        return <FaExclamationCircle className="w-5 h-5 text-red-500" />;
      case NOTIFICATION_TYPES.WARNING:
        return <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />;
      case NOTIFICATION_TYPES.INFO:
        return <FaInfoCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <FaInfoCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getColors = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-green-50 border-green-200 text-green-800';
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-red-50 border-red-200 text-red-800';
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case NOTIFICATION_TYPES.INFO:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            className={`max-w-sm w-full bg-white rounded-lg shadow-lg border p-4 ${getColors(notification.type)}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                {notification.title && (
                  <h4 className="text-sm font-medium mb-1">
                    {notification.title}
                  </h4>
                )}
                <p className="text-sm">
                  {notification.message}
                </p>
              </div>
              <div className="flex-shrink-0 ml-3">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationProvider; 