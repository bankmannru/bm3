import React, { useState, useEffect } from 'react';
import { createMarketItem } from '../firebase';

const CATEGORIES = [
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
];

const CONDITIONS = [
  'Новое',
  'Отличное',
  'Хорошее',
  'Удовлетворительное'
];

function CreateMarketItem({ user, userCards, onClose, onItemCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Проверка валидности формы
  const isFormValid = () => {
    return (
      title.trim() !== '' &&
      description.trim() !== '' &&
      price > 0 &&
      category !== '' &&
      condition !== '' &&
      selectedCard !== ''
    );
  };
  
  // Обработка создания товара
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const itemData = {
        title,
        description,
        price: Number(price),
        category,
        condition,
        location: location.trim() || null,
        imageUrl: imageUrl.trim() || null
      };
      
      console.log('Создание товара:', {
        userId: user.uid,
        cardId: selectedCard,
        itemData
      });
      
      const result = await createMarketItem(user.uid, selectedCard, itemData);
      
      if (result.success) {
        setSuccess(true);
        if (onItemCreated) {
          onItemCreated(result.item);
        }
        
        // Сбросить форму после успешного создания
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 2000);
      } else {
        setError(result.error || 'Не удалось создать товар');
      }
    } catch (err) {
      console.error('Ошибка при создании товара:', err);
      setError('Произошла ошибка при создании товара');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-market-item">
      <div className="modal-header">
        <h2>Создание нового объявления</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {success ? (
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h3>Товар успешно создан!</h3>
          <p>Ваше объявление опубликовано на маркете</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-info">
            <p className="commission-info">
              <strong>Комиссия за создание объявления:</strong> 15 МР
            </p>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="title">Название товара *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название товара"
              required
              maxLength={100}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Описание *</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Подробно опишите товар"
              required
              rows={5}
              maxLength={1000}
            />
            <div className="char-counter">{description.length}/1000</div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Цена (МР) *</label>
              <input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                required
                min="1"
                max="1000000"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category">Категория *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Выберите категорию</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="condition">Состояние *</label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                required
              >
                <option value="">Выберите состояние</option>
                {CONDITIONS.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Местоположение</label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Город, район (необязательно)"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="imageUrl">URL изображения</label>
            <input
              type="url"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg (необязательно)"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="card-select">Выберите карту для оплаты комиссии *</label>
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
                  disabled={card.balance < 15}
                >
                  **** {card.cardNumber.slice(-4)} - {new Intl.NumberFormat('ru-RU').format(card.balance)} МР
                  {card.balance < 15 ? ' (недостаточно средств)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !isFormValid()}
            >
              {loading ? 'Создание...' : 'Создать объявление'}
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .create-market-item {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          width: 100%;
          max-width: 600px;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .modal-header h2 {
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
        
        form {
          padding: 1.5rem;
        }
        
        .form-info {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background-color: #e8f5e9;
          border-radius: 4px;
        }
        
        .commission-info {
          margin: 0;
          color: #2e7d32;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .form-row .form-group {
          flex: 1;
          margin-bottom: 0;
        }
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #424242;
        }
        
        input, textarea, select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        
        input:focus, textarea:focus, select:focus {
          border-color: #1a237e;
          outline: none;
        }
        
        .char-counter {
          text-align: right;
          font-size: 0.8rem;
          color: #9e9e9e;
          margin-top: 0.25rem;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
        
        .cancel-button, .submit-button {
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
        
        .cancel-button:hover:not(:disabled) {
          background-color: #e0e0e0;
        }
        
        .submit-button {
          background-color: #4caf50;
          color: white;
          border: none;
        }
        
        .submit-button:hover:not(:disabled) {
          background-color: #66bb6a;
        }
        
        .submit-button:disabled {
          background-color: #c8e6c9;
          cursor: not-allowed;
        }
        
        .success-message {
          padding: 2rem;
          text-align: center;
        }
        
        .success-icon {
          width: 64px;
          height: 64px;
          background-color: #4caf50;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          margin: 0 auto 1.5rem;
        }
        
        .success-message h3 {
          color: #2e7d32;
          margin: 0 0 0.5rem;
        }
        
        .success-message p {
          color: #616161;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

export default CreateMarketItem; 