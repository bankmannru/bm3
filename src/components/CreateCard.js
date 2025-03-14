import React, { useState } from 'react';
import { createCard } from '../firebase';

const cardGradients = [
  { 
    name: 'Синий', 
    value: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)' 
  },
  { 
    name: 'Фиолетовый', 
    value: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)' 
  },
  { 
    name: 'Красный', 
    value: 'linear-gradient(135deg, #b71c1c 0%, #e53935 100%)' 
  },
  { 
    name: 'Зеленый', 
    value: 'linear-gradient(135deg, #1b5e20 0%, #43a047 100%)' 
  },
  { 
    name: 'Черный', 
    value: 'linear-gradient(135deg, #212121 0%, #424242 100%)' 
  },
  { 
    name: 'Золотой', 
    value: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 50%, #b38728 100%)' 
  },
  { 
    name: 'Серебряный', 
    value: 'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)' 
  },
  { 
    name: 'Закат', 
    value: 'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)' 
  },
  { 
    name: 'Океан', 
    value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' 
  }
];

function CreateCard({ userId, onSuccess, onClose }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(cardGradients[0].value);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const [customColor1, setCustomColor1] = useState('#1a237e');
  const [customColor2, setCustomColor2] = useState('#3f51b5');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Получаем текущий градиент для предпросмотра
  const getCurrentGradient = () => {
    if (isCustomColor) {
      return `linear-gradient(135deg, ${customColor1} 0%, ${customColor2} 100%)`;
    }
    return selectedGradient;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await createCard(userId, {
        firstName,
        lastName,
        color: getCurrentGradient()
      });

      if (result.success) {
        onSuccess(result.card);
      } else {
        setError(result.error || 'Произошла ошибка при создании карты');
      }
    } catch (err) {
      setError('Произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-card-modal">
      <div className="create-card-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2 className="create-card-title">Создание новой карты</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="create-card-form">
          <div className="form-group">
            <label htmlFor="firstName">Имя</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Фамилия</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <div className="color-selection-header">
              <label>Дизайн карты</label>
              <div className="custom-color-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={isCustomColor}
                    onChange={() => setIsCustomColor(!isCustomColor)}
                  />
                  <span className="toggle-text">Свой цвет</span>
                </label>
              </div>
            </div>
            
            {isCustomColor ? (
              <div className="custom-color-inputs">
                <div className="color-input-group">
                  <label htmlFor="customColor1">Цвет 1</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      id="customColor1"
                      value={customColor1}
                      onChange={(e) => setCustomColor1(e.target.value)}
                    />
                    <input
                      type="text"
                      value={customColor1}
                      onChange={(e) => setCustomColor1(e.target.value)}
                    />
                  </div>
                </div>
                <div className="color-input-group">
                  <label htmlFor="customColor2">Цвет 2</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      id="customColor2"
                      value={customColor2}
                      onChange={(e) => setCustomColor2(e.target.value)}
                    />
                    <input
                      type="text"
                      value={customColor2}
                      onChange={(e) => setCustomColor2(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="gradient-options">
                {cardGradients.map((gradient) => (
                  <div 
                    key={gradient.value}
                    className={`gradient-option ${selectedGradient === gradient.value ? 'selected' : ''}`}
                    style={{ background: gradient.value }}
                    onClick={() => setSelectedGradient(gradient.value)}
                    title={gradient.name}
                  >
                    {selectedGradient === gradient.value && <span className="check-mark">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="card-preview" style={{ background: getCurrentGradient() }}>
            <div className="card-header">
              <div className="bank-logo">МАННРУ БАНК</div>
              <div className="card-chip">
                <img src="/chip.svg" alt="Чип карты" width="50" height="40" />
              </div>
            </div>
            
            <div className="card-info">
              <div className="card-number">**** **** **** ****</div>
              <div className="card-details-row">
                <div className="card-holder">
                  <div className="card-label">ДЕРЖАТЕЛЬ КАРТЫ</div>
                  <div className="card-name">{firstName || 'ИМЯ'} {lastName || 'ФАМИЛИЯ'}</div>
                </div>
                <div className="card-expiry-section">
                  <div className="card-label">СРОК ДЕЙСТВИЯ</div>
                  <div className="card-expiry">MM/YY</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-info-note">
            <div className="payment-system">
              <span>Платежная система:</span>
              <img src="/mesher.png" alt="Mesher" width="80" style={{ objectFit: 'contain', marginLeft: '10px' }} />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? 'Создание...' : 'Создать карту'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .create-card-modal {
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
          overflow-y: auto;
          padding: 2rem 0;
        }

        .create-card-content {
          background-color: white;
          border-radius: 8px;
          padding: 2rem;
          width: 100%;
          max-width: 500px;
          position: relative;
          margin: auto;
        }

        .close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #616161;
        }

        .create-card-title {
          color: #1a237e;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .create-card-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #616161;
        }

        .form-group input[type="text"] {
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
          font-family: 'Roboto', sans-serif;
        }

        .color-selection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .custom-color-toggle {
          display: flex;
          align-items: center;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .toggle-label input {
          margin-right: 0.5rem;
        }

        .toggle-text {
          font-size: 0.9rem;
          color: #1a237e;
        }

        .gradient-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .gradient-option {
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid transparent;
          transition: transform 0.2s;
        }

        .gradient-option:hover {
          transform: scale(1.05);
        }

        .gradient-option.selected {
          border-color: #1a237e;
        }

        .check-mark {
          color: white;
          font-weight: bold;
          text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        }

        .custom-color-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .color-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .color-input-wrapper {
          display: flex;
          gap: 0.5rem;
        }

        .color-input-wrapper input[type="color"] {
          width: 40px;
          height: 40px;
          padding: 0;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          cursor: pointer;
        }

        .color-input-wrapper input[type="text"] {
          flex: 1;
        }

        .card-preview {
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
          margin-bottom: 1.5rem;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
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

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          z-index: 1;
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

        .card-holder {
          display: flex;
          flex-direction: column;
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

        .card-expiry-section {
          display: flex;
          flex-direction: column;
        }

        .card-expiry {
          font-size: 1rem;
          font-weight: 500;
        }

        .card-type {
          position: absolute;
          bottom: 20px;
          right: 20px;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .card-info-note {
          margin-top: -0.5rem;
          margin-bottom: 1rem;
          display: flex;
          justify-content: flex-end;
        }

        .payment-system {
          display: flex;
          align-items: center;
          color: #616161;
          font-size: 0.9rem;
        }

        .submit-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .submit-button:hover {
          background-color: #3f51b5;
        }

        .submit-button:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .create-card-content {
            padding: 1.5rem;
          }

          .gradient-options {
            grid-template-columns: repeat(2, 1fr);
          }

          .custom-color-inputs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default CreateCard; 