import React from 'react';
import { FaCrown, FaCheck, FaInfoCircle } from 'react-icons/fa';

const PremiumFeatures = ({ isPremium, onPurchaseClick }) => {
  const features = [
    {
      id: 'no_commission',
      title: 'Без комиссии на объявления',
      description: 'Размещайте объявления без комиссии в 15 МР',
      icon: <FaCheck />
    },
    {
      id: 'priority_listing',
      title: 'Приоритетное размещение',
      description: 'Ваши объявления всегда отображаются в начале списка',
      icon: <FaCheck />
    },
    {
      id: 'extended_stats',
      title: 'Расширенная статистика',
      description: 'Получите доступ к подробной статистике по вашим объявлениям и транзакциям',
      icon: <FaCheck />
    },
    {
      id: 'increased_limits',
      title: 'Увеличенные лимиты',
      description: 'Повышенные лимиты на вывод средств и другие операции',
      icon: <FaCheck />
    },
    {
      id: 'exclusive_designs',
      title: 'Эксклюзивный дизайн карт',
      description: 'Доступ к премиум-дизайнам банковских карт',
      icon: <FaCheck />
    }
  ];

  return (
    <div className="premium-features">
      <div className="premium-features-header">
        <FaCrown className="premium-icon" />
        <h2>Премиум-возможности</h2>
      </div>
      
      <div className="features-description">
        <p>
          Получите доступ к расширенным возможностям BankMannru3 и наслаждайтесь
          преимуществами премиум-статуса.
        </p>
      </div>
      
      <div className="features-list">
        {features.map(feature => (
          <div key={feature.id} className="feature-item">
            <div className="feature-icon">{feature.icon}</div>
            <div className="feature-content">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {!isPremium && (
        <div className="premium-cta">
          <button className="purchase-button" onClick={onPurchaseClick}>
            <FaCrown className="button-icon" />
            Приобрести Премиум за 20,000 МР
          </button>
          <div className="premium-info">
            <FaInfoCircle className="info-icon" />
            <span>Премиум-статус действует в течение 1 месяца</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .premium-features {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          margin-bottom: 2rem;
        }
        
        .premium-features-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 1rem;
        }
        
        .premium-icon {
          font-size: 2rem;
          color: #ffc107;
        }
        
        .premium-features-header h2 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
        }
        
        .features-description {
          margin-bottom: 2rem;
          color: #666;
        }
        
        .features-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .feature-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1rem;
          border-radius: 8px;
          background-color: #f9f9f9;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .feature-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        
        .feature-icon {
          background-color: #ffc107;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .feature-content h3 {
          margin: 0 0 0.5rem;
          font-size: 1.1rem;
          color: #333;
        }
        
        .feature-content p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
        
        .premium-cta {
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid #f0f0f0;
        }
        
        .purchase-button {
          background-color: #ffc107;
          color: #333;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          font-size: 1rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.3s;
          margin-bottom: 1rem;
        }
        
        .purchase-button:hover {
          background-color: #ffca28;
        }
        
        .button-icon {
          font-size: 1.1rem;
        }
        
        .premium-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #666;
          font-size: 0.9rem;
        }
        
        .info-icon {
          color: #999;
        }
        
        @media (max-width: 768px) {
          .features-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PremiumFeatures; 