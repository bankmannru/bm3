import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Market from '../components/Market';
import Footer from '../components/Footer';
import AlphaInfo from '../components/AlphaInfo';
import { auth, getMarketItems, checkAlphaStatus } from '../firebase';
import { useLocation } from 'react-router-dom';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

function MarketPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showAlphaInfo, setShowAlphaInfo] = useState(false);
  const [alphaStatus, setAlphaStatus] = useState({
    isAlpha: true,
    loading: true
  });
  const location = useLocation();

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
      setLoading(false);
    });

    // Отписываемся при размонтировании компонента
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    // Обрабатываем параметры URL
    const queryParams = new URLSearchParams(location.search);
    const itemId = queryParams.get('item');
    const chatParam = queryParams.get('chat');
    
    if (itemId) {
      loadItemDetails(itemId);
      setShowChat(chatParam === 'true');
    }
  }, [location.search]);
  
  const loadItemDetails = async (itemId) => {
    try {
      // Получаем все товары (в реальном приложении лучше сделать отдельный запрос для одного товара)
      const result = await getMarketItems();
      if (result.success) {
        const item = result.items.find(item => item.id === itemId);
        if (item) {
          setSelectedItem(item);
        }
      }
    } catch (err) {
      console.error('Ошибка при загрузке товара:', err);
    }
  };

  if (alphaStatus.loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="market-page">
      <Navbar />
      
      {alphaStatus.isAlpha && (
        <div className="alpha-banner">
          <FaExclamationTriangle className="alpha-icon" />
          <div className="alpha-text">
            <strong>АЛЬФА-ВЕРСИЯ</strong> - Вы используете тестовую версию маркета. Ограничения можно отключить через Firestore.
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
      
      <main>
        <div className="market-container">
          <div className="market-header">
            <h1>Маркет МаннБанка</h1>
            <p className="market-description">
              Покупайте и продавайте товары за маннрубли (МР). 
              Комиссия за размещение объявления составляет 15 МР.
            </p>
          </div>
          <Market 
            user={user} 
            initialSelectedItem={selectedItem}
            initialShowChat={showChat}
          />
        </div>
      </main>
      <Footer />
      
      {showAlphaInfo && <AlphaInfo onClose={() => setShowAlphaInfo(false)} />}

      <style jsx>{`
        .market-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f5f5f5;
          position: relative;
          padding-top: 3rem;
        }
        
        .alpha-banner {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          background-color: rgba(244, 67, 54, 0.9);
          color: white;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          z-index: 999;
        }
        
        .alpha-icon {
          font-size: 1.25rem;
        }
        
        .alpha-text {
          font-size: 0.9rem;
        }

        main {
          flex: 1;
          padding: 2rem 0;
        }

        .market-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .market-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .market-header h1 {
          color: #1a237e;
          margin-bottom: 0.5rem;
          font-size: 2.5rem;
        }

        .market-description {
          color: #616161;
          max-width: 600px;
          margin: 0 auto;
          font-size: 1.1rem;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .market-header h1 {
            font-size: 2rem;
          }

          .market-description {
            font-size: 1rem;
          }
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
      `}</style>
    </div>
  );
}

export default MarketPage; 