import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { FaShoppingCart, FaMoneyBillWave } from 'react-icons/fa';

function MarketTransactions({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'purchases', 'sales'

  useEffect(() => {
    if (userId) {
      loadTransactions();
    }
  }, [userId, filter]);

  const loadTransactions = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let marketTransactionsQuery;
      
      if (filter === 'purchases') {
        // Только покупки
        marketTransactionsQuery = query(
          collection(firestore, "transactions"),
          where("cardId", "==", userId),
          where("type", "==", "purchase"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
      } else if (filter === 'sales') {
        // Только продажи
        marketTransactionsQuery = query(
          collection(firestore, "transactions"),
          where("cardId", "==", userId),
          where("type", "==", "sale"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
      } else {
        // Все транзакции (покупки и продажи)
        const purchasesQuery = query(
          collection(firestore, "transactions"),
          where("cardId", "==", userId),
          where("type", "==", "purchase"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        
        const salesQuery = query(
          collection(firestore, "transactions"),
          where("cardId", "==", userId),
          where("type", "==", "sale"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        
        try {
          const [purchasesSnapshot, salesSnapshot] = await Promise.all([
            getDocs(purchasesQuery),
            getDocs(salesQuery)
          ]);
          
          const purchases = purchasesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'purchase'
          }));
          
          const sales = salesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'sale'
          }));
          
          // Объединяем и сортируем по времени
          const allTransactions = [...purchases, ...sales].sort((a, b) => {
            if (!a.timestamp || !b.timestamp) return 0;
            return b.timestamp.toDate ? b.timestamp.toDate() - a.timestamp.toDate() : 0;
          });
          
          setTransactions(allTransactions);
          setLoading(false);
          return;
        } catch (err) {
          console.error('Ошибка при загрузке транзакций:', err);
          throw err;
        }
      }
      
      const snapshot = await getDocs(marketTransactionsQuery);
      const transactionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTransactions(transactionsData);
    } catch (err) {
      console.error('Ошибка при загрузке транзакций маркета:', err);
      setError('Не удалось загрузить историю транзакций маркета');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="market-transactions">
      <div className="transactions-header">
        <h2>История транзакций маркета</h2>
        <div className="filter-controls">
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Все
          </button>
          <button 
            className={`filter-button ${filter === 'purchases' ? 'active' : ''}`}
            onClick={() => setFilter('purchases')}
          >
            Покупки
          </button>
          <button 
            className={`filter-button ${filter === 'sales' ? 'active' : ''}`}
            onClick={() => setFilter('sales')}
          >
            Продажи
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-message">Загрузка транзакций...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : transactions.length === 0 ? (
        <div className="empty-message">
          {filter === 'all' 
            ? 'У вас пока нет транзакций на маркете' 
            : filter === 'purchases' 
              ? 'У вас пока нет покупок на маркете' 
              : 'У вас пока нет продаж на маркете'
          }
        </div>
      ) : (
        <div className="transactions-list">
          {transactions.map(transaction => (
            <div 
              key={transaction.id} 
              className={`transaction-item ${transaction.type}`}
            >
              <div className="transaction-icon">
                {transaction.type === 'purchase' ? <FaShoppingCart /> : <FaMoneyBillWave />}
              </div>
              <div className="transaction-details">
                <div className="transaction-title">
                  {transaction.description || (transaction.type === 'purchase' 
                    ? 'Покупка товара' 
                    : 'Продажа товара'
                  )}
                </div>
                <div className="transaction-date">
                  {formatDate(transaction.timestamp)}
                </div>
              </div>
              <div className="transaction-amount">
                {transaction.type === 'purchase' 
                  ? `-${formatPrice(transaction.amount)}` 
                  : `+${formatPrice(transaction.amount)}`
                }
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .market-transactions {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .transactions-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .transactions-header h2 {
          margin: 0;
          color: #1a237e;
          font-size: 1.25rem;
        }
        
        .filter-controls {
          display: flex;
          gap: 0.5rem;
        }
        
        .filter-button {
          background-color: #f5f5f5;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .filter-button.active {
          background-color: #1a237e;
          color: white;
        }
        
        .loading-message,
        .error-message,
        .empty-message {
          padding: 2rem;
          text-align: center;
        }
        
        .loading-message {
          color: #616161;
        }
        
        .error-message {
          color: #c62828;
        }
        
        .empty-message {
          color: #616161;
          font-style: italic;
        }
        
        .transactions-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .transaction-item {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f5f5f5;
          transition: background-color 0.3s;
        }
        
        .transaction-item:hover {
          background-color: #f9f9f9;
        }
        
        .transaction-item.purchase .transaction-amount {
          color: #c62828;
        }
        
        .transaction-item.sale .transaction-amount {
          color: #2e7d32;
        }
        
        .transaction-icon {
          font-size: 1.5rem;
          margin-right: 1rem;
          color: ${props => props.type === 'purchase' ? '#c62828' : '#2e7d32'};
          display: flex;
          align-items: center;
        }
        
        .transaction-details {
          flex: 1;
        }
        
        .transaction-title {
          font-weight: 500;
          color: #212121;
          margin-bottom: 0.25rem;
        }
        
        .transaction-date {
          font-size: 0.8rem;
          color: #9e9e9e;
        }
        
        .transaction-amount {
          font-weight: 700;
          font-size: 1.1rem;
        }
        
        @media (max-width: 768px) {
          .transactions-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .filter-controls {
            width: 100%;
            justify-content: space-between;
          }
          
          .transaction-item {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default MarketTransactions; 