import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, checkAlphaStatus } from '../firebase';
import { FaExclamationTriangle } from 'react-icons/fa';

function Auth({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [testerCode, setTesterCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alphaStatus, setAlphaStatus] = useState({
    isAlpha: true,
    testerCode: '',
    loading: true
  });

  useEffect(() => {
    // Проверяем alpha-статус при загрузке компонента
    const checkStatus = async () => {
      try {
        const result = await checkAlphaStatus();
        setAlphaStatus({
          isAlpha: result.isAlpha,
          testerCode: result.testerCode,
          loading: false
        });
      } catch (err) {
        console.error('Ошибка при проверке alpha-статуса:', err);
        setAlphaStatus({
          isAlpha: true, // По умолчанию считаем, что alpha включена
          testerCode: '',
          loading: false
        });
      }
    };
    
    checkStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Проверка кода тестера только если alpha включена
    if (alphaStatus.isAlpha && testerCode !== alphaStatus.testerCode) {
      setError('Неверный код тестера. Для доступа к альфа-версии введите правильный код доступа.');
      setLoading(false);
      return;
    }

    try {
      let result;
      if (isLogin) {
        result = await loginUser(email, password);
      } else {
        result = await registerUser(email, password);
      }

      if (result.error) {
        setError(result.error);
      } else {
        // Успешная авторизация
        onClose();
        // Перенаправляем в личный кабинет
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('Произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal">
      <div className="auth-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2 className="auth-title">{isLogin ? 'Вход в личный кабинет' : 'Регистрация'}</h2>
        
        {alphaStatus.isAlpha && (
          <div className="alpha-notice">
            <FaExclamationTriangle className="alpha-icon" />
            <p>Это альфа-версия сайта. Для доступа требуется код тестера.</p>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {alphaStatus.isAlpha && (
            <div className="form-group">
              <label htmlFor="testerCode">Код тестера</label>
              <input
                type="text"
                id="testerCode"
                value={testerCode}
                onChange={(e) => setTesterCode(e.target.value)}
                placeholder="Введите код тестера"
                required
              />
            </div>
          )}
          
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading || alphaStatus.loading}
          >
            {loading || alphaStatus.loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className="auth-switch">
          {isLogin ? (
            <p>Нет аккаунта? <button onClick={() => setIsLogin(false)}>Зарегистрироваться</button></p>
          ) : (
            <p>Уже есть аккаунт? <button onClick={() => setIsLogin(true)}>Войти</button></p>
          )}
        </div>
      </div>

      <style jsx>{`
        .auth-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
        }

        .auth-content {
          background-color: white;
          border-radius: 8px;
          padding: 2rem;
          width: 100%;
          max-width: 400px;
          position: relative;
        }

        .close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #616161;
        }

        .auth-title {
          color: #1a237e;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .alpha-notice {
          background-color: #fff3e0;
          border-left: 4px solid #ff9800;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .alpha-notice p {
          margin: 0;
          font-size: 0.9rem;
          color: #e65100;
        }
        
        .alpha-icon {
          color: #ff9800;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #616161;
        }

        .form-group input {
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
          font-family: 'Roboto', sans-serif;
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
          margin-top: 1rem;
        }

        .submit-button:hover {
          background-color: #3f51b5;
        }

        .submit-button:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }

        .auth-switch {
          margin-top: 1.5rem;
          text-align: center;
        }

        .auth-switch button {
          background: none;
          border: none;
          color: #1a237e;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
        }

        .auth-switch button:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default Auth; 