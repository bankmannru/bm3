import React, { useState, useEffect, createContext, useContext } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

// Создаем контекст для уведомлений
const ToastContext = createContext();

// Типы уведомлений
const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

// Провайдер уведомлений
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Добавление нового уведомления
  const addToast = (message, type = TOAST_TYPES.INFO, duration = 5000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    return id;
  };

  // Удаление уведомления
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // Вспомогательные функции для разных типов уведомлений
  const success = (message, duration) => addToast(message, TOAST_TYPES.SUCCESS, duration);
  const error = (message, duration) => addToast(message, TOAST_TYPES.ERROR, duration);
  const info = (message, duration) => addToast(message, TOAST_TYPES.INFO, duration);
  const warning = (message, duration) => addToast(message, TOAST_TYPES.WARNING, duration);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Хук для использования уведомлений
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Компонент для отображения уведомлений
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
      <style jsx>{`
        .toast-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 350px;
        }

        @media (max-width: 480px) {
          .toast-container {
            bottom: 10px;
            right: 10px;
            left: 10px;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

// Компонент уведомления
const Toast = ({ toast, removeToast }) => {
  const { id, message, type, duration } = toast;

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        removeToast(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, removeToast]);

  // Иконка в зависимости от типа уведомления
  const getIcon = () => {
    switch (type) {
      case TOAST_TYPES.SUCCESS:
        return <FaCheckCircle className="toast-icon" />;
      case TOAST_TYPES.ERROR:
        return <FaExclamationCircle className="toast-icon" />;
      case TOAST_TYPES.WARNING:
        return <FaExclamationCircle className="toast-icon" />;
      case TOAST_TYPES.INFO:
      default:
        return <FaInfoCircle className="toast-icon" />;
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        {getIcon()}
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={() => removeToast(id)}>
        <FaTimes />
      </button>
      <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />
      <style jsx>{`
        .toast {
          background-color: white;
          color: #333;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          padding: 12px 16px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          animation: slideIn 0.3s ease-out forwards;
          position: relative;
          overflow: hidden;
          border-left: 4px solid;
          width: 100%;
        }

        /* Темная тема */
        [data-theme="dark"] .toast {
          background-color: #2d2d2d;
          color: #e0e0e0;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .toast-success {
          border-left-color: var(--success-color, #4caf50);
        }

        .toast-error {
          border-left-color: var(--error-color, #f44336);
        }

        .toast-info {
          border-left-color: var(--primary-color, #2196f3);
        }

        .toast-warning {
          border-left-color: var(--warning-color, #ff9800);
        }

        .toast-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .toast-icon {
          font-size: 18px;
          margin-top: 2px;
        }

        .toast-success .toast-icon {
          color: var(--success-color, #4caf50);
        }

        .toast-error .toast-icon {
          color: var(--error-color, #f44336);
        }

        .toast-info .toast-icon {
          color: var(--primary-color, #2196f3);
        }

        .toast-warning .toast-icon {
          color: var(--warning-color, #ff9800);
        }

        .toast-message {
          font-size: 14px;
          line-height: 1.5;
          flex: 1;
        }

        .toast-close {
          background: none;
          border: none;
          color: #666;
          opacity: 0.6;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          margin-left: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        [data-theme="dark"] .toast-close {
          color: #ccc;
        }

        .toast-close:hover {
          opacity: 1;
        }

        .toast-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 100%;
          background-color: rgba(0, 0, 0, 0.1);
          animation: progress linear forwards;
        }

        .toast-success .toast-progress {
          background-color: var(--success-color, #4caf50);
        }

        .toast-error .toast-progress {
          background-color: var(--error-color, #f44336);
        }

        .toast-info .toast-progress {
          background-color: var(--primary-color, #2196f3);
        }

        .toast-warning .toast-progress {
          background-color: var(--warning-color, #ff9800);
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastProvider; 