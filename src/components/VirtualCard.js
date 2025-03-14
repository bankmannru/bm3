import React, { useState } from 'react';
import CardDashboard from './CardDashboard';
import { FaExclamationTriangle } from 'react-icons/fa';

function VirtualCard({ card }) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Форматируем номер карты для отображения
  const formatCardNumber = (number) => {
    return number.match(/.{1,4}/g).join(' ');
  };
  
  // Маскируем номер карты для безопасности
  const maskedCardNumber = () => {
    const lastFour = card.cardNumber.slice(-4);
    return `**** **** **** ${lastFour}`;
  };

  return (
    <>
      <div className="virtual-card-container">
        <div 
          className="virtual-card" 
          style={{ background: card.color }}
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="card-header">
            <div className="bank-logo">МАННРУ БАНК</div>
            <div className="card-chip">
              <img src="/chip.svg" alt="Чип карты" width="50" height="40" />
            </div>
          </div>
          
          <div className="card-info">
            <div className="card-number">
              {showDetails ? formatCardNumber(card.cardNumber) : maskedCardNumber()}
            </div>
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
        
        {showDetails && (
          <div className="card-details-panel">
            <div className="detail-item">
              <span className="detail-label">CVV:</span>
              <span className="detail-value">{card.cvv}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">PIN:</span>
              <span className="detail-value">{card.pin}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Баланс:</span>
              <span className="detail-value">{card.balance.toLocaleString()} ₽</span>
            </div>
            <div className="detail-item mesher-info">
              <span className="detail-label">Платежная система:</span>
              <span className="detail-value mesher-logo">
                <img src="/mesher_light.png" alt="Mesher" width="80" style={{ objectFit: 'contain' }} />
              </span>
            </div>
            <p className="security-note">
              <FaExclamationTriangle style={{ marginRight: '5px', color: '#c62828' }} />
              Никому не сообщайте данные вашей карты!
            </p>
            <button 
              className="manage-card-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDashboard(true);
              }}
            >
              Управление картой
            </button>
          </div>
        )}
      </div>

      {showDashboard && (
        <div className="dashboard-overlay" onClick={() => setShowDashboard(false)}>
          <div className="dashboard-container" onClick={(e) => e.stopPropagation()}>
            <CardDashboard 
              card={card} 
              onClose={() => setShowDashboard(false)} 
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .virtual-card-container {
          margin-bottom: 2rem;
          perspective: 1000px;
        }
        
        .virtual-card {
          width: 100%;
          height: 220px;
          border-radius: 16px;
          padding: 24px;
          color: white;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          overflow: hidden;
        }
        
        .virtual-card:hover {
          transform: translateY(-10px) rotateX(5deg);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
        }
        
        .virtual-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%);
          pointer-events: none;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }
        
        .bank-logo {
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: 1px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .card-info {
          z-index: 1;
        }
        
        .card-number {
          font-size: 1.4rem;
          letter-spacing: 2px;
          margin-bottom: 20px;
          font-family: 'Roboto Mono', monospace;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .card-details-row {
          display: flex;
          justify-content: space-between;
        }
        
        .card-label {
          font-size: 0.7rem;
          opacity: 0.8;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }
        
        .card-name {
          font-size: 1rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .card-expiry {
          font-size: 1rem;
          font-weight: 500;
        }
        
        .card-type {
          position: absolute;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        
        .card-details-panel {
          background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
          border-radius: 0 0 16px 16px;
          padding: 20px;
          margin-top: -5px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .detail-label {
          font-weight: 500;
          color: #495057;
        }
        
        .detail-value {
          font-weight: 700;
          color: #1a237e;
          letter-spacing: 1px;
          font-family: 'Roboto Mono', monospace;
        }
        
        .security-note {
          margin-top: 15px;
          margin-bottom: 20px;
          color: #c62828;
          font-size: 0.9rem;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }
        
        .manage-card-button {
          width: 100%;
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          font-size: 1rem;
        }
        
        .manage-card-button:hover {
          background-color: #3f51b5;
        }
        
        .dashboard-overlay {
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
          padding: 2rem;
          overflow-y: auto;
        }
        
        .dashboard-container {
          width: 100%;
          max-width: 800px;
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
        
        @media (max-width: 576px) {
          .virtual-card {
            height: 200px;
            padding: 20px;
          }
          
          .card-number {
            font-size: 1.2rem;
          }
          
          .card-name, .card-expiry {
            font-size: 0.9rem;
          }
          
          .dashboard-overlay {
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
}

export default VirtualCard; 