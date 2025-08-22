import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "flex items-center p-4 rounded-lg shadow-lg max-w-sm w-full transform transition-all duration-300";
    const animations = isLeaving 
      ? "translate-x-full opacity-0" 
      : "translate-x-0 opacity-100";

    const typeStyles = {
      success: "bg-green-50 border border-green-200 text-green-800",
      error: "bg-red-50 border border-red-200 text-red-800", 
      warning: "bg-yellow-50 border border-yellow-200 text-yellow-800",
      info: "bg-blue-50 border border-blue-200 text-blue-800"
    };

    return `${baseStyles} ${typeStyles[type]} ${animations}`;
  };

  const getIcon = () => {
    const iconProps = { size: 20, className: "flex-shrink-0" };
    
    switch (type) {
      case 'success': return <CheckCircle {...iconProps} className="text-green-500" />;
      case 'error': return <XCircle {...iconProps} className="text-red-500" />;
      case 'warning': return <AlertCircle {...iconProps} className="text-yellow-500" />;
      default: return <Info {...iconProps} className="text-blue-500" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <div className="ml-3 flex-1 text-sm font-medium">
        {message}
      </div>
      <button
        onClick={() => {
          setIsLeaving(true);
          setTimeout(() => {
            setIsVisible(false);
            onClose?.();
          }, 300);
        }}
        className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;