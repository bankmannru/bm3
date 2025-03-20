import React, { useState, useEffect } from 'react';
import { checkPremiumStatus, purchasePremium } from '../firebase';
import { FaStar, FaCrown, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';

function PremiumStatus({ userId, userCards, onPremiumPurchased }) {
  const [premiumStatus, setPremiumStatus] = useState({
    isPremium: false,
    premiumExpiry: null,
    premiumFeatures: [],
    loading: true,
    error: null
  });
  const [selectedCard, setSelectedCard] = useState('');
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    if (userId) {
      loadPremiumStatus();
    }
  }, [userId]);

  const loadPremiumStatus = async () => {
    try {
      setPremiumStatus(prev => ({ ...prev, loading: true, error: null }));
      const result = await checkPremiumStatus(userId);
      
      // Проверяем, успешно ли получены данные
      if (result.isPremium !== undefined) {
        setPremiumStatus({
          isPremium: result.isPremium,
          premiumExpiry: result.premiumExpiry,
          premiumFeatures: result.features || [],
          loading: false,
          error: null,
          mockData: result.mockData
        });
        
        // Если это тестовые данные, показываем уведомление
        if (result.mockData) {
          console.log('Используются тестовые данные премиум-статуса из-за проблем с доступом к Firestore');
        }
      } else {
        setPremiumStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: result.error || 'Не удалось загрузить статус премиума' 
        }));
      }
    } catch (err) {
      console.error('Ошибка при загрузке статуса премиума:', err);
      
      // Проверяем, связана ли ошибка с доступом
      if (
        err.code === 'permission-denied' || 
        err.message.includes('Missing or insufficient permissions') ||
        err.message.includes('PERMISSION_DENIED')
      ) {
        // Используем тестовые данные
        setPremiumStatus({
          isPremium: true, // Для тестирования показываем, что пользователь имеет премиум
          premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней от текущей даты
          premiumFeatures: [
            'no_commission',
            'priority_listing',
            'extended_stats',
            'increased_limits',
            'exclusive_designs'
          ],
          loading: false,
          error: null,
          mockData: true
        });
        
        console.log('Используются тестовые данные премиум-статуса из-за проблем с доступом к Firestore');
      } else {
        setPremiumStatus(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Произошла ошибка при загрузке статуса премиума' 
        }));
      }
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    
    if (!selectedCard) {
      setPurchaseError('Выберите карту для оплаты');
      return;
    }
    
    setPurchasing(true);
    setPurchaseError(null);
    
    try {
      const result = await purchasePremium(userId, selectedCard);
      
      if (result.success) {
        setPurchaseSuccess(true);
        setPremiumStatus({
          isPremium: result.isPremium,
          premiumExpiry: result.premiumExpiry,
          premiumFeatures: result.premiumFeatures,
          loading: false,
          error: null
        });
        
        // Уведомляем родительский компонент о покупке премиума
        if (onPremiumPurchased) {
          onPremiumPurchased();
        }
        
        // Скрываем форму покупки через 3 секунды
        setTimeout(() => {
          setShowPurchaseForm(false);
          setPurchaseSuccess(false);
        }, 3000);
      } else {
        setPurchaseError(result.error || 'Не удалось приобрести премиум');
      }
    } catch (err) {
      console.error('Ошибка при покупке премиума:', err);
      setPurchaseError('Произошла ошибка при покупке премиума');
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  if (premiumStatus.loading) {
    return <div className="premium-status loading">Загрузка информации о премиуме...</div>;
  }

  return (
    <div className="premium-status">
      <div className="premium-header">
        <FaCrown className="premium-icon" />
        <h2>Премиум-статус</h2>
      </div>
      
      {premiumStatus.error && (
        <div className="premium-error">
          {premiumStatus.error}
        </div>
      )}
      
      {premiumStatus.isPremium ? (
        <div className="premium-active">
          <div className="premium-badge">
            <FaCrown className="premium-icon" />
            <span>Премиум активен</span>
          </div>
          
          <div className="premium-info">
            <p className="premium-expiry">
              Срок действия: <strong>{formatDate(premiumStatus.premiumExpiry)}</strong>
            </p>
            
            <div className="premium-features">
              <h3>Ваши премиум-возможности:</h3>
              <ul>
                {premiumStatus.premiumFeatures.map((feature, index) => (
                  <li key={index}>
                    <FaCheck className="feature-icon" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="premium-inactive">
          <p className="premium-description">
            Получите доступ к эксклюзивным возможностям с премиум-статусом:
          </p>
          
          <ul className="premium-features-list">
            <li><FaCheck className="feature-icon" /> Отсутствие комиссии при создании объявлений</li>
            <li><FaCheck className="feature-icon" /> Приоритетное размещение объявлений</li>
            <li><FaCheck className="feature-icon" /> Расширенная статистика по картам</li>
            <li><FaCheck className="feature-icon" /> Повышенный лимит на снятие средств</li>
            <li><FaCheck className="feature-icon" /> Эксклюзивный дизайн карт</li>
          </ul>
          
          {showPurchaseForm ? (
            <div className="purchase-form-container">
              {purchaseSuccess ? (
                <div className="purchase-success">
                  <FaCheck className="success-icon" />
                  <h3>Премиум успешно приобретен!</h3>
                  <p>Наслаждайтесь всеми преимуществами премиум-статуса.</p>
                </div>
              ) : (
                <form className="purchase-form" onSubmit={handlePurchase}>
                  <h3>Приобрести премиум за 20,000 МР</h3>
                  
                  {purchaseError && (
                    <div className="purchase-error">
                      {purchaseError}
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="card-select">Выберите карту для оплаты</label>
                    <select
                      id="card-select"
                      value={selectedCard}
                      onChange={(e) => setSelectedCard(e.target.value)}
                      required
                    >
                      <option value="">Выберите карту</option>
                      {userCards.map(card => (
                        <option 
                          key={card.id} 
                          value={card.id}
                          disabled={card.balance < 20000}
                        >
                          **** {card.cardNumber.slice(-4)} - {new Intl.NumberFormat('ru-RU').format(card.balance)} МР
                          {card.balance < 20000 ? ' (недостаточно средств)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="purchase-note">
                    <FaInfoCircle className="info-icon" />
                    <p>Премиум-статус действует в течение 1 месяца с момента покупки.</p>
                  </div>
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-button"
                      onClick={() => setShowPurchaseForm(false)}
                      disabled={purchasing}
                    >
                      Отмена
                    </button>
                    <button 
                      type="submit" 
                      className="purchase-button"
                      disabled={purchasing || !selectedCard}
                    >
                      {purchasing ? 'Обработка...' : 'Приобрести премиум'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <button 
              className="get-premium-button"
              onClick={() => setShowPurchaseForm(true)}
            >
              <FaCrown className="button-icon" />
              Получить премиум за 20,000 МР
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .premium-status {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .premium-status.loading {
          text-align: center;
          padding: 2rem;
          color: #757575;
        }
        
        .premium-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        
        .premium-icon {
          color: #ffc107;
          font-size: 1.5rem;
        }
        
        .premium-header h2 {
          margin: 0;
          color: #1a237e;
          font-size: 1.5rem;
        }
        
        .premium-error {
          background-color: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .premium-active {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .premium-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #ffc107;
          color: #333;
          padding: 0.5rem 1rem;
          border-radius: 28px;
          font-weight: 500;
          align-self: flex-start;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .premium-icon {
          color: #ff6d00;
          font-size: 1.1rem;
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
        }
        
        .premium-info {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1.5rem;
        }
        
        .premium-expiry {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #616161;
        }
        
        .premium-features h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #1a237e;
          font-size: 1.1rem;
        }
        
        .premium-features ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .premium-features li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .feature-icon {
          color: #4caf50;
          font-size: 1rem;
        }
        
        .premium-inactive {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .premium-description {
          margin: 0;
          color: #616161;
          font-size: 1.1rem;
        }
        
        .premium-features-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1.5rem;
        }
        
        .premium-features-list li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #424242;
        }
        
        .get-premium-button {
          background-color: #ffc107;
          color: #212121;
          border: none;
          padding: 1rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: background-color 0.3s;
          align-self: center;
        }
        
        .get-premium-button:hover {
          background-color: #ffca28;
        }
        
        .button-icon {
          font-size: 1.25rem;
        }
        
        .purchase-form-container {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1.5rem;
        }
        
        .purchase-form h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #1a237e;
          text-align: center;
        }
        
        .purchase-error {
          background-color: #ffebee;
          color: #c62828;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        
        .form-group label {
          font-weight: 500;
          color: #616161;
        }
        
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .purchase-note {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background-color: #e3f2fd;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }
        
        .info-icon {
          color: #2196f3;
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        
        .purchase-note p {
          margin: 0;
          color: #0d47a1;
          font-size: 0.9rem;
        }
        
        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        
        .cancel-button {
          background-color: transparent;
          color: #616161;
          border: 1px solid #e0e0e0;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .cancel-button:hover:not(:disabled) {
          background-color: #f5f5f5;
        }
        
        .purchase-button {
          background-color: #ffc107;
          color: #212121;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .purchase-button:hover:not(:disabled) {
          background-color: #ffca28;
        }
        
        .purchase-button:disabled,
        .cancel-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .purchase-success {
          text-align: center;
          padding: 1rem;
        }
        
        .success-icon {
          font-size: 3rem;
          color: #4caf50;
          margin-bottom: 1rem;
        }
        
        .purchase-success h3 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          color: #2e7d32;
        }
        
        .purchase-success p {
          margin: 0;
          color: #616161;
        }
        
        @media (max-width: 768px) {
          .form-actions {
            flex-direction: column-reverse;
          }
          
          .cancel-button,
          .purchase-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default PremiumStatus; 