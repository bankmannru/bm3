import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Market from '../components/Market';
import Footer from '../components/Footer';
import { auth, getMarketItems } from '../firebase';
import { useLocation } from 'react-router-dom';

function MarketPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const location = useLocation();

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

  return (
    <div className="market-page">
      <Navbar />
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

      <style jsx>{`
        .market-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f5f5f5;
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
      `}</style>
    </div>
  );
}

export default MarketPage; 