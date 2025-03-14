import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';

function CardDashboard({ card, onClose }) {
  const [activeTab, setActiveTab] = useState('info');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cardSettings, setCardSettings] = useState({
    isBlocked: card.isBlocked || false,
    internetPayments: card.internetPayments || true,
    contactlessPayments: card.contactlessPayments || true,
    withdrawalLimit: card.withdrawalLimit || 100000,
    notifyOnTransaction: card.notifyOnTransaction || true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Блокируем прокрутку фона при открытии модального окна
  useEffect(() => {
    // Сохраняем текущую позицию прокрутки
    const scrollY = window.scrollY;
    
    // Блокируем прокрутку body
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    
    // Восстанавливаем прокрутку при закрытии
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Загрузка транзакций при монтировании компонента
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        // Здесь будет запрос к Firestore для получения транзакций
        // Для демонстрации используем моковые данные
        const mockTransactions = [
          {
            id: '1',
            date: new Date(2024, 2, 15, 14, 30),
            amount: -1250,
            description: 'Кафе "Вкусно и точка"',
            category: 'Рестораны',
            status: 'completed'
          },
          {
            id: '2',
            date: new Date(2024, 2, 14, 10, 15),
            amount: -3500,
            description: 'Супермаркет "Пятёрочка"',
            category: 'Продукты',
            status: 'completed'
          },
          {
            id: '3',
            date: new Date(2024, 2, 12, 18, 45),
            amount: 15000,
            description: 'Пополнение счета',
            category: 'Пополнение',
            status: 'completed'
          },
          {
            id: '4',
            date: new Date(2024, 2, 10, 9, 20),
            amount: -2800,
            description: 'АЗС "Лукойл"',
            category: 'Транспорт',
            status: 'completed'
          },
          {
            id: '5',
            date: new Date(2024, 2, 8, 12, 10),
            amount: -5600,
            description: 'Магазин "Спортмастер"',
            category: 'Покупки',
            status: 'completed'
          }
        ];
        
        // Имитация задержки загрузки данных
        setTimeout(() => {
          setTransactions(mockTransactions);
          setLoading(false);
        }, 800);
        
      } catch (error) {
        console.error('Ошибка при загрузке транзакций:', error);
        setLoading(false);
      }
    };

    loadTransactions();
  }, [card.id]);

  // Функция для сохранения настроек карты
  const saveCardSettings = async () => {
    setSavingSettings(true);
    try {
      // Здесь будет запрос к Firestore для обновления настроек карты
      // Для демонстрации просто имитируем задержку
      setTimeout(() => {
        setIsEditing(false);
        setSavingSettings(false);
      }, 800);
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      setSavingSettings(false);
    }
  };

  // Форматирование даты
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Форматирование суммы
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card-dashboard" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <h2>Управление картой</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Информация
          </button>
          <button 
            className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Транзакции
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Настройки
          </button>
        </div>
        
        <div className="dashboard-content">
          {activeTab === 'info' && (
            <div className="info-tab">
              <div className="card-preview" style={{ background: card.color }}>
                <div className="card-header">
                  <div className="bank-logo">МАННРУ БАНК</div>
                  <div className="card-chip">
                    <img src="/chip.svg" alt="Чип карты" width="50" height="40" />
                  </div>
                </div>
                
                <div className="card-info">
                  <div className="card-number">{card.cardNumber.match(/.{1,4}/g).join(' ')}</div>
                  <div className="card-details-row">
                    <div className="card-holder">
                      <div className="card-label">ДЕРЖАТЕЛЬ КАРТЫ</div>
                      <div className="card-name">{card.firstName} {card.lastName}</div>
                    </div>
                    <div className="card-expiry-section">
                      <div className="card-label">СРОК ДЕЙСТВИЯ</div>
                      <div className="card-expiry">{card.expiryDate}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-details">
                <div className="detail-row">
                  <span className="detail-label">Номер карты:</span>
                  <span className="detail-value">{card.cardNumber.match(/.{1,4}/g).join(' ')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Держатель:</span>
                  <span className="detail-value">{card.firstName} {card.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Срок действия:</span>
                  <span className="detail-value">{card.expiryDate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">CVV:</span>
                  <span className="detail-value">{card.cvv}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">PIN:</span>
                  <span className="detail-value">{card.pin}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Баланс:</span>
                  <span className="detail-value">{formatAmount(card.balance)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Статус:</span>
                  <span className={`detail-value status ${cardSettings.isBlocked ? 'blocked' : 'active'}`}>
                    {cardSettings.isBlocked ? 'Заблокирована' : 'Активна'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Платежная система:</span>
                  <span className="detail-value payment-system">
                    <img src="/mesher.png" alt="Mesher" width="80" style={{ objectFit: 'contain' }} />
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="transactions-tab">
              <div className="transactions-header">
                <h3>История операций</h3>
                <div className="balance-info">
                  <span>Текущий баланс:</span>
                  <span className="balance-amount">{formatAmount(card.balance)}</span>
                </div>
              </div>

              {loading ? (
                <div className="loading">Загрузка операций...</div>
              ) : transactions.length > 0 ? (
                <div className="transactions-list">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="transaction-icon">
                        {transaction.amount > 0 ? (
                          <span className="income-icon">↓</span>
                        ) : (
                          <span className="expense-icon">↑</span>
                        )}
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-description">{transaction.description}</div>
                        <div className="transaction-category">{transaction.category}</div>
                        <div className="transaction-date">{formatDate(transaction.date)}</div>
                      </div>
                      <div className={`transaction-amount ${transaction.amount > 0 ? 'income' : 'expense'}`}>
                        {formatAmount(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-transactions">
                  <p>У вас пока нет операций по этой карте.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-tab">
              <h3>Настройки карты</h3>
              
              <div className="settings-form">
                <div className="setting-item">
                  <div className="setting-label">Статус карты</div>
                  <div className="setting-control">
                    {isEditing ? (
                      <select 
                        value={cardSettings.isBlocked ? 'blocked' : 'active'}
                        onChange={(e) => setCardSettings({
                          ...cardSettings,
                          isBlocked: e.target.value === 'blocked'
                        })}
                      >
                        <option value="active">Активна</option>
                        <option value="blocked">Заблокирована</option>
                      </select>
                    ) : (
                      <span className={`status-badge ${cardSettings.isBlocked ? 'blocked' : 'active'}`}>
                        {cardSettings.isBlocked ? 'Заблокирована' : 'Активна'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">Интернет-платежи</div>
                  <div className="setting-control">
                    {isEditing ? (
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={cardSettings.internetPayments}
                          onChange={(e) => setCardSettings({
                            ...cardSettings,
                            internetPayments: e.target.checked
                          })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    ) : (
                      <span className={`status-badge ${cardSettings.internetPayments ? 'enabled' : 'disabled'}`}>
                        {cardSettings.internetPayments ? 'Разрешены' : 'Запрещены'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">Бесконтактные платежи</div>
                  <div className="setting-control">
                    {isEditing ? (
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={cardSettings.contactlessPayments}
                          onChange={(e) => setCardSettings({
                            ...cardSettings,
                            contactlessPayments: e.target.checked
                          })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    ) : (
                      <span className={`status-badge ${cardSettings.contactlessPayments ? 'enabled' : 'disabled'}`}>
                        {cardSettings.contactlessPayments ? 'Разрешены' : 'Запрещены'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">Лимит на снятие (₽/день)</div>
                  <div className="setting-control">
                    {isEditing ? (
                      <input 
                        type="number" 
                        value={cardSettings.withdrawalLimit}
                        onChange={(e) => setCardSettings({
                          ...cardSettings,
                          withdrawalLimit: parseInt(e.target.value)
                        })}
                        min="0"
                        step="1000"
                      />
                    ) : (
                      <span>{formatAmount(cardSettings.withdrawalLimit)}</span>
                    )}
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">Уведомления о транзакциях</div>
                  <div className="setting-control">
                    {isEditing ? (
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={cardSettings.notifyOnTransaction}
                          onChange={(e) => setCardSettings({
                            ...cardSettings,
                            notifyOnTransaction: e.target.checked
                          })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    ) : (
                      <span className={`status-badge ${cardSettings.notifyOnTransaction ? 'enabled' : 'disabled'}`}>
                        {cardSettings.notifyOnTransaction ? 'Включены' : 'Отключены'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                {isEditing ? (
                  <>
                    <button 
                      className="save-button" 
                      onClick={saveCardSettings}
                      disabled={savingSettings}
                    >
                      {savingSettings ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button 
                      className="cancel-button" 
                      onClick={() => setIsEditing(false)}
                      disabled={savingSettings}
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <button 
                    className="edit-button" 
                    onClick={() => setIsEditing(true)}
                  >
                    Изменить настройки
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
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
          padding: 1rem;
        }
        
        .card-dashboard {
          background-color: white;
          border-radius: 8px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          flex-shrink: 0;
        }
        
        .dashboard-header h2 {
          margin: 0;
          color: #1a237e;
          font-size: 1.5rem;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #9e9e9e;
          transition: color 0.3s;
        }
        
        .close-button:hover {
          color: #f44336;
        }
        
        .dashboard-tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
          flex-shrink: 0;
        }
        
        .tab-button {
          flex: 1;
          padding: 1rem;
          background: none;
          border: none;
          font-weight: 500;
          color: #616161;
          cursor: pointer;
          transition: all 0.3s;
          border-bottom: 2px solid transparent;
        }
        
        .tab-button.active {
          color: #1a237e;
          border-bottom-color: #1a237e;
        }
        
        .tab-button:hover:not(.active) {
          background-color: #f5f5f5;
        }
        
        .dashboard-content {
          padding: 1.5rem;
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        
        .card-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .card-preview {
          background: ${card.color || '#1a237e'};
          color: white;
          border-radius: 16px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          aspect-ratio: 1.6 / 1;
        }
        
        .card-preview::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%);
          pointer-events: none;
        }
        
        .card-number-display {
          font-size: 1.4rem;
          letter-spacing: 2px;
          margin: 1.5rem 0;
          font-family: 'Roboto Mono', monospace;
        }
        
        .card-details {
          display: flex;
          justify-content: space-between;
        }
        
        .card-holder-info, .card-expiry-info {
          display: flex;
          flex-direction: column;
        }
        
        .card-label {
          font-size: 0.7rem;
          opacity: 0.8;
          margin-bottom: 0.25rem;
        }
        
        .card-value {
          font-size: 1rem;
          font-weight: 500;
        }
        
        .info-section {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1.5rem;
        }
        
        .info-title {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #1a237e;
          font-size: 1.2rem;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .info-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }
        
        .info-label {
          color: #616161;
          font-weight: 500;
        }
        
        .info-value {
          color: #212121;
          font-weight: 700;
        }
        
        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .transaction-item {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background-color: #f5f5f5;
          border-radius: 8px;
          transition: background-color 0.3s;
        }
        
        .transaction-item:hover {
          background-color: #e0e0e0;
        }
        
        .transaction-info {
          display: flex;
          flex-direction: column;
        }
        
        .transaction-description {
          font-weight: 500;
          color: #212121;
          margin-bottom: 0.25rem;
        }
        
        .transaction-date {
          font-size: 0.8rem;
          color: #757575;
        }
        
        .transaction-amount {
          font-weight: 700;
        }
        
        .transaction-amount.positive {
          color: #4caf50;
        }
        
        .transaction-amount.negative {
          color: #f44336;
        }
        
        .loading-indicator {
          text-align: center;
          padding: 2rem;
          color: #757575;
        }
        
        .no-transactions {
          text-align: center;
          padding: 2rem;
          color: #757575;
          background-color: #f5f5f5;
          border-radius: 8px;
        }
        
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .settings-label {
          font-weight: 500;
          color: #212121;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 34px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background-color: #1a237e;
        }
        
        input:focus + .toggle-slider {
          box-shadow: 0 0 1px #1a237e;
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(26px);
        }
        
        .settings-description {
          font-size: 0.9rem;
          color: #757575;
          margin-top: 0.25rem;
        }
        
        .limit-input {
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
          width: 100%;
          max-width: 200px;
        }
        
        .settings-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .cancel-button, .save-button {
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .cancel-button {
          background-color: #f5f5f5;
          color: #616161;
          border: 1px solid #e0e0e0;
        }
        
        .cancel-button:hover {
          background-color: #e0e0e0;
        }
        
        .save-button {
          background-color: #1a237e;
          color: white;
          border: none;
        }
        
        .save-button:hover {
          background-color: #3f51b5;
        }
        
        .save-button:disabled {
          background-color: #c5cae9;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .modal-overlay {
            padding: 0;
          }
          
          .card-dashboard {
            height: 100%;
            max-height: 100%;
            border-radius: 0;
          }
          
          .dashboard-tabs {
            overflow-x: auto;
          }
          
          .tab-button {
            white-space: nowrap;
            padding: 1rem 0.75rem;
          }
          
          .card-preview {
            aspect-ratio: auto;
            height: 200px;
          }
        }
      `}</style>
    </div>
  );
}

export default CardDashboard; 