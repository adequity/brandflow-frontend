// src/components/ui/AlertModal.jsx
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const AlertModal = ({ 
  isOpen, 
  onClose, 
  title = "알림", 
  message = "", 
  type = "info", // success, error, warning, info
  buttonText = "확인"
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-600" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-yellow-600" />;
      case 'info':
        return <Info className="w-12 h-12 text-blue-600" />;
      default:
        return <Info className="w-12 h-12 text-blue-600" />;
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* 배경 오버레이 */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* 모달 위치 조정을 위한 더미 요소 */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* 모달 컨테이너 */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            {/* 아이콘 */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 mb-4">
              {getIcon()}
            </div>
            
            {/* 제목 */}
            <div className="text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                {title}
              </h3>
              
              {/* 메시지 */}
              <div className="text-sm text-gray-500 mb-6">
                {typeof message === 'string' ? (
                  <p className="whitespace-pre-wrap">{message}</p>
                ) : (
                  message
                )}
              </div>
            </div>
          </div>

          {/* 확인 버튼 */}
          <div className="flex justify-center">
            <button
              type="button"
              className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${getButtonStyle()}`}
              onClick={onClose}
              autoFocus
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;