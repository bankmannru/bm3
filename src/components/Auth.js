import React, { useState } from 'react';
import { loginUser, registerUser } from '../firebase';

function Auth({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
          
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
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