import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import AlphaInfo from './AlphaInfo';
import Auth from './Auth';
import { checkAlphaStatus, auth } from '../firebase';

function Hero() {
  const [showAlphaInfo, setShowAlphaInfo] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [alphaStatus, setAlphaStatus] = useState({
    isAlpha: true,
    loading: true
  });
  
  useEffect(() => {
    // Проверяем alpha-статус при загрузке компонента
    const checkStatus = async () => {
      try {
        const result = await checkAlphaStatus();
        setAlphaStatus({
          isAlpha: result.isAlpha,
          loading: false
        });
      } catch (err) {
        console.error('Ошибка при проверке alpha-статуса:', err);
        setAlphaStatus({
          isAlpha: true, // По умолчанию считаем, что alpha включена
          loading: false
        });
      }
    };
    
    checkStatus();
  }, []);
  
  useEffect(() => {
    // Слушаем изменения состояния аутентификации
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    // Отписываемся при размонтировании компонента
    return () => unsubscribe();
  }, []);
  
  const handleOpenAccount = () => {
    if (user) {
      // Если пользователь уже авторизован, перенаправляем в личный кабинет
      window.location.href = '/dashboard';
    } else {
      // Если не авторизован, показываем форму авторизации
      setShowAuth(true);
    }
  };
  
  const handleLearnMore = () => {
    // Прокрутка к разделу с услугами
    const featuresSection = document.querySelector('.features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const closeAuth = () => {
    setShowAuth(false);
  };
  
  if (alphaStatus.loading) {
    return <div>Загрузка...</div>;
  }
  
  return (
    <section className="hero">
      {alphaStatus.isAlpha && (
        <div className="alpha-banner">
          <FaExclamationTriangle className="alpha-icon" />
          <div className="alpha-text">
            <strong>АЛЬФА-ВЕРСИЯ</strong> - Для доступа к сайту введите код тестера.
          </div>
          <button 
            className="info-button" 
            onClick={() => setShowAlphaInfo(true)}
            title="Подробнее об альфа-версии"
          >
            <FaInfoCircle />
          </button>
        </div>
      )}
      
      <div className="hero-content">
        <h1 className="hero-title">
          Добро пожаловать в Банк Маннру
        </h1>
        <p className="hero-subtitle">
          Ваш надежный финансовый партнер для всех банковских решений
        </p>
        <div className="hero-buttons">
          <button className="primary-button" onClick={handleOpenAccount}>
            Открыть счёт
          </button>
          <button className="secondary-button" onClick={handleLearnMore}>
            Узнать больше
          </button>
        </div>
      </div>
      
      {showAlphaInfo && <AlphaInfo onClose={() => setShowAlphaInfo(false)} />}
      {showAuth && <Auth onClose={closeAuth} />}

      <style jsx>{`
        .hero {
          background: linear-gradient(135deg, #1a237e 0%, #3f51b5 100%);
          color: white;
          padding: 4rem 2rem;
          text-align: center;
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .alpha-banner {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background-color: rgba(244, 67, 54, 0.9);
          color: white;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          z-index: 10;
        }
        
        .alpha-icon {
          font-size: 1.25rem;
        }
        
        .alpha-text {
          font-size: 0.9rem;
        }
        
        .info-button {
          background: none;
          border: none;
          color: white;
          font-size: 1.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 50%;
          transition: background-color 0.3s;
        }
        
        .info-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }

        .hero-content {
          max-width: 800px;
          margin: 0 auto;
          padding-top: 2rem;
          animation: fadeIn 0.5s ease-out;
          will-change: opacity, transform;
        }

        .hero-title {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
          line-height: 1.2;
          animation: slideIn 0.4s ease-out;
          will-change: opacity, transform;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.9;
          animation: slideIn 0.5s ease-out;
          will-change: opacity, transform;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          animation: fadeIn 0.6s ease-out;
          will-change: opacity, transform;
        }

        .primary-button {
          background-color: white;
          color: #1a237e;
          border: none;
          padding: 1rem 2rem;
          border-radius: 28px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .secondary-button {
          background-color: transparent;
          color: white;
          border: 2px solid white;
          padding: 1rem 2rem;
          border-radius: 28px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .secondary-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 768px) {
          .hero {
            padding: 3rem 1rem;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-subtitle {
            font-size: 1rem;
          }

          .hero-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }
          
          .alpha-text {
            font-size: 0.8rem;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}

export default Hero; 