import React, { useState } from 'react';
import { FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

function AlphaInfo({ onClose }) {
  return (
    <div className="alpha-info-modal">
      <div className="alpha-info-content">
        <div className="alpha-info-header">
          <h2><FaExclamationTriangle className="alpha-icon" /> Информация об альфа-версии</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="alpha-info-body">
          <p className="intro">
            Вы используете <strong>альфа-версию</strong> сайта Банк Маннру. Для доступа к функциям сайта требуется ввод кода тестера.
          </p>
          
          <div className="info-section">
            <h3><FaInfoCircle /> Как отключить ограничения через Firestore</h3>
            <ol className="steps-list">
              <li>Войдите в консоль Firebase для вашего проекта</li>
              <li>Перейдите в раздел "Firestore Database"</li>
              <li>Найдите коллекцию <code>settings</code></li>
              <li>Откройте документ <code>alpha</code></li>
              <li>Измените поле <code>enabled</code> на <code>false</code></li>
              <li>Или измените поле <code>testerCode</code> на пустую строку</li>
              <li>Сохраните изменения</li>
            </ol>
          </div>
          
          <div className="info-section">
            <h3>Ограничения альфа-версии</h3>
            <ul className="restrictions-list">
              <li>Требуется ввод кода тестера при авторизации</li>
              <li>Отображаются информационные баннеры на всех страницах</li>
              <li>Некоторые функции могут быть недоступны или работать некорректно</li>
            </ul>
          </div>
          
          <div className="info-section">
            <h3>Контакты для обратной связи</h3>
            <p>
              Если у вас возникли вопросы или вы обнаружили ошибки, пожалуйста, свяжитесь с нами:
            </p>
            <p className="contact-email">
              <strong>Email:</strong> alpha-support@mannru.ru
            </p>
          </div>
        </div>
        
        <div className="alpha-info-footer">
          <button className="close-btn" onClick={onClose}>Закрыть</button>
        </div>
      </div>

      <style jsx>{`
        .alpha-info-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          padding: 1rem;
        }
        
        .alpha-info-content {
          background-color: white;
          border-radius: 8px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .alpha-info-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .alpha-info-header h2 {
          margin: 0;
          color: #f44336;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .alpha-icon {
          color: #f44336;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #9e9e9e;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background-color 0.3s;
        }
        
        .close-button:hover {
          background-color: #f5f5f5;
          color: #f44336;
        }
        
        .alpha-info-body {
          padding: 1.5rem;
        }
        
        .intro {
          font-size: 1.1rem;
          line-height: 1.5;
          color: #424242;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eeeeee;
        }
        
        .info-section {
          margin-bottom: 2rem;
        }
        
        .info-section h3 {
          color: #1a237e;
          margin-top: 0;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .steps-list, .restrictions-list {
          padding-left: 1.5rem;
          margin: 0;
          line-height: 1.6;
        }
        
        .steps-list li, .restrictions-list li {
          margin-bottom: 0.5rem;
        }
        
        code {
          background-color: #f5f5f5;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9rem;
        }
        
        .contact-email {
          background-color: #e8f5e9;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
        }
        
        .alpha-info-footer {
          padding: 1.5rem;
          border-top: 1px solid #e0e0e0;
          text-align: right;
        }
        
        .close-btn {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .close-btn:hover {
          background-color: #3f51b5;
        }
        
        @media (max-width: 768px) {
          .alpha-info-content {
            max-width: 100%;
            max-height: 100%;
            border-radius: 0;
          }
          
          .alpha-info-modal {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default AlphaInfo; 