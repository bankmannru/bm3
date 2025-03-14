import React, { useState, useEffect } from 'react';
import { auth, getUserCards, getUnreadMessagesCount } from '../firebase';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VirtualCard from '../components/VirtualCard';
import CreateCard from '../components/CreateCard';
import MarketTransactions from '../components/MarketTransactions';
import UserChats from '../components/UserChats';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Проверяем авторизацию
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Загружаем карты пользователя
        await loadUserCards(currentUser.uid);
        // Загружаем количество непрочитанных сообщений
        await loadUnreadMessages(currentUser.uid);
      } else {
        // Если пользователь не авторизован, перенаправляем на главную
        window.location.href = '/';
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserCards = async (userId) => {
    setLoading(true);
    try {
      const result = await getUserCards(userId);
      if (result.success) {
        setCards(result.cards);
      } else {
        setError('Не удалось загрузить карты. Пожалуйста, попробуйте позже.');
      }
    } catch (err) {
      setError('Произошла ошибка при загрузке карт.');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadMessages = async (userId) => {
    try {
      const result = await getUnreadMessagesCount(userId);
      if (result.success) {
        setUnreadMessages(result.count);
      }
    } catch (err) {
      console.error('Ошибка при загрузке непрочитанных сообщений:', err);
    }
  };

  const handleCardCreated = (newCard) => {
    setCards([...cards, newCard]);
    setShowCreateCard(false);
  };

  if (!user) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="dashboard">
      <Navbar />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Личный кабинет</h1>
          <p className="dashboard-welcome">Добро пожаловать, {user.email}</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Мои карты</h2>
            <button 
              className="create-card-button"
              onClick={() => setShowCreateCard(true)}
            >
              + Создать новую карту
            </button>
          </div>
          
          {loading ? (
            <div className="loading">Загрузка карт...</div>
          ) : cards.length > 0 ? (
            <div className="cards-grid">
              {cards.map((card) => (
                <VirtualCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="no-cards">
              <p>У вас пока нет карт. Создайте свою первую карту!</p>
            </div>
          )}
        </div>
        
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Маркет</h2>
          </div>
          <div className="market-promo">
            <div className="market-info">
              <h3>Маркет МаннБанка</h3>
              <p>Покупайте и продавайте товары за маннрубли (МР). Размещение объявления стоит всего 15 МР.</p>
              <div className="market-actions">
                <Link to="/market" className="market-link">
                  Перейти в маркет
                </Link>
                {unreadMessages > 0 && (
                  <div className="unread-messages-badge">
                    {unreadMessages} {unreadMessages === 1 ? 'новое сообщение' : 
                      unreadMessages < 5 ? 'новых сообщения' : 'новых сообщений'}
                  </div>
                )}
              </div>
            </div>
            <div className="market-icon">🛒</div>
          </div>
          
          <div className="market-sections">
            {user && cards.length > 0 && (
              <>
                <div className="market-transactions-container">
                  <MarketTransactions userId={cards[0].id} />
                </div>
                
                <div className="user-chats-container">
                  <UserChats userId={user.uid} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
      
      {showCreateCard && (
        <CreateCard 
          userId={user.uid} 
          onSuccess={handleCardCreated} 
          onClose={() => setShowCreateCard(false)} 
        />
      )}

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .dashboard-container {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .dashboard-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 1rem;
        }
        
        .dashboard-title {
          color: #1a237e;
          margin-bottom: 0.5rem;
        }
        
        .dashboard-welcome {
          color: #616161;
          font-size: 1.1rem;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }
        
        .dashboard-section {
          margin-bottom: 3rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .section-title {
          color: #1a237e;
        }
        
        .create-card-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 28px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .create-card-button:hover {
          background-color: #3f51b5;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
          color: #616161;
        }
        
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }
        
        .no-cards {
          background-color: #f5f5f5;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          color: #616161;
        }
        
        .market-promo {
          display: flex;
          background-color: #e8f5e9;
          border-radius: 8px;
          padding: 2rem;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        
        .market-info {
          flex: 1;
        }
        
        .market-info h3 {
          color: #2e7d32;
          margin-top: 0;
          margin-bottom: 0.5rem;
        }
        
        .market-info p {
          color: #616161;
          margin-bottom: 1.5rem;
        }
        
        .market-link {
          display: inline-block;
          background-color: #4caf50;
          color: white;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 28px;
          font-weight: 500;
          transition: background-color 0.3s;
        }
        
        .market-link:hover {
          background-color: #66bb6a;
        }
        
        .market-icon {
          font-size: 4rem;
          margin-left: 2rem;
        }
        
        .market-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .market-transactions-container,
        .user-chats-container {
          width: 100%;
        }
        
        .market-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .unread-messages-badge {
          background-color: #f44336;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .cards-grid {
            grid-template-columns: 1fr;
          }
          
          .market-promo {
            flex-direction: column;
            text-align: center;
          }
          
          .market-icon {
            margin-left: 0;
            margin-top: 1.5rem;
          }
        }
        
        @media (max-width: 992px) {
          .market-sections {
            grid-template-columns: 1fr;
          }
          
          .user-chats-container {
            margin-top: 2rem;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard; 