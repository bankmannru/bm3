import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { FaUsers, FaSearch, FaCoins, FaCreditCard, FaPaperPlane, FaCreditCard as FaCard, FaUser, FaMoneyBillWave, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function QuickTransfer({ userId, userCards, onNewTransfersChange }) {
  const [recentRecipients, setRecentRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [amount, setAmount] = useState(100);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [receivedTransfers, setReceivedTransfers] = useState([]);
  const [transferByCard, setTransferByCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name' или 'card'
  const [searchLoading, setSearchLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Инициализация компонента
  useEffect(() => {
    if (userId) {
      // Загружаем данные
      loadRecentRecipients();
      loadReceivedTransfers();
      
      // Устанавливаем первую карту по умолчанию, если они доступны
      if (userCards && userCards.length > 0 && !selectedCardId) {
        setSelectedCardId(userCards[0].id);
      }
    }
  }, [userId]);
  
  // Обновляем выбранную карту, если изменились доступные карты
  useEffect(() => {
    if (userCards && userCards.length > 0 && (!selectedCardId || !userCards.find(card => card.id === selectedCardId))) {
      setSelectedCardId(userCards[0].id);
    }
  }, [userCards]);
  
  // Периодическое обновление полученных переводов
  useEffect(() => {
    if (!userId) return;
    
    // Загружаем переводы сразу
    loadReceivedTransfers();
    
    // Устанавливаем интервал обновления
    const interval = setInterval(() => {
      loadReceivedTransfers();
    }, 30000); // Обновляем каждые 30 секунд
    
    return () => clearInterval(interval);
  }, [userId]);

  const loadRecentRecipients = async () => {
    try {
      // Получаем последние 5 уникальных получателей из выполненных транзакций
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef, 
        where('senderId', '==', userId),
        where('type', '==', 'transfer'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Создаем Map для хранения уникальных получателей
      const recipientsMap = new Map();
      
      querySnapshot.forEach((doc) => {
        const transaction = { id: doc.id, ...doc.data() };
        
        // Если получателя еще нет в Map, добавляем его
        if (!recipientsMap.has(transaction.receiverId)) {
          recipientsMap.set(transaction.receiverId, {
            id: transaction.receiverId,
            name: transaction.receiverName,
            lastTransferAmount: transaction.amount,
            ...(transaction.cardNumber && { cardNumber: transaction.cardNumber })
          });
        }
      });
      
      // Преобразуем Map в массив и ограничиваем 5 элементами
      setRecentRecipients(Array.from(recipientsMap.values()).slice(0, 5));
    } catch (error) {
      console.error('Ошибка при загрузке недавних получателей:', error);
    }
  };

  // Загрузка полученных переводов
  const loadReceivedTransfers = async () => {
    try {
      // Получаем последние 5 полученных транзакций
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef, 
        where('receiverId', '==', userId),
        where('type', '==', 'transfer'),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const transfers = [];
      
      querySnapshot.forEach((doc) => {
        const transaction = { id: doc.id, ...doc.data() };
        transfers.push(transaction);
      });
      
      setReceivedTransfers(transfers);
      
      // Проверяем, есть ли непрочитанные переводы
      const hasUnread = transfers.some(transfer => !transfer.seen);
      
      // Если у нас есть доступ к родительскому компоненту через props
      // то можем обновить состояние непрочитанных переводов
      if (typeof onNewTransfersChange === 'function') {
        onNewTransfersChange(hasUnread);
      }
    } catch (error) {
      console.error('Ошибка при загрузке полученных переводов:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      toast.warning('Введите имя пользователя для поиска');
      return;
    }
    
    setSearchLoading(true);
    try {
      console.log('Ищем пользователя:', searchInput);
      
      // Преобразуем запрос в нижний регистр для регистронезависимого поиска
      const lowerCaseQuery = searchInput.toLowerCase().trim();
      
      // Получаем всех пользователей из базы данных
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log(`Найдено ${usersSnapshot.size} пользователей в базе`);
      
      const results = [];
      
      // Проходим по всем пользователям и ищем соответствия в имени или email
      usersSnapshot.forEach((userDoc) => {
        // Пропускаем текущего пользователя
        if (userDoc.id === userId) return;
        
        const userData = userDoc.data();
        const displayName = userData.displayName || '';
        const email = userData.email || '';
        
        if (displayName.toLowerCase().includes(lowerCaseQuery) || 
            email.toLowerCase().includes(lowerCaseQuery)) {
          console.log('Найден подходящий пользователь:', userDoc.id, displayName);
          results.push({
            id: userDoc.id,
            name: displayName || 'Пользователь без имени',
            email: email
          });
        }
      });
      
      console.log(`Найдено ${results.length} подходящих пользователей`);
      
      if (results.length === 0) {
        toast.info('Пользователей с таким именем не найдено');
      }
      
      // Ограничиваем количество результатов
      setSearchResults(results.slice(0, 10));
    } catch (error) {
      console.error('Ошибка при поиске пользователей:', error);
      toast.error('Ошибка при поиске пользователей');
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const searchCardByNumber = async () => {
    if (!searchInput) {
      toast.warning('Введите номер карты для поиска');
      return;
    }

    setSearchLoading(true);
    try {
      console.log('Ищем карту по номеру:', searchInput);
      
      // Очищаем поисковый запрос от всех не-цифровых символов
      const cleanedSearchInput = searchInput.replace(/\D/g, '');
      console.log('Очищенный запрос:', cleanedSearchInput);
      
      if (cleanedSearchInput.length < 4) {
        toast.warning('Введите минимум 4 цифры для поиска');
        setSearchLoading(false);
        return;
      }
      
      // Получаем все карты из базы данных
      const cardsSnapshot = await getDocs(collection(db, 'cards'));
      console.log(`Найдено ${cardsSnapshot.size} карт в базе`);
      
      const matchingCards = [];
      
      // Ищем карты, номер которых содержит наш поисковый запрос
      cardsSnapshot.forEach((cardDoc) => {
        const cardData = cardDoc.data();
        const cardNumber = cardData.number ? cardData.number.replace(/\D/g, '') : '';
        
        // Проверяем, содержит ли номер карты наш поисковый запрос
        // или заканчивается ли он на введенные цифры
        if (cardNumber && (cardNumber.includes(cleanedSearchInput) || 
            cardNumber.endsWith(cleanedSearchInput))) {
          console.log('Найдена подходящая карта:', cardDoc.id, cardNumber);
          matchingCards.push({
            id: cardDoc.id,
            ownerId: cardData.userId,
            cardNumber: cardNumber,
            ...cardData
          });
        }
      });
      
      console.log(`Найдено ${matchingCards.length} подходящих карт`);
      
      if (matchingCards.length === 0) {
        toast.warning('Карты с таким номером не найдены');
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      
      // Получаем данные о владельцах карт
      const userResults = [];
      for (const card of matchingCards) {
        // Пропускаем собственные карты пользователя
        if (card.ownerId === userId) {
          console.log('Пропускаем собственную карту');
          continue;
        }
        
        const userDoc = await getDoc(doc(db, 'users', card.ownerId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userResults.push({
            id: userDoc.id,
            name: userData.displayName || 'Пользователь без имени',
            cardNumber: card.number || card.cardNumber,
            cardId: card.id
          });
        }
      }
      
      console.log('Результаты поиска пользователей:', userResults);
      
      if (userResults.length === 0) {
        toast.info('Карты найдены, но все они принадлежат вам');
      }
      
      setSearchResults(userResults);
    } catch (error) {
      console.error('Ошибка при поиске карты:', error);
      toast.error('Ошибка при поиске карты');
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const handleRecipientSelect = (recipient) => {
    setSelectedRecipient(recipient);
    setSearchTerm('');
    setCardNumber('');
    setSearchResults([]);
  };

  const handleAmountChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setAmount(value);
    }
  };

  const handleCardChange = (e) => {
    setSelectedCardId(e.target.value);
  };

  const handleCardNumberChange = (e) => {
    // Убираем все нецифровые символы
    const value = e.target.value.replace(/\D/g, '');
    setCardNumber(value);
  };

  const handleTransfer = async () => {
    if (!selectedRecipient) {
      toast.warning('Выберите получателя');
      return;
    }
    
    if (amount <= 0) {
      toast.warning('Сумма должна быть положительной');
      return;
    }
    
    if (!selectedCardId) {
      toast.warning('Выберите карту для перевода');
      return;
    }
    
    try {
      // Проверяем баланс карты отправителя
      const selectedCard = userCards.find(card => card.id === selectedCardId);
      if (!selectedCard) {
        toast.error('Выбранная карта не найдена');
        return;
      }
      
      if (selectedCard.balance < amount) {
        toast.error('Недостаточно средств на карте');
        return;
      }
      
      // Получаем данные отправителя для добавления имени в транзакцию
      const senderDoc = await getDoc(doc(db, 'users', userId));
      const senderName = senderDoc.exists() ? (senderDoc.data().displayName || 'Неизвестный пользователь') : 'Неизвестный пользователь';
      
      // Обновляем баланс карты отправителя
      const senderCardRef = doc(db, 'cards', selectedCardId);
      await updateDoc(senderCardRef, {
        balance: increment(-amount)
      });
      
      console.log('Selected recipient:', selectedRecipient);
      
      // Получаем данные получателя
      const receiverDoc = await getDoc(doc(db, 'users', selectedRecipient.id));
      if (!receiverDoc.exists()) {
        toast.error('Получатель не найден');
        
        // Возвращаем деньги отправителю
        await updateDoc(senderCardRef, {
          balance: increment(amount)
        });
        
        return;
      }
      
      // Обновляем баланс получателя
      const receiverRef = doc(db, 'users', selectedRecipient.id);
      await updateDoc(receiverRef, {
        balance: increment(amount)
      });
      
      let description = `Перевод пользователю ${selectedRecipient.name}`;
      if (selectedRecipient.cardNumber) {
        description += ` на карту ${formatCardNumber(selectedRecipient.cardNumber)}`;
      }
      
      // Создаем транзакцию
      await addDoc(collection(db, 'transactions'), {
        senderId: userId,
        senderName: senderName,
        receiverId: selectedRecipient.id,
        receiverName: selectedRecipient.name,
        amount: amount,
        cardId: selectedCardId,
        type: 'transfer',
        description: description,
        timestamp: serverTimestamp(),
        seen: false // Добавляем флаг просмотра
      });
      
      // Обновляем список недавних получателей
      await loadRecentRecipients();
      
      // Сбрасываем форму
      setSelectedRecipient(null);
      setAmount(100);
      
      // Оповещаем пользователя
      let successMessage = `Успешный перевод ${amount} МР пользователю ${selectedRecipient.name}`;
      if (selectedRecipient.cardNumber) {
        successMessage += ` (на карту ${formatCardNumber(selectedRecipient.cardNumber)})`;
      }
      toast.success(successMessage);
      
      // Обновляем список полученных переводов
      await loadReceivedTransfers();
    } catch (err) {
      console.error('Ошибка при переводе средств:', err);
      toast.error('Ошибка при переводе средств');
    }
  };

  // Функция для форматирования номера карты
  const formatCardNumber = (cardNumber) => {
    // Очищаем от всех не-цифровых символов
    const cleaned = cardNumber.replace(/\D/g, '');
    
    // Форматируем в группы по 4 цифры
    const groups = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.substr(i, 4));
    }
    
    return groups.join('-');
  };

  const toggleTransferMode = () => {
    setTransferByCard(!transferByCard);
    setSearchTerm('');
    setCardNumber('');
    setSearchResults([]);
  };

  // Обработчик кнопки поиска - выбирает нужную функцию в зависимости от типа поиска
  const handleSearchButton = () => {
    if (searchType === 'card') {
      searchCardByNumber();
    } else {
      handleSearch();
    }
  };

  // Функция для форматирования временной метки
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Нет даты';
    
    try {
      // Firebase Timestamp преобразуем в Date
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      // Проверяем, сегодня ли это
      const today = new Date();
      const isToday = date.getDate() === today.getDate() &&
                     date.getMonth() === today.getMonth() &&
                     date.getFullYear() === today.getFullYear();
      
      if (isToday) {
        return `Сегодня ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else {
        return date.toLocaleDateString('ru-RU', { 
          day: 'numeric', 
          month: 'short', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch (error) {
      console.error('Ошибка при форматировании даты:', error);
      return 'Ошибка даты';
    }
  };

  // Функция для отметки перевода как просмотренного
  const markTransferAsSeen = async (transferId) => {
    try {
      const transferRef = doc(db, 'transactions', transferId);
      await updateDoc(transferRef, {
        seen: true
      });
      
      // Обновляем список полученных переводов
      setReceivedTransfers(prevTransfers => 
        prevTransfers.map(transfer => 
          transfer.id === transferId 
            ? { ...transfer, seen: true } 
            : transfer
        )
      );
      
      console.log(`Перевод ${transferId} отмечен как просмотренный`);
    } catch (error) {
      console.error('Ошибка при отметке перевода:', error);
      toast.error('Не удалось отметить перевод как просмотренный');
    }
  };

  return (
    <div className="quick-transfer-widget">
      <div className="widget-title">
        <h3>
          <FaPaperPlane className="header-icon" />
          Быстрые переводы
        </h3>
      </div>
      
      <div className="search-container">
        <div className="search-type-toggle">
          <button 
            className={`search-type-button ${searchType === 'name' ? 'active' : ''}`}
            onClick={() => setSearchType('name')}
          >
            <FaUser /> По имени
          </button>
          <button 
            className={`search-type-button ${searchType === 'card' ? 'active' : ''}`}
            onClick={() => setSearchType('card')}
          >
            <FaCreditCard /> По карте
          </button>
        </div>
        
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder={searchType === 'name' ? "Введите имя пользователя..." : "Введите номер карты..."}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && handleSearchButton()}
          />
          <button 
            className="search-button"
            onClick={handleSearchButton}
            disabled={!searchInput || searchLoading}
          >
            {searchLoading ? 'Поиск...' : (
              <>
                <FaSearch /> Найти
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Результаты поиска */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Результаты поиска:</h3>
          <ul className="recipients-list">
            {searchResults.map((user) => (
              <li key={user.id + (user.cardId || '')} className="recipient-item" onClick={() => setSelectedRecipient(user)}>
                <div className="recipient-info">
                  <span className="recipient-name">{user.name}</span>
                  {user.email && <span className="recipient-email">{user.email}</span>}
                  {user.cardNumber && (
                    <span className="recipient-card">
                      <FaCreditCard /> {formatCardNumber(user.cardNumber)}
                    </span>
                  )}
                </div>
                <FaArrowRight className="select-icon" />
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Выбранный получатель */}
      {selectedRecipient && (
        <div className="selected-recipient">
          <h3>Получатель:</h3>
          <div className="recipient-info selected">
            <span className="recipient-name">{selectedRecipient.name}</span>
            {selectedRecipient.email && <span className="recipient-email">{selectedRecipient.email}</span>}
            {selectedRecipient.cardNumber && (
              <span className="recipient-card">
                <FaCreditCard /> {formatCardNumber(selectedRecipient.cardNumber)}
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Форма перевода */}
      {selectedRecipient && (
        <div className="transfer-form">
          <div className="form-row">
            <label>Выберите карту:</label>
            <select 
              className="card-select"
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
            >
              <option value="">Выберите карту</option>
              {userCards?.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name || "Карта"} ({formatCardNumber(card.number)}) - {card.balance} МР
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <label>Сумма (МР):</label>
            <div className="amount-input-container">
              <FaMoneyBillWave className="amount-icon" />
              <input
                type="number"
                className="amount-input"
                value={amount}
                onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
                min="1"
              />
            </div>
          </div>
          
          <button 
            className="transfer-button"
            onClick={handleTransfer}
            disabled={!selectedRecipient || !selectedCardId || amount <= 0 || isLoading}
          >
            {isLoading ? 'Отправка...' : (
              <>
                <FaPaperPlane /> Отправить перевод
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Недавние получатели */}
      {recentRecipients.length > 0 && !selectedRecipient && (
        <div className="recent-recipients">
          <h3>Недавние получатели</h3>
          <ul className="recipients-list">
            {recentRecipients.map((recipient) => (
              <li key={recipient.id} className="recipient-item" onClick={() => setSelectedRecipient(recipient)}>
                <div className="recipient-info">
                  <span className="recipient-name">{recipient.name}</span>
                  {recipient.cardNumber && (
                    <span className="recipient-card">
                      <FaCreditCard /> {formatCardNumber(recipient.cardNumber)}
                    </span>
                  )}
                </div>
                <FaArrowRight className="select-icon" />
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Полученные переводы */}
      {receivedTransfers.length > 0 && (
        <div className="received-transfers">
          <h3>Новые переводы</h3>
          <ul className="transfers-list">
            {receivedTransfers.map((transfer) => (
              <li key={transfer.id} className="transfer-item" onClick={() => markTransferAsSeen(transfer.id)}>
                <div className="transfer-info">
                  <span className="transfer-amount">+{transfer.amount} МР</span>
                  <span className="transfer-from">от {transfer.senderName}</span>
                  <span className="transfer-time">{formatTimestamp(transfer.timestamp)}</span>
                </div>
                {!transfer.seen && <div className="new-indicator">Новый</div>}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <style jsx>{`
        .quick-transfer-widget {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .widget-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #333;
          margin: 0 0 1.5rem 0;
          display: flex;
          align-items: center;
        }
        
        .widget-title::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 18px;
          background: linear-gradient(180deg, #4caf50, #2e7d32);
          margin-right: 10px;
          border-radius: 2px;
        }
        
        .search-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        
        .search-type-toggle {
          display: flex;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e0e0e0;
          width: 100%;
        }
        
        .search-type-button {
          flex: 1;
          background: #f5f5f5;
          border: none;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          color: #757575;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .search-type-button.active {
          background: #4caf50;
          color: white;
        }
        
        .search-input-container {
          display: flex;
          width: 100%;
        }
        
        .search-input {
          flex: 1;
          border: 1px solid #e0e0e0;
          border-right: none;
          border-radius: 8px 0 0 8px;
          padding: 0.75rem 1rem;
          outline: none;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        
        .search-input:focus {
          border-color: #4caf50;
        }
        
        .search-button {
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 0 8px 8px 0;
          padding: 0 1.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .search-button:hover {
          background: #388e3c;
        }
        
        .search-button:disabled {
          background: #bdbdbd;
          cursor: not-allowed;
        }
        
        .recipients-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .recipient-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }
        
        .recipient-item:last-child {
          border-bottom: none;
        }
        
        .recipient-item:hover {
          background-color: #f5f5f5;
        }
        
        .recipient-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .recipient-name {
          font-weight: 500;
          color: #333;
        }
        
        .recipient-email {
          font-size: 0.85rem;
          color: #757575;
        }
        
        .recipient-card {
          font-size: 0.85rem;
          color: #757575;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .select-icon {
          color: #4caf50;
          font-size: 1rem;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        
        .recipient-item:hover .select-icon {
          opacity: 1;
        }
        
        .search-results, .selected-recipient, .transfer-form, .recent-recipients, .received-transfers {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 1.25rem;
          margin-top: 1.5rem;
        }
        
        .selected-recipient {
          background-color: #e8f5e9;
        }
        
        h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #424242;
          font-weight: 500;
        }
        
        .form-row {
          margin-bottom: 1.25rem;
        }
        
        .form-row label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #424242;
        }
        
        .card-select {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: white;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23757575' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }
        
        .card-select:focus {
          border-color: #4caf50;
        }
        
        .amount-input-container {
          display: flex;
          align-items: center;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: white;
          padding: 0 1rem;
          transition: border-color 0.2s;
        }
        
        .amount-input-container:focus-within {
          border-color: #4caf50;
        }
        
        .amount-icon {
          color: #757575;
          margin-right: 0.5rem;
        }
        
        .amount-input {
          flex: 1;
          border: none;
          padding: 0.75rem 0;
          outline: none;
          font-size: 1rem;
          width: 100%;
        }
        
        .transfer-button {
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          margin-top: 0.5rem;
        }
        
        .transfer-button:hover {
          background: #388e3c;
        }
        
        .transfer-button:disabled {
          background: #bdbdbd;
          cursor: not-allowed;
        }
        
        .transfers-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .transfer-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
          border-radius: 4px;
        }
        
        .transfer-item:hover {
          background-color: #f0f0f0;
        }
        
        .transfer-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .transfer-amount {
          font-weight: 600;
          color: #4caf50;
        }
        
        .transfer-from, .transfer-time {
          font-size: 0.85rem;
          color: #757575;
        }
        
        .new-indicator {
          background-color: #4caf50;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .search-container {
            flex-direction: column;
          }
          
          .search-input-container {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .search-input {
            border-radius: 8px;
            border-right: 1px solid #e0e0e0;
          }
          
          .search-button {
            border-radius: 8px;
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default QuickTransfer; 