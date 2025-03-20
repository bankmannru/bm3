import React, { useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { ThemeContext } from '../App';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium', 
  showCloseButton = true,
  closeOnEsc = true,
  closeOnOverlayClick = true
}) => {
  const { darkMode } = useContext(ThemeContext);

  useEffect(() => {
    // Блокируем прокрутку страницы при открытии модального окна
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    // Обработчик нажатия клавиши Escape
    const handleEscKey = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen && closeOnEsc) {
      window.addEventListener('keydown', handleEscKey);
    }

    // Очистка при размонтировании
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Обработчик клика по оверлею
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Определяем размер модального окна
  const getModalSize = () => {
    switch (size) {
      case 'small':
        return {
          width: 'max(300px, 30%)',
          maxHeight: '70vh'
        };
      case 'large':
        return {
          width: 'max(800px, 80%)',
          maxHeight: '90vh'
        };
      case 'fullscreen':
        return {
          width: '95%',
          height: '95vh',
          maxHeight: '95vh'
        };
      case 'medium':
      default:
        return {
          width: 'max(500px, 50%)',
          maxHeight: '80vh'
        };
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className={`modal-overlay ${darkMode ? 'dark' : 'light'}`} onClick={handleOverlayClick}>
      <div className="modal-container" style={getModalSize()} data-size={size}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {showCloseButton && (
            <button className="modal-close" onClick={onClose}>
              <FaTimes />
            </button>
          )}
        </div>
        <div className="modal-content">
          {children}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-container {
          background-color: var(--card-bg, #ffffff);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--card-shadow, 0 4px 20px rgba(0, 0, 0, 0.15));
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
          max-width: 95%;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .light .modal-container {
          background-color: #ffffff;
          color: #333333;
        }

        .dark .modal-container {
          background-color: #1e1e1e;
          color: #e0e0e0;
          border-color: #333333;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          background-color: inherit;
        }

        .modal-title {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-color);
          font-weight: 600;
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--text-color, #333333);
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 50%;
          opacity: 0.7;
          transition: opacity 0.2s, background-color 0.2s;
          width: 32px;
          height: 32px;
        }

        .modal-close:hover {
          opacity: 1;
          background-color: rgba(0, 0, 0, 0.05);
        }

        .dark .modal-close:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .modal-content {
          padding: 20px;
          overflow-y: auto;
          color: var(--text-color, #333333);
          flex: 1;
          background-color: inherit;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .modal-container {
            width: 100% !important;
            max-height: 90vh !important;
            border-radius: 10px !important;
          }
        }
        
        /* Дополнительные стили для улучшения внешнего вида */
        .modal-container:focus {
          outline: none;
        }
        
        /* Улучшаем внешний вид для разных размеров модальных окон */
        .modal-container[data-size="small"] {
          border-radius: 10px;
        }
        
        .modal-container[data-size="large"],
        .modal-container[data-size="fullscreen"] {
          border-radius: 14px;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default Modal; 