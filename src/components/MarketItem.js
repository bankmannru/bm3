import React, { useState, useEffect } from 'react';
import { purchaseMarketItem, deleteMarketItem } from '../firebase';
import ItemChat from './ItemChat';
import { 
  FaShoppingBag, 
  FaLaptop, 
  FaMobile, 
  FaHome, 
  FaCar, 
  FaTshirt, 
  FaChild, 
  FaBook, 
  FaFootballBall, 
  FaTools, 
  FaQuestion 
} from 'react-icons/fa';

function MarketItem({ item, user, userCards, onPurchase, showDetails = false, initialActiveTab = 'details' }) {
  const [showDetailsState, setShowDetailsState] = useState(showDetails);
  const [selectedCard, setSelectedCard] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [activeTab, setActiveTab] = useState(initialActiveTab); // 'details', 'chat'
  
  // Обновляем состояние, если props изменились
  useEffect(() => {
    setShowDetailsState(showDetails);
  }, [showDetails]);
  
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);
  
  // Сбрасываем выбранную карту при закрытии деталей
  useEffect(() => {
    if (!showDetailsState) {
      setSelectedCard('');
      setError(null);
    }
  }, [showDetailsState]);
  
  // Автоматически выбираем первую карту с достаточным балансом, если она одна
  useEffect(() => {
    if (showDetailsState && userCards && userCards.length === 1 && userCards[0].balance >= item.price) {
      setSelectedCard(userCards[0].id);
    }
  }, [showDetailsState, userCards, item.price]);
  
  // Форматирование даты
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Дата не указана';
    
    try {
      let date;
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Если это Firestore Timestamp
        date = timestamp.toDate();
      } else if (timestamp._seconds !== undefined) {
        // Если это сериализованный Firestore Timestamp
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp instanceof Date) {
        // Если это уже объект Date
        date = timestamp;
      } else if (typeof timestamp === 'string') {
        // Если это строка
        date = new Date(timestamp);
      } else if (typeof timestamp === 'number') {
        // Если это число (unix timestamp)
        date = new Date(timestamp);
      } else {
        return 'Некорректная дата';
      }
      
      // Проверяем, что дата валидна
      if (isNaN(date.getTime())) {
        return 'Некорректная дата';
      }
      
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Ошибка при форматировании даты:', error, timestamp);
      return 'Ошибка даты';
    }
  };
  
  // Форматирование цены
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('₽', 'МР');
  };
  
  // Проверка, является ли пользователь продавцом
  const isSeller = user && user.uid === item.sellerId;
  
  // Покупка товара
  const handlePurchase = async () => {
    if (!selectedCard) {
      setError('Выберите карту для оплаты');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Покупка товара:', {
        itemId: item.id,
        buyerId: user.uid,
        buyerCardId: selectedCard
      });
      
      const result = await purchaseMarketItem(item.id, user.uid, selectedCard);
      
      if (result.success) {
        onPurchase(item.id);
      } else {
        setError(result.error || 'Не удалось совершить покупку');
      }
    } catch (err) {
      console.error('Ошибка при покупке товара:', err);
      setError('Произошла ошибка при покупке товара');
    } finally {
      setLoading(false);
    }
  };
  
  // Удаление товара
  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await deleteMarketItem(item.id, user.uid);
      
      if (result.success) {
        onPurchase(item.id); // Используем тот же обработчик для удаления из списка
      } else {
        setError(result.error || 'Не удалось удалить товар');
      }
    } catch (err) {
      console.error('Ошибка при удалении товара:', err);
      setError('Произошла ошибка при удалении товара');
    } finally {
      setLoading(false);
    }
  };

  // Проверяем, есть ли у пользователя карты с достаточным балансом
  const hasCardsWithSufficientBalance = userCards && userCards.some(card => card.balance >= item.price);

  return (
    <div className="market-item">
      <div 
        className="item-preview"
        onClick={() => !showDetails && setShowDetailsState(!showDetailsState)}
      >
        <div className="item-image">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} />
          ) : (
            <div className="placeholder-image">
              <span className="category-icon">{getCategoryIcon(item.category)}</span>
            </div>
          )}
        </div>
        
        <div className="item-info">
          <h3 className="item-title">{item.title}</h3>
          <p className="item-price">{formatPrice(item.price)}</p>
          <p className="item-date">Опубликовано: {formatDate(item.createdAt)}</p>
        </div>
      </div>
      
      {showDetailsState && (
        <div className="item-details-container">
          <div className="item-tabs">
            <button 
              className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Информация
            </button>
            {user && (
              <button 
                className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Обсуждение
              </button>
            )}
          </div>
          
          {activeTab === 'details' ? (
            <div className="item-details">
              <div className="item-description">
                <h4>Описание</h4>
                <p>{item.description}</p>
              </div>
              
              <div className="item-meta">
                <div className="meta-row">
                  <span className="meta-label">Категория:</span>
                  <span className="meta-value">{item.category}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Состояние:</span>
                  <span className="meta-value">{item.condition}</span>
                </div>
                {item.location && (
                  <div className="meta-row">
                    <span className="meta-label">Местоположение:</span>
                    <span className="meta-value">{item.location}</span>
                  </div>
                )}
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              {user ? (
                isSeller ? (
                  <div className="seller-actions">
                    <button 
                      className="delete-button"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      {loading ? 'Удаление...' : 'Удалить объявление'}
                    </button>
                  </div>
                ) : (
                  <div className="buyer-actions">
                    {userCards && userCards.length > 0 ? (
                      <>
                        <div className="card-selection">
                          <label htmlFor={`card-select-${item.id}`}>Выберите карту для оплаты:</label>
                          <select
                            id={`card-select-${item.id}`}
                            value={selectedCard}
                            onChange={(e) => setSelectedCard(e.target.value)}
                            disabled={loading}
                          >
                            <option value="">Выберите карту</option>
                            {userCards.map(card => (
                              <option 
                                key={card.id} 
                                value={card.id}
                                disabled={card.balance < item.price}
                              >
                                **** {card.cardNumber.slice(-4)} - {new Intl.NumberFormat('ru-RU').format(card.balance)} МР
                                {card.balance < item.price ? ' (недостаточно средств)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {hasCardsWithSufficientBalance ? (
                          <button 
                            className="purchase-button"
                            onClick={handlePurchase}
                            disabled={loading || !selectedCard}
                          >
                            {loading ? 'Покупка...' : `Купить за ${formatPrice(item.price)}`}
                          </button>
                        ) : (
                          <div className="insufficient-funds-message">
                            У вас недостаточно средств на картах для покупки этого товара
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="no-cards-message">
                        У вас нет карт для оплаты. Создайте карту в личном кабинете.
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="auth-required">
                  <p>Войдите в аккаунт, чтобы совершить покупку</p>
                </div>
              )}
            </div>
          ) : (
            <div className="item-chat-container">
              {user && (
                <ItemChat 
                  itemId={item.id}
                  userId={user.uid}
                  userName={user.email}
                  sellerId={item.sellerId}
                />
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .market-item {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .market-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        }
        
        .item-preview {
          cursor: pointer;
        }
        
        .item-image {
          height: 200px;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .placeholder-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
        }
        
        .category-icon {
          font-size: 3rem;
          color: #9e9e9e;
        }
        
        .item-info {
          padding: 1.5rem;
        }
        
        .item-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
          color: #1a237e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .item-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #4caf50;
          margin: 0.5rem 0;
        }
        
        .item-date {
          font-size: 0.8rem;
          color: #9e9e9e;
          margin: 0;
        }
        
        .item-details-container {
          border-top: 1px solid #e0e0e0;
        }
        
        .item-tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .tab-button {
          flex: 1;
          padding: 1rem;
          background: none;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          color: #616161;
        }
        
        .tab-button.active {
          color: #1a237e;
          border-bottom: 2px solid #1a237e;
          background-color: #f5f5f5;
        }
        
        .tab-button:hover:not(.active) {
          background-color: #f5f5f5;
        }
        
        .item-details {
          padding: 1.5rem;
        }
        
        .item-description {
          margin-bottom: 1.5rem;
        }
        
        .item-description h4 {
          margin: 1rem 0 0.5rem;
          color: #1a237e;
        }
        
        .item-description p {
          margin: 0;
          color: #616161;
          line-height: 1.5;
        }
        
        .item-meta {
          background-color: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }
        
        .meta-row {
          display: flex;
          margin-bottom: 0.5rem;
        }
        
        .meta-row:last-child {
          margin-bottom: 0;
        }
        
        .meta-label {
          font-weight: 500;
          color: #616161;
          width: 40%;
        }
        
        .meta-value {
          color: #1a237e;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }
        
        .insufficient-funds-message,
        .no-cards-message {
          background-color: #fff3e0;
          color: #e65100;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          text-align: center;
        }
        
        .buyer-actions,
        .seller-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .card-selection {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .card-selection label {
          font-weight: 500;
          color: #616161;
        }
        
        .card-selection select {
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .purchase-button,
        .delete-button {
          padding: 0.75rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          text-align: center;
        }
        
        .purchase-button {
          background-color: #4caf50;
          color: white;
          border: none;
        }
        
        .purchase-button:hover:not(:disabled) {
          background-color: #66bb6a;
        }
        
        .purchase-button:disabled {
          background-color: #c8e6c9;
          cursor: not-allowed;
        }
        
        .delete-button {
          background-color: #f44336;
          color: white;
          border: none;
        }
        
        .delete-button:hover:not(:disabled) {
          background-color: #ef5350;
        }
        
        .delete-button:disabled {
          background-color: #ffcdd2;
          cursor: not-allowed;
        }
        
        .auth-required {
          text-align: center;
          padding: 1rem;
          background-color: #e3f2fd;
          border-radius: 4px;
          color: #1976d2;
        }
        
        .item-chat-container {
          padding: 0;
        }
      `}</style>
    </div>
  );
}

// Функция для получения иконки категории
function getCategoryIcon(category) {
  switch (category) {
    case 'Электроника':
      return <FaLaptop />;
    case 'Телефоны':
      return <FaMobile />;
    case 'Недвижимость':
      return <FaHome />;
    case 'Транспорт':
      return <FaCar />;
    case 'Одежда':
      return <FaTshirt />;
    case 'Детские товары':
      return <FaChild />;
    case 'Книги':
      return <FaBook />;
    case 'Спорт и отдых':
      return <FaFootballBall />;
    case 'Инструменты':
      return <FaTools />;
    default:
      return <FaShoppingBag />;
  }
}

export default MarketItem; 