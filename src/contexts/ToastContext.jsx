import React, { createContext, useContext, useState } from 'react';
import ToastContainer from '../components/ui/ToastContainer';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);
    
    // 자동 제거
    setTimeout(() => {
      removeToast(id);
    }, duration + 300); // 애니메이션 시간 추가
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, duration = 3000) => {
    addToast(message, 'success', duration);
  };

  const showError = (message, duration = 5000) => {
    addToast(message, 'error', duration);
  };

  const showWarning = (message, duration = 4000) => {
    addToast(message, 'warning', duration);
  };

  const showInfo = (message, duration = 3000) => {
    addToast(message, 'info', duration);
  };

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};