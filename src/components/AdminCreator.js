import React, { useState } from 'react';
import { createAdmin } from '../firebase';
import { FaUserSecret, FaKey, FaUserShield } from 'react-icons/fa';

function AdminCreator({ userId, onClose }) {
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await createAdmin(userId, secretKey);
      if (result.success) {
        setSuccess(true);
        // Автоматически закрываем окно через 3 секунды после успешного создания
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(result.error || 'Не удалось создать администратора');
      }
    } catch (err) {
      console.error('Ошибка при создании администратора:', err);
      setError('Произошла ошибка при создании администратора');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-creator-modal">
      <div className="admin-creator-content">
        <div className="admin-creator-header">
          <h2><FaUserSecret className="secret-icon" /> Создание администратора</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="admin-creator-body">
          {error && <div className="error-message">{error}</div>}
          
          {success ? (
            <div className="success-message">
              <FaUserShield className="success-icon" />
              <div className="success-text">
                <h3>Администратор успешно создан!</h3>
                <p>Теперь вы можете управлять alpha-версией сайта.</p>
                <p>Окно закроется автоматически через несколько секунд...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-description">
                <p>
                  <strong>Внимание!</strong> Эта функция предназначена только для разработчиков и тестировщиков.
                </p>
                <p>
                  Для создания администратора введите секретный ключ, который был предоставлен вам разработчиком.
                </p>
              </div>
              
              <div className="form-group">
                <label htmlFor="secretKey">
                  <FaKey className="key-icon" /> Секретный ключ
                </label>
                <input
                  type="password"
                  id="secretKey"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Введите секретный ключ"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="submit-button" 
                disabled={loading || !secretKey.trim()}
              >
                {loading ? 'Создание...' : 'Создать администратора'}
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-creator-modal {
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
        
        .admin-creator-content {
          background-color: white;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .admin-creator-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .admin-creator-header h2 {
          margin: 0;
          color: #1a237e;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .secret-icon {
          color: #ff9800;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #9e9e9e;
        }
        
        .admin-creator-body {
          padding: 1.5rem;
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
          padding: 1.5rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .success-icon {
          font-size: 3rem;
          color: #4caf50;
        }
        
        .success-text h3 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #2e7d32;
        }
        
        .success-text p {
          margin: 0.25rem 0;
        }
        
        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-description {
          background-color: #fff3e0;
          padding: 1rem;
          border-radius: 4px;
          border-left: 4px solid #ff9800;
        }
        
        .form-description p {
          margin: 0.5rem 0;
          color: #e65100;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-group label {
          font-weight: 500;
          color: #616161;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .key-icon {
          color: #ff9800;
        }
        
        .form-group input {
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .submit-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .submit-button:hover {
          background-color: #3f51b5;
        }
        
        .submit-button:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .admin-creator-content {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminCreator; 