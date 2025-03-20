import React, { useState, useContext } from 'react';
import { FaCheck, FaTimes, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import { ThemeContext } from '../App';
import { FaLightbulb } from 'react-icons/fa';

const ComponentsDemo = () => {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState('medium');
  const [modalTitle, setModalTitle] = useState('Демонстрация модального окна');

  // Функции для демонстрации уведомлений
  const showSuccessToast = () => toast.success('Операция успешно выполнена!');
  const showErrorToast = () => toast.error('Произошла ошибка при выполнении операции');
  const showInfoToast = () => toast.info('Информация о вашем аккаунте обновлена');
  const showWarningToast = () => toast.warning('Внимание! Ваша сессия скоро истечет');

  // Функция для открытия модального окна с выбранным размером
  const openModal = (size) => {
    setModalSize(size);
    setModalTitle(`Модальное окно (${size})`);
    setIsModalOpen(true);
  };

  return (
    <div className="components-demo">
      <h1 className="demo-title">Демонстрация компонентов</h1>
      
      <section className="demo-section">
        <h2 className="section-title">Уведомления (Toast)</h2>
        <p className="section-description">
          Компонент Toast позволяет отображать уведомления разных типов. Уведомления автоматически исчезают через 5 секунд.
        </p>
        
        <div className="demo-buttons">
          <button className="demo-button success" onClick={showSuccessToast}>
            <FaCheck /> Успех
          </button>
          <button className="demo-button error" onClick={showErrorToast}>
            <FaTimes /> Ошибка
          </button>
          <button className="demo-button info" onClick={showInfoToast}>
            <FaInfoCircle /> Информация
          </button>
          <button className="demo-button warning" onClick={showWarningToast}>
            <FaExclamationTriangle /> Предупреждение
          </button>
        </div>
      </section>
      
      <section className="demo-section">
        <h2 className="section-title">Модальные окна</h2>
        <p className="section-description">
          Компонент Modal позволяет отображать модальные окна разных размеров с поддержкой темной темы.
        </p>
        
        <div className="demo-buttons">
          <button className="demo-button" onClick={() => openModal('small')}>
            Маленькое окно
          </button>
          <button className="demo-button" onClick={() => openModal('medium')}>
            Среднее окно
          </button>
          <button className="demo-button" onClick={() => openModal('large')}>
            Большое окно
          </button>
          <button className="demo-button" onClick={() => openModal('fullscreen')}>
            Полноэкранное окно
          </button>
        </div>
      </section>
      
      <section className="demo-section">
        <h2 className="section-title">Темная тема</h2>
        <p className="section-description">
          Приложение поддерживает светлую и темную тему. Текущая тема: <strong>{darkMode ? 'Темная' : 'Светлая'}</strong>
        </p>
        
        <div className="demo-buttons">
          <button className="demo-button theme-toggle" onClick={toggleTheme}>
            <FaLightbulb /> Переключить тему
          </button>
        </div>
      </section>
      
      {/* Модальное окно */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        size={modalSize}
      >
        <div className="modal-demo-content">
          <h3>Содержимое модального окна</h3>
          <p>Это демонстрация модального окна размера <strong>{modalSize}</strong>.</p>
          <p>Модальные окна поддерживают темную тему и автоматически адаптируются под текущую тему приложения.</p>
          
          <div className="modal-features">
            <div className="feature">
              <FaCheck className="feature-icon" />
              <div className="feature-text">
                <h4>Закрытие по Escape</h4>
                <p>Нажмите клавишу Escape для закрытия</p>
              </div>
            </div>
            
            <div className="feature">
              <FaCheck className="feature-icon" />
              <div className="feature-text">
                <h4>Закрытие по клику вне окна</h4>
                <p>Кликните за пределами окна для закрытия</p>
              </div>
            </div>
            
            <div className="feature">
              <FaCheck className="feature-icon" />
              <div className="feature-text">
                <h4>Адаптивный дизайн</h4>
                <p>Автоматически адаптируется под размер экрана</p>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button className="modal-button primary" onClick={() => setIsModalOpen(false)}>
              Закрыть
            </button>
          </div>
        </div>
      </Modal>
      
      <style jsx>{`
        .components-demo {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .demo-title {
          font-size: 2.5rem;
          margin-bottom: 40px;
          text-align: center;
          color: var(--text-color);
        }
        
        .demo-section {
          background-color: var(--card-bg);
          border-radius: 8px;
          box-shadow: var(--card-shadow);
          padding: 30px;
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 1.8rem;
          margin-top: 0;
          margin-bottom: 15px;
          color: var(--text-color);
        }
        
        .section-description {
          font-size: 1.1rem;
          margin-bottom: 25px;
          color: var(--text-color);
          opacity: 0.9;
        }
        
        .demo-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }
        
        .demo-button {
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          background-color: #4361ee;
          color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .demo-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .demo-button.success {
          background-color: #4caf50;
          color: white;
        }
        
        .demo-button.error {
          background-color: #f44336;
          color: white;
        }
        
        .demo-button.info {
          background-color: #2196f3;
          color: white;
        }
        
        .demo-button.warning {
          background-color: #ff9800;
          color: white;
        }
        
        .demo-button.theme-toggle {
          background-color: #4895ef;
          color: white;
        }
        
        .modal-demo-content {
          color: var(--text-color, #333333);
          background-color: inherit;
        }
        
        .modal-demo-content h3 {
          font-size: 1.5rem;
          margin-top: 0;
          margin-bottom: 15px;
        }
        
        .modal-features {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .feature {
          display: flex;
          align-items: flex-start;
          gap: 15px;
          background-color: rgba(0, 0, 0, 0.03); /* Легкий фон для элементов */
          padding: 15px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .feature:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        
        html[data-theme="dark"] .feature {
          background-color: rgba(255, 255, 255, 0.05); /* Легкий фон для элементов в темной теме */
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .feature-icon {
          color: var(--success-color, #4caf50);
          font-size: 1.2rem;
          margin-top: 3px;
        }
        
        .feature-text h4 {
          margin: 0 0 5px 0;
          font-size: 1.1rem;
          color: var(--text-color, #333333);
        }
        
        .feature-text p {
          margin: 0;
          color: var(--text-color, #333333);
          opacity: 0.8;
          font-size: 0.9rem;
        }
        
        html[data-theme="dark"] .feature-text h4 {
          color: var(--text-color, #e0e0e0);
        }
        
        html[data-theme="dark"] .feature-text p {
          color: var(--text-color, #e0e0e0);
        }
        
        .modal-actions {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
          gap: 15px;
        }
        
        .modal-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .modal-button.primary {
          background-color: #4361ee;
          color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .modal-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        @media (max-width: 768px) {
          .demo-buttons {
            flex-direction: column;
          }
          
          .demo-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ComponentsDemo; 