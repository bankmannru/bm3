import React, { useState, useEffect } from 'react';
import { firestore, checkAlphaStatus } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { FaLock, FaUnlock, FaKey, FaCheck, FaTimes } from 'react-icons/fa';

function AdminPanel({ onClose }) {
  const [alphaStatus, setAlphaStatus] = useState({
    isAlpha: true,
    testerCode: '',
    loading: true
  });
  const [newTesterCode, setNewTesterCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Загружаем текущий alpha-статус
    const loadAlphaStatus = async () => {
      try {
        const result = await checkAlphaStatus();
        setAlphaStatus({
          isAlpha: result.isAlpha,
          testerCode: result.testerCode,
          loading: false
        });
        setNewTesterCode(result.testerCode);
      } catch (err) {
        console.error('Ошибка при загрузке alpha-статуса:', err);
        setError('Не удалось загрузить настройки alpha-версии');
        setAlphaStatus({
          isAlpha: true,
          testerCode: '',
          loading: false
        });
      }
    };
    
    loadAlphaStatus();
  }, []);

  const handleToggleAlpha = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const settingsRef = doc(firestore, "settings", "alpha");
      await updateDoc(settingsRef, {
        enabled: !alphaStatus.isAlpha
      });
      
      setAlphaStatus({
        ...alphaStatus,
        isAlpha: !alphaStatus.isAlpha
      });
      
      setSuccess(`Alpha-режим успешно ${!alphaStatus.isAlpha ? 'включен' : 'отключен'}`);
    } catch (err) {
      console.error('Ошибка при изменении alpha-статуса:', err);
      setError('Не удалось изменить настройки alpha-версии');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTesterCode = async () => {
    if (!newTesterCode.trim()) {
      setError('Код тестера не может быть пустым');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const settingsRef = doc(firestore, "settings", "alpha");
      await updateDoc(settingsRef, {
        testerCode: newTesterCode.trim()
      });
      
      setAlphaStatus({
        ...alphaStatus,
        testerCode: newTesterCode.trim()
      });
      
      setSuccess('Код тестера успешно обновлен');
    } catch (err) {
      console.error('Ошибка при обновлении кода тестера:', err);
      setError('Не удалось обновить код тестера');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel-modal">
      <div className="admin-panel-content">
        <div className="admin-panel-header">
          <h2>Панель администратора</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="admin-panel-body">
          <div className="admin-section">
            <h3>Управление alpha-версией</h3>
            
            <div className="status-card">
              <div className="status-info">
                <div className="status-label">Статус alpha-версии:</div>
                <div className={`status-value ${alphaStatus.isAlpha ? 'enabled' : 'disabled'}`}>
                  {alphaStatus.isAlpha ? (
                    <>
                      <FaLock className="status-icon" /> Включена
                    </>
                  ) : (
                    <>
                      <FaUnlock className="status-icon" /> Отключена
                    </>
                  )}
                </div>
              </div>
              
              <button 
                className={`toggle-button ${alphaStatus.isAlpha ? 'disable' : 'enable'}`}
                onClick={handleToggleAlpha}
                disabled={saving || alphaStatus.loading}
              >
                {saving ? 'Сохранение...' : alphaStatus.isAlpha ? 'Отключить' : 'Включить'}
              </button>
            </div>
          </div>
          
          <div className="admin-section">
            <h3>Код тестера</h3>
            
            <div className="tester-code-form">
              <div className="current-code">
                <FaKey className="code-icon" />
                <span>Текущий код: </span>
                <strong>{alphaStatus.testerCode || 'Не задан'}</strong>
              </div>
              
              <div className="code-input-group">
                <input 
                  type="text" 
                  value={newTesterCode}
                  onChange={(e) => setNewTesterCode(e.target.value)}
                  placeholder="Новый код тестера"
                  disabled={saving || alphaStatus.loading}
                />
                <button 
                  className="update-button"
                  onClick={handleUpdateTesterCode}
                  disabled={saving || alphaStatus.loading}
                >
                  {saving ? 'Сохранение...' : 'Обновить код'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="admin-section">
            <h3>Инструкция</h3>
            <div className="instruction-card">
              <p>
                <strong>Alpha-режим</strong> - это режим, при котором для доступа к сайту требуется ввод кода тестера.
              </p>
              <ul className="instruction-list">
                <li>
                  <FaCheck className="check-icon" /> 
                  Чтобы <strong>отключить</strong> alpha-режим, нажмите кнопку "Отключить" выше.
                </li>
                <li>
                  <FaCheck className="check-icon" /> 
                  Чтобы <strong>изменить код тестера</strong>, введите новый код в поле и нажмите "Обновить код".
                </li>
                <li>
                  <FaTimes className="warning-icon" /> 
                  <strong>Внимание:</strong> Изменения вступят в силу немедленно для всех пользователей.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-panel-modal {
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
        
        .admin-panel-content {
          background-color: white;
          border-radius: 8px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .admin-panel-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .admin-panel-header h2 {
          margin: 0;
          color: #1a237e;
          font-size: 1.5rem;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #9e9e9e;
        }
        
        .admin-panel-body {
          padding: 1.5rem;
        }
        
        .admin-section {
          margin-bottom: 2rem;
        }
        
        .admin-section h3 {
          color: #1a237e;
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }
        
        .status-card {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .status-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .status-label {
          font-weight: 500;
          color: #616161;
        }
        
        .status-value {
          font-size: 1.1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .status-value.enabled {
          color: #f44336;
        }
        
        .status-value.disabled {
          color: #4caf50;
        }
        
        .status-icon {
          font-size: 1rem;
        }
        
        .toggle-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .toggle-button.disable {
          background-color: #f44336;
          color: white;
        }
        
        .toggle-button.enable {
          background-color: #4caf50;
          color: white;
        }
        
        .toggle-button:hover {
          opacity: 0.9;
        }
        
        .toggle-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .tester-code-form {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1.5rem;
        }
        
        .current-code {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #616161;
        }
        
        .code-icon {
          color: #ff9800;
        }
        
        .code-input-group {
          display: flex;
          gap: 0.5rem;
        }
        
        .code-input-group input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .update-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .update-button:hover {
          background-color: #3f51b5;
        }
        
        .update-button:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }
        
        .success-message {
          background-color: #e8f5e9;
          color: #2e7d32;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }
        
        .instruction-card {
          background-color: #e3f2fd;
          border-radius: 8px;
          padding: 1.5rem;
          color: #0d47a1;
        }
        
        .instruction-list {
          padding-left: 1.5rem;
          margin: 1rem 0 0;
        }
        
        .instruction-list li {
          margin-bottom: 0.75rem;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .check-icon {
          color: #4caf50;
          margin-top: 0.25rem;
          flex-shrink: 0;
        }
        
        .warning-icon {
          color: #f44336;
          margin-top: 0.25rem;
          flex-shrink: 0;
        }
        
        @media (max-width: 768px) {
          .status-card {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          
          .toggle-button {
            width: 100%;
          }
          
          .code-input-group {
            flex-direction: column;
          }
          
          .update-button {
            width: 100%;
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminPanel; 