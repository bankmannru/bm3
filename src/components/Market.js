import React, { useState, useEffect } from 'react';
import { getMarketItems, getUserCards } from '../firebase';
import MarketItem from './MarketItem';
import CreateMarketItem from './CreateMarketItem';

function Market({ user, initialSelectedItem = null, initialShowChat = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [userCards, setUserCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedItem, setSelectedItem] = useState(initialSelectedItem);
  const [showItemDetails, setShowItemDetails] = useState(!!initialSelectedItem);
  const [showItemChat, setShowItemChat] = useState(initialShowChat);
  const [filter, setFilter] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    search: ''
  });
  const [categories] = useState([
    'Электроника',
    'Одежда',
    'Обувь',
    'Аксессуары',
    'Книги',
    'Спорт',
    'Дом и сад',
    'Красота и здоровье',
    'Игрушки',
    'Автотовары',
    'Другое'
  ]);

  useEffect(() => {
    loadMarketItems();
  }, []);
  
  useEffect(() => {
    if (user) {
      loadUserCards();
    } else {
      setUserCards([]);
    }
  }, [user]);
  
  useEffect(() => {
    // Обновляем выбранный товар, если он изменился в props
    if (initialSelectedItem) {
      setSelectedItem(initialSelectedItem);
      setShowItemDetails(true);
      setShowItemChat(initialShowChat);
    }
  }, [initialSelectedItem, initialShowChat]);

  const loadMarketItems = async () => {
    setLoading(true);
    try {
      const filterParams = {};
      if (filter.category) filterParams.category = filter.category;
      if (filter.minPrice) filterParams.minPrice = Number(filter.minPrice);
      if (filter.maxPrice) filterParams.maxPrice = Number(filter.maxPrice);

      const result = await getMarketItems(filterParams);
      if (result.success) {
        setItems(result.items);
      } else {
        setError(result.error || 'Не удалось загрузить товары');
      }
    } catch (err) {
      console.error('Ошибка при загрузке товаров:', err);
      setError('Произошла ошибка при загрузке товаров');
    } finally {
      setLoading(false);
    }
  };

  const loadUserCards = async () => {
    if (!user) return;
    
    setLoadingCards(true);
    try {
      const result = await getUserCards(user.uid);
      if (result.success) {
        setUserCards(result.cards);
      } else {
        console.error('Не удалось загрузить карты пользователя:', result.error);
      }
    } catch (err) {
      console.error('Ошибка при загрузке карт пользователя:', err);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilter = () => {
    loadMarketItems();
  };

  const resetFilter = () => {
    setFilter({
      category: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    });
    loadMarketItems();
  };

  const handleItemCreated = (newItem) => {
    console.log('Товар создан:', newItem);
    setItems(prevItems => [newItem, ...prevItems]);
    setShowCreateItem(false);
    loadUserCards(); // Обновляем карты пользователя, так как баланс изменился
  };

  const handleItemPurchased = (itemId) => {
    console.log('Товар куплен/удален:', itemId);
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    
    // Если это был выбранный товар, закрываем его детали
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem(null);
      setShowItemDetails(false);
      setShowItemChat(false);
    }
    
    loadUserCards(); // Обновляем карты пользователя, так как баланс изменился
  };
  
  const handleItemClick = (item) => {
    setSelectedItem(item);
    setShowItemDetails(true);
    setShowItemChat(false);
  };
  
  const handleCloseItemDetails = () => {
    setSelectedItem(null);
    setShowItemDetails(false);
    setShowItemChat(false);
    
    // Очищаем URL параметры
    const url = new URL(window.location.href);
    url.searchParams.delete('item');
    url.searchParams.delete('chat');
    window.history.replaceState({}, '', url);
  };

  // Фильтрация по поисковому запросу
  const filteredItems = items.filter(item => {
    if (!filter.search) return true;
    
    const searchLower = filter.search.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="market">
      <div className="market-header">
        <h2 className="market-title">Маркет</h2>
        <p className="market-description">
          Покупайте и продавайте товары за МР (маннрубли)
        </p>
      </div>

      <div className="market-actions">
        <div className="filter-section">
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="search">Поиск</label>
              <input
                type="text"
                id="search"
                name="search"
                value={filter.search}
                onChange={handleFilterChange}
                placeholder="Поиск товаров..."
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="category">Категория</label>
              <select
                id="category"
                name="category"
                value={filter.category}
                onChange={handleFilterChange}
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="minPrice">Цена от (МР)</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={filter.minPrice}
                onChange={handleFilterChange}
                placeholder="Мин. цена"
                min="0"
              />
            </div>
            
            <div className="filter-group">
              <label htmlFor="maxPrice">Цена до (МР)</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={filter.maxPrice}
                onChange={handleFilterChange}
                placeholder="Макс. цена"
                min="0"
              />
            </div>
            
            <div className="filter-buttons">
              <button className="apply-filter-button" onClick={applyFilter}>
                Применить
              </button>
              <button className="reset-filter-button" onClick={resetFilter}>
                Сбросить
              </button>
            </div>
          </div>
        </div>
        
        {user && (
          <button 
            className="create-item-button"
            onClick={() => setShowCreateItem(true)}
          >
            + Создать объявление
          </button>
        )}
      </div>

      {selectedItem && showItemDetails ? (
        <div className="selected-item-container">
          <button 
            className="back-button"
            onClick={handleCloseItemDetails}
          >
            ← Вернуться к списку товаров
          </button>
          
          <div className="selected-item">
            <MarketItem 
              item={selectedItem} 
              user={user}
              userCards={userCards}
              onPurchase={handleItemPurchased}
              showDetails={true}
              initialActiveTab={showItemChat ? 'chat' : 'details'}
            />
          </div>
        </div>
      ) : (
        <>
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading">Загрузка товаров...</div>
          ) : filteredItems.length > 0 ? (
            <div className="market-items-grid">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className="market-item-wrapper"
                  onClick={() => handleItemClick(item)}
                >
                  <MarketItem 
                    item={item} 
                    user={user}
                    userCards={userCards}
                    onPurchase={handleItemPurchased}
                    showDetails={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-items">
              <p>Товары не найдены. Попробуйте изменить параметры поиска или создайте свое объявление.</p>
            </div>
          )}
        </>
      )}

      {showCreateItem && user && (
        <div className="create-item-modal-overlay" onClick={() => setShowCreateItem(false)}>
          <div className="create-item-modal" onClick={e => e.stopPropagation()}>
            <CreateMarketItem 
              user={user}
              userCards={userCards}
              onItemCreated={handleItemCreated}
              onClose={() => setShowCreateItem(false)}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .market {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .market-header {
          margin-bottom: 2rem;
          text-align: center;
        }
        
        .market-title {
          color: #1a237e;
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        
        .market-description {
          color: #616161;
          font-size: 1.1rem;
        }
        
        .market-actions {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .filter-section {
          flex: 1;
          background-color: #f5f5f5;
          padding: 1.5rem;
          border-radius: 8px;
        }
        
        .filter-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        
        .filter-row:last-child {
          margin-bottom: 0;
        }
        
        .filter-group {
          flex: 1;
          min-width: 200px;
        }
        
        .filter-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #616161;
        }
        
        .filter-group input,
        .filter-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
        }
        
        .apply-filter-button,
        .reset-filter-button {
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .apply-filter-button {
          background-color: #1a237e;
          color: white;
          border: none;
        }
        
        .apply-filter-button:hover {
          background-color: #3f51b5;
        }
        
        .reset-filter-button {
          background-color: transparent;
          color: #616161;
          border: 1px solid #e0e0e0;
        }
        
        .reset-filter-button:hover {
          background-color: #f5f5f5;
        }
        
        .create-item-button {
          background-color: #4caf50;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 28px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          white-space: nowrap;
        }
        
        .create-item-button:hover {
          background-color: #66bb6a;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
          color: #616161;
        }
        
        .market-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }
        
        .no-items {
          text-align: center;
          padding: 3rem;
          background-color: #f5f5f5;
          border-radius: 8px;
          color: #616161;
        }
        
        @media (max-width: 768px) {
          .market {
            padding: 1rem;
          }
          
          .market-title {
            font-size: 2rem;
          }
          
          .filter-row {
            flex-direction: column;
            gap: 1rem;
          }
          
          .filter-group {
            width: 100%;
          }
          
          .market-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .create-item-button {
            width: 100%;
          }
        }
        
        .create-item-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .create-item-modal {
          width: 100%;
          max-width: 600px;
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .selected-item-container {
          margin-top: 1.5rem;
        }
        
        .back-button {
          background: none;
          border: none;
          color: #1a237e;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem 0;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          transition: color 0.3s;
        }
        
        .back-button:hover {
          color: #3f51b5;
        }
        
        .selected-item {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .market-item-wrapper {
          cursor: pointer;
          transition: transform 0.3s;
        }
        
        .market-item-wrapper:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
}

export default Market; 