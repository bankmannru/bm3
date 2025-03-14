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
          
          <div className="filter-row price-row">
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

      {showCreateItem && (
        <CreateMarketItem 
          user={user}
          userCards={userCards}
          onClose={() => setShowCreateItem(false)}
          onItemCreated={handleItemCreated}
        />
      )}

      <style jsx>{`
        .market {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .market-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .market-title {
          margin: 0 0 0.5rem;
          color: #1a237e;
          font-size: 1.5rem;
        }

        .market-description {
          margin: 0;
          color: #616161;
        }

        .market-actions {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          background-color: #f5f5f5;
          padding: 1rem;
          border-radius: 8px;
        }

        .filter-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .price-row {
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          min-width: 200px;
        }

        .filter-group label {
          font-weight: 500;
          color: #1a237e;
        }

        .filter-group input,
        .filter-group select {
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
          width: 100%;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          margin-left: auto;
        }

        .apply-filter-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .apply-filter-button:hover {
          background-color: #3f51b5;
        }

        .reset-filter-button {
          background-color: transparent;
          color: #616161;
          border: 1px solid #e0e0e0;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .reset-filter-button:hover {
          background-color: #f5f5f5;
        }

        .create-item-button {
          background-color: #4caf50;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          align-self: flex-end;
        }

        .create-item-button:hover {
          background-color: #66bb6a;
        }

        .market-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          padding: 1.5rem;
        }

        .market-item-wrapper {
          cursor: pointer;
          transition: transform 0.3s;
        }

        .market-item-wrapper:hover {
          transform: translateY(-4px);
        }

        .loading, .error-message, .no-items {
          padding: 3rem;
          text-align: center;
          color: #616161;
        }

        .error-message {
          color: #f44336;
        }

        .selected-item-container {
          padding: 1.5rem;
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

        @media (max-width: 768px) {
          .filter-row {
            flex-direction: column;
          }

          .filter-buttons {
            margin-left: 0;
            margin-top: 1rem;
            justify-content: space-between;
            width: 100%;
          }

          .apply-filter-button,
          .reset-filter-button {
            flex: 1;
          }

          .market-items-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Market; 