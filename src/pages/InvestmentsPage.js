import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import Footer from '../components/Footer';
import { FaChartLine, FaInfoCircle, FaMoneyBillWave, FaPercentage } from 'react-icons/fa';

function InvestmentsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  
  // Пример инвестиционных продуктов
  const [investments] = useState([
    {
      id: 'inv1',
      title: 'Стабильный рост',
      description: 'Консервативная стратегия с низким риском и стабильным доходом',
      returnRate: '5-8%',
      minAmount: 10000,
      term: '12 месяцев',
      risk: 'Низкий',
      category: 'bonds',
      icon: <FaMoneyBillWave />
    },
    {
      id: 'inv2',
      title: 'Сбалансированный портфель',
      description: 'Оптимальное соотношение риска и доходности для долгосрочных инвестиций',
      returnRate: '8-12%',
      minAmount: 50000,
      term: '24 месяца',
      risk: 'Средний',
      category: 'mixed',
      icon: <FaChartLine />
    },
    {
      id: 'inv3',
      title: 'Высокодоходная стратегия',
      description: 'Агрессивная стратегия с высоким потенциалом доходности',
      returnRate: '12-20%',
      minAmount: 100000,
      term: '36 месяцев',
      risk: 'Высокий',
      category: 'stocks',
      icon: <FaPercentage />
    }
  ]);

  useEffect(() => {
    // Слушаем изменения состояния аутентификации
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Отписываемся при размонтировании компонента
    return () => unsubscribe();
  }, []);

  const handleInvestmentClick = (investment) => {
    setSelectedInvestment(investment);
  };

  const closeInvestmentDetails = () => {
    setSelectedInvestment(null);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="investments-page">
      <div className="investments-header">
        <h1>Инвестиционные продукты</h1>
        <p>Выберите подходящий инвестиционный продукт и начните зарабатывать уже сегодня</p>
      </div>

      <div className="investments-container">
        {investments.map((investment) => (
          <div 
            key={investment.id} 
            className="investment-card"
            onClick={() => handleInvestmentClick(investment)}
          >
            <div className="investment-icon">{investment.icon}</div>
            <h3>{investment.title}</h3>
            <p className="investment-description">{investment.description}</p>
            <div className="investment-details">
              <div className="detail">
                <span className="label">Доходность:</span>
                <span className="value">{investment.returnRate}</span>
              </div>
              <div className="detail">
                <span className="label">Срок:</span>
                <span className="value">{investment.term}</span>
              </div>
              <div className="detail">
                <span className="label">Риск:</span>
                <span className={`value risk-${investment.risk.toLowerCase()}`}>{investment.risk}</span>
              </div>
            </div>
            <button className="invest-button">Инвестировать</button>
          </div>
        ))}
      </div>

      {selectedInvestment && (
        <div className="investment-modal-overlay" onClick={closeInvestmentDetails}>
          <div className="investment-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closeInvestmentDetails}>×</button>
            <div className="investment-modal-header">
              <div className="investment-modal-icon">{selectedInvestment.icon}</div>
              <h2>{selectedInvestment.title}</h2>
            </div>
            <div className="investment-modal-content">
              <p className="investment-modal-description">{selectedInvestment.description}</p>
              <div className="investment-modal-details">
                <div className="modal-detail">
                  <span className="modal-label">Доходность:</span>
                  <span className="modal-value">{selectedInvestment.returnRate}</span>
                </div>
                <div className="modal-detail">
                  <span className="modal-label">Минимальная сумма:</span>
                  <span className="modal-value">{selectedInvestment.minAmount.toLocaleString()} ₽</span>
                </div>
                <div className="modal-detail">
                  <span className="modal-label">Срок инвестирования:</span>
                  <span className="modal-value">{selectedInvestment.term}</span>
                </div>
                <div className="modal-detail">
                  <span className="modal-label">Уровень риска:</span>
                  <span className={`modal-value risk-${selectedInvestment.risk.toLowerCase()}`}>{selectedInvestment.risk}</span>
                </div>
              </div>
              <div className="investment-calculator">
                <h3>Калькулятор доходности</h3>
                <p>Рассчитайте потенциальную доходность вашей инвестиции</p>
                <div className="calculator-form">
                  <div className="form-group">
                    <label>Сумма инвестиций (₽)</label>
                    <input type="number" defaultValue={selectedInvestment.minAmount} min={selectedInvestment.minAmount} />
                  </div>
                  <div className="form-group">
                    <label>Срок (месяцев)</label>
                    <input type="number" defaultValue={parseInt(selectedInvestment.term)} min={12} max={60} />
                  </div>
                  <button className="calculate-button">Рассчитать</button>
                </div>
              </div>
              <div className="investment-actions">
                <button className="primary-button">Инвестировать сейчас</button>
                <button className="secondary-button">Добавить в избранное</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="investments-info">
        <div className="info-icon"><FaInfoCircle /></div>
        <div className="info-content">
          <h3>Важная информация</h3>
          <p>Инвестиции сопряжены с рисками. Доходность в прошлом не гарантирует доходность в будущем. Перед инвестированием ознакомьтесь с условиями и рисками.</p>
        </div>
      </div>

      <Footer />

      <style jsx>{`
        .investments-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .investments-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .investments-header h1 {
          color: var(--primary-color);
          margin-bottom: 10px;
        }
        
        .investments-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }
        
        .investments-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        
        .investment-card {
          background-color: var(--card-bg);
          border-radius: 10px;
          padding: 20px;
          box-shadow: var(--card-shadow);
          transition: transform 0.3s, box-shadow 0.3s;
          cursor: pointer;
        }
        
        .investment-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        
        .investment-icon {
          font-size: 2rem;
          color: var(--primary-color);
          margin-bottom: 15px;
        }
        
        .investment-card h3 {
          margin-bottom: 10px;
          color: var(--text-primary);
        }
        
        .investment-description {
          color: var(--text-secondary);
          margin-bottom: 15px;
          font-size: 0.9rem;
        }
        
        .investment-details {
          margin-bottom: 20px;
        }
        
        .detail {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .label {
          color: var(--text-secondary);
        }
        
        .value {
          font-weight: bold;
          color: var(--text-primary);
        }
        
        .risk-низкий {
          color: #4caf50;
        }
        
        .risk-средний {
          color: #ff9800;
        }
        
        .risk-высокий {
          color: #f44336;
        }
        
        .invest-button {
          width: 100%;
          padding: 10px;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .invest-button:hover {
          background-color: var(--primary-dark);
        }
        
        .investments-info {
          display: flex;
          align-items: flex-start;
          background-color: rgba(33, 150, 243, 0.1);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 40px;
        }
        
        .info-icon {
          font-size: 2rem;
          color: #2196f3;
          margin-right: 20px;
        }
        
        .info-content h3 {
          margin-bottom: 10px;
          color: var(--text-primary);
        }
        
        .info-content p {
          color: var(--text-secondary);
        }
        
        .investment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }
        
        .investment-modal {
          background-color: var(--card-bg);
          border-radius: 10px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        
        .close-button {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
        }
        
        .investment-modal-header {
          padding: 20px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }
        
        .investment-modal-icon {
          font-size: 2.5rem;
          color: var(--primary-color);
          margin-right: 20px;
        }
        
        .investment-modal-content {
          padding: 20px;
        }
        
        .investment-modal-description {
          margin-bottom: 20px;
          font-size: 1.1rem;
          color: var(--text-secondary);
        }
        
        .investment-modal-details {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .modal-detail {
          background-color: var(--bg-light);
          padding: 15px;
          border-radius: 8px;
        }
        
        .modal-label {
          display: block;
          margin-bottom: 5px;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
        
        .modal-value {
          font-size: 1.2rem;
          font-weight: bold;
          color: var(--text-primary);
        }
        
        .investment-calculator {
          background-color: var(--bg-light);
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 30px;
        }
        
        .investment-calculator h3 {
          margin-bottom: 10px;
          color: var(--text-primary);
        }
        
        .investment-calculator p {
          color: var(--text-secondary);
          margin-bottom: 20px;
        }
        
        .calculator-form {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 15px;
          align-items: end;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group label {
          margin-bottom: 5px;
          color: var(--text-secondary);
        }
        
        .form-group input {
          padding: 10px;
          border: 1px solid var(--border-color);
          border-radius: 5px;
          background-color: var(--input-bg);
          color: var(--text-primary);
        }
        
        .calculate-button {
          padding: 10px 20px;
          background-color: var(--secondary-color);
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          height: 40px;
        }
        
        .investment-actions {
          display: flex;
          gap: 15px;
        }
        
        .primary-button, .secondary-button {
          padding: 12px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.3s;
        }
        
        .primary-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          flex: 2;
        }
        
        .secondary-button {
          background-color: transparent;
          color: var(--primary-color);
          border: 1px solid var(--primary-color);
          flex: 1;
        }
        
        .primary-button:hover {
          background-color: var(--primary-dark);
        }
        
        .secondary-button:hover {
          background-color: rgba(26, 35, 126, 0.1);
        }
        
        @media (max-width: 768px) {
          .calculator-form {
            grid-template-columns: 1fr;
          }
          
          .investment-actions {
            flex-direction: column;
          }
          
          .investment-modal-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default InvestmentsPage; 