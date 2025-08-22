// src/components/ui/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'blue', 
  text = '', 
  className = '',
  overlay = false 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8',
    xlarge: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };

  const spinner = (
    <div className={`inline-flex items-center ${className}`}>
      <div 
        className={`
          animate-spin rounded-full border-2 border-t-transparent 
          ${sizeClasses[size]} 
          ${colorClasses[color]}
          ${text ? 'mr-2' : ''}
        `}
      />
      {text && (
        <span className={`text-${color}-600 font-medium`}>
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 shadow-xl">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export const LoadingButton = ({ 
  loading, 
  children, 
  disabled = false,
  className = '',
  loadingText = '처리 중...',
  ...props 
}) => {
  return (
    <button
      {...props}
      disabled={loading || disabled}
      className={`relative ${className} ${loading || disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner 
            size="small" 
            color="white" 
            text={loadingText}
            className="text-white"
          />
        </div>
      )}
      <span className={loading ? 'invisible' : ''}>
        {children}
      </span>
    </button>
  );
};

export const LoadingOverlay = ({ 
  loading, 
  children, 
  text = '로딩 중...',
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <LoadingSpinner 
            size="large" 
            color="blue" 
            text={text}
          />
        </div>
      )}
    </div>
  );
};

export const LoadingCard = ({ 
  loading = true,
  rows = 3,
  className = ''
}) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`h-4 bg-gray-200 rounded ${i < rows - 1 ? 'mb-3' : ''}`} 
             style={{ width: `${Math.random() * 40 + 60}%` }} />
      ))}
    </div>
  );
};

export const LoadingTable = ({ 
  loading = true,
  columns = 4,
  rows = 5,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg border overflow-hidden ${className}`}>
      <div className="bg-gray-50 px-6 py-3 border-b">
        <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded animate-pulse" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 border-b last:border-b-0">
          <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-gray-200 rounded animate-pulse"
                style={{ width: `${Math.random() * 30 + 70}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;