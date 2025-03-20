import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { FaHistory, FaCoins, FaCalendarAlt, FaClock, FaTrophy, FaTimesCircle } from 'react-icons/fa';

function GameHistory({ userId, gameType }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalResults, setTotalResults] = useState(0);
  const [filter, setFilter] = useState({
    gameType: gameType || 'all',
    timeRange: 'all',
    resultType: 'all' // win, loss
  });

  useEffect(() => {
    if (userId) {
      fetchGameHistory();
    }
  }, [userId, filter, currentPage]);

  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      
      // Создаем базовый запрос
      let historyQuery = collection(db, 'gameHistory');
      
      // Добавляем фильтрацию по пользователю
      historyQuery = query(historyQuery, where('userId', '==', userId));
      
      // Фильтрация по типу игры
      if (filter.gameType !== 'all') {
        historyQuery = query(historyQuery, where('gameType', '==', filter.gameType));
      }
      
      // Фильтрация по временному диапазону
      if (filter.timeRange !== 'all') {
        const date = new Date();
        let startDate;
        
        if (filter.timeRange === 'today') {
          date.setHours(0, 0, 0, 0);
          startDate = date;
        } else if (filter.timeRange === 'week') {
          date.setDate(date.getDate() - 7);
          startDate = date;
        } else if (filter.timeRange === 'month') {
          date.setMonth(date.getMonth() - 1);
          startDate = date;
        }
        
        historyQuery = query(historyQuery, where('timestamp', '>=', startDate));
      }
      
      // Фильтрация по результату (выигрыш/проигрыш)
      if (filter.resultType === 'win') {
        historyQuery = query(historyQuery, where('win', '>', 0));
      } else if (filter.resultType === 'loss') {
        historyQuery = query(historyQuery, where('win', '==', 0));
      }
      
      // Сортировка по дате
      historyQuery = query(historyQuery, orderBy('timestamp', 'desc'));
      
      // Пагинация
      const startAfter = (currentPage - 1) * itemsPerPage;
      historyQuery = query(historyQuery, limit(itemsPerPage));
      
      // Выполняем запрос
      const querySnapshot = await getDocs(historyQuery);
      
      // Преобразуем результаты
      const history = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      
      setHistoryItems(history);
      setTotalResults(querySnapshot.size); // Приблизительное количество
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке истории игр:', err);
      setError('Не удалось загрузить историю игр');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Сбрасываем на первую страницу при смене фильтра
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatGameType = (type) => {
    switch (type) {
      case 'pullTabs':
        return 'Pull the Tabs';
      default:
        return type;
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalResults / itemsPerPage);
    
    return (
      <div className="pagination">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="pagination-button"
        >
          &laquo;
        </button>
        
        <span className="current-page">
          Страница {currentPage} из {totalPages || 1}
        </span>
        
        <button 
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={currentPage >= totalPages || historyItems.length < itemsPerPage}
          className="pagination-button"
        >
          &raquo;
        </button>
      </div>
    );
  };

  if (loading && historyItems.length === 0) {
    return <div className="history-loading">Загрузка истории игр...</div>;
  }

  if (error && historyItems.length === 0) {
    return <div className="history-error">{error}</div>;
  }

  return (
    <div className="game-history-container">
      <div className="history-header">
        <h3>
          <FaHistory className="history-icon" />
          История игр
        </h3>
        
        <div className="filter-controls">
          <select 
            className="filter-select"
            value={filter.gameType}
            onChange={(e) => handleFilterChange('gameType', e.target.value)}
          >
            <option value="all">Все игры</option>
            <option value="pullTabs">Pull the Tabs</option>
          </select>
          
          <select 
            className="filter-select"
            value={filter.timeRange}
            onChange={(e) => handleFilterChange('timeRange', e.target.value)}
          >
            <option value="all">За всё время</option>
            <option value="month">За месяц</option>
            <option value="week">За неделю</option>
            <option value="today">За сегодня</option>
          </select>
          
          <select 
            className="filter-select"
            value={filter.resultType}
            onChange={(e) => handleFilterChange('resultType', e.target.value)}
          >
            <option value="all">Все результаты</option>
            <option value="win">Выигрыши</option>
            <option value="loss">Проигрыши</option>
          </select>
        </div>
      </div>
      
      {historyItems.length === 0 ? (
        <div className="no-history">
          <p>История игр пуста. Сыграйте в игры, чтобы увидеть историю!</p>
        </div>
      ) : (
        <>
          <div className="history-list">
            {historyItems.map(item => (
              <div key={item.id} className="history-item">
                <div className="history-item-header">
                  <div className="game-type">
                    {formatGameType(item.gameType)}
                  </div>
                  <div className="game-date">
                    <FaCalendarAlt className="date-icon" />
                    {formatDateTime(item.timestamp)}
                  </div>
                </div>
                
                <div className="history-item-details">
                  <div className="game-cost">
                    <span className="cost-label">Стоимость:</span>
                    <span className="cost-value">
                      <FaCoins className="coin-icon" />
                      {item.cost} МР
                    </span>
                  </div>
                  
                  <div className={`game-result ${item.win > 0 ? 'win' : 'loss'}`}>
                    {item.win > 0 ? (
                      <>
                        <FaTrophy className="result-icon" />
                        <span className="result-text">Выигрыш: {item.win} МР</span>
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="result-icon" />
                        <span className="result-text">Без выигрыша</span>
                      </>
                    )}
                  </div>
                </div>
                
                {item.gameType === 'pullTabs' && (
                  <div className="pull-tabs-details">
                    <div className="tabs-container">
                      {item.tabs && item.tabs.map((tab, index) => (
                        <div 
                          key={index} 
                          className={`tab ${tab.pulled ? 'pulled' : 'not-pulled'} ${tab.value > 0 ? 'win' : ''}`}
                        >
                          {tab.pulled ? (
                            <span className="tab-value">{tab.value}</span>
                          ) : (
                            <span className="tab-hidden">?</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {renderPagination()}
        </>
      )}
      
      <style jsx>{`
        .game-history-container {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 30px;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .history-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.2rem;
          color: #333;
        }
        
        .history-icon {
          color: #3f51b5;
        }
        
        .filter-controls {
          display: flex;
          gap: 10px;
        }
        
        .filter-select {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          background-color: white;
          font-size: 0.9rem;
          color: #555;
          cursor: pointer;
        }
        
        .history-list {
          padding: 1rem;
        }
        
        .history-item {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .history-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.8rem;
          align-items: center;
        }
        
        .game-type {
          font-weight: 600;
          color: #333;
        }
        
        .game-date {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.85rem;
          color: #666;
        }
        
        .date-icon {
          color: #666;
        }
        
        .history-item-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        
        .game-cost {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.95rem;
        }
        
        .cost-label {
          color: #666;
        }
        
        .cost-value {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 500;
        }
        
        .coin-icon {
          color: #ffc107;
        }
        
        .game-result {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 20px;
          font-weight: 500;
        }
        
        .game-result.win {
          background-color: rgba(76, 175, 80, 0.1);
          color: #2e7d32;
        }
        
        .game-result.loss {
          background-color: rgba(244, 67, 54, 0.1);
          color: #c62828;
        }
        
        .result-icon {
          color: inherit;
        }
        
        .pull-tabs-details {
          margin-top: 1rem;
        }
        
        .tabs-container {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        
        .tab {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .tab.pulled {
          background-color: #f5f5f5;
        }
        
        .tab.not-pulled {
          background-color: #e0e0e0;
          color: #999;
        }
        
        .tab.win {
          border: 2px solid #4caf50;
        }
        
        .tab-value {
          color: #333;
        }
        
        .tab-hidden {
          color: #999;
        }
        
        .no-history {
          padding: 3rem;
          text-align: center;
          color: #666;
        }
        
        .history-loading,
        .history-error {
          padding: 2rem;
          text-align: center;
          color: #666;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          padding: 1rem;
          border-top: 1px solid #f0f0f0;
        }
        
        .pagination-button {
          background-color: #f5f5f5;
          border: none;
          border-radius: 4px;
          padding: 8px 15px;
          cursor: pointer;
          font-weight: 600;
          color: #555;
        }
        
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .current-page {
          color: #555;
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .history-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .filter-controls {
            width: 100%;
            flex-wrap: wrap;
          }
          
          .filter-select {
            flex: 1;
            min-width: 120px;
          }
          
          .history-item-details {
            flex-direction: column;
            gap: 10px;
          }
          
          .tabs-container {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default GameHistory; 