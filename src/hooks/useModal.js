// src/hooks/useModal.js
import { useState, useCallback } from 'react';

export const useModal = () => {
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onClose: () => {}
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {},
    onClose: () => {},
    loading: false,
    confirmText: '확인',
    cancelText: '취소'
  });

  const showAlert = useCallback((options) => {
    const {
      title = '알림',
      message = '',
      type = 'info',
      buttonText = '확인'
    } = typeof options === 'string' ? { message: options } : options;

    return new Promise((resolve) => {
      setAlertModal({
        isOpen: true,
        title,
        message,
        type,
        buttonText,
        onClose: () => {
          setAlertModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  }, []);

  const showConfirm = useCallback((options) => {
    const {
      title = '확인',
      message = '이 작업을 계속하시겠습니까?',
      type = 'warning',
      confirmText = '확인',
      cancelText = '취소'
    } = typeof options === 'string' ? { message: options } : options;

    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        loading: false,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onClose: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const showAsyncConfirm = useCallback((options) => {
    const {
      title = '확인',
      message = '이 작업을 계속하시겠습니까?',
      type = 'warning',
      confirmText = '확인',
      cancelText = '취소',
      onConfirm
    } = typeof options === 'string' ? { message: options } : options;

    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        loading: false,
        onConfirm: async () => {
          if (onConfirm) {
            setConfirmModal(prev => ({ ...prev, loading: true }));
            try {
              await onConfirm();
              setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
              resolve(true);
            } catch (error) {
              setConfirmModal(prev => ({ ...prev, loading: false }));
              throw error;
            }
          } else {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            resolve(true);
          }
        },
        onClose: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    // Modal states
    alertModal,
    confirmModal,
    
    // Helper methods
    showAlert,
    showConfirm,
    showAsyncConfirm,
    closeAlert,
    closeConfirm,
    
    // Convenient methods for different types
    showSuccess: useCallback((message, title = '성공') => 
      showAlert({ message, title, type: 'success' }), [showAlert]),
    
    showError: useCallback((message, title = '오류') => 
      showAlert({ message, title, type: 'error' }), [showAlert]),
    
    showWarning: useCallback((message, title = '경고') => 
      showAlert({ message, title, type: 'warning' }), [showAlert]),
    
    showInfo: useCallback((message, title = '정보') => 
      showAlert({ message, title, type: 'info' }), [showAlert]),
    
    confirmDelete: useCallback((message = '이 항목을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.') =>
      showConfirm({
        title: '삭제 확인',
        message,
        type: 'error',
        confirmText: '삭제',
        cancelText: '취소'
      }), [showConfirm])
  };
};

export default useModal;