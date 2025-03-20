import React, { useState, useEffect, useRef } from 'react';
import { FaArrowDown, FaCoins, FaRedo, FaInfoCircle, FaCreditCard, FaCrown } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { doc, updateDoc, getDoc, increment, collection, addDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { firestore, auth, getUserCards, checkIsAdmin, db } from '../firebase';
import Modal from './Modal';

const PullTheTabs = ({ userId, userBalance, onBalanceUpdate }) => {
  const [tabs, setTabs] = useState([]);
  const [pulledTabs, setPulledTabs] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [totalWin, setTotalWin] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [dailyPlays, setDailyPlays] = useState(0);
  const [maxDailyPlays] = useState(3); // Максимальное количество игр в день
  const [userCards, setUserCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [loadingCards, setLoadingCards] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const cooldownInterval = useRef(null);

  // Стоимость одной игры
  const GAME_COST = 100; // 100 МР

  // Возможные выигрыши
  const POSSIBLE_WINS = [0, 50, 100, 200, 500, 1000];

  useEffect(() => {
    // Проверяем статус администратора
    const checkAdminStatus = async () => {
      if (!userId) return;
      
      setCheckingAdmin(true);
      try {
        const result = await checkIsAdmin(userId);
        if (result.success) {
          setIsAdmin(result.isAdmin);
          
          // Если пользователь администратор, снимаем ограничения
          if (result.isAdmin) {
            setCooldown(false);
            setCooldownTime(0);
            if (cooldownInterval.current) {
              clearInterval(cooldownInterval.current);
            }
          }
        }
      } catch (error) {
        console.error("Ошибка при проверке статуса администратора:", error);
      } finally {
        setCheckingAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [userId]);

  useEffect(() => {
    // Проверяем, сколько раз пользователь уже играл сегодня
    const checkDailyPlays = async () => {
      // Если пользователь администратор, пропускаем проверку
      if (isAdmin) {
        setDailyPlays(0);
        setCooldown(false);
        setCooldownTime(0);
        return;
      }
      
      try {
        const userRef = doc(firestore, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Проверяем, есть ли запись о сегодняшних играх
          const today = new Date().toISOString().split('T')[0];
          
          if (userData.games && userData.games.pullTheTabs && userData.games.pullTheTabs.lastPlayed === today) {
            setDailyPlays(userData.games.pullTheTabs.dailyPlays || 0);
            
            // Проверяем время последней игры для кулдауна
            if (userData.games.pullTheTabs.lastPlayTimestamp) {
              const lastPlayTime = userData.games.pullTheTabs.lastPlayTimestamp.toDate();
              const currentTime = new Date();
              const diffInMinutes = Math.floor((currentTime - lastPlayTime) / (1000 * 60));
              
              if (diffInMinutes < 30) {
                setCooldown(true);
                setCooldownTime(30 - diffInMinutes);
                startCooldownTimer(30 - diffInMinutes);
              }
            }
          } else {
            // Если сегодня еще не играл, сбрасываем счетчик
            setDailyPlays(0);
          }
        }
      } catch (error) {
        console.error("Ошибка при проверке ежедневных игр:", error);
      }
    };
    
    if (userId) {
      checkDailyPlays();
      loadUserCards();
    }
    
    return () => {
      if (cooldownInterval.current) {
        clearInterval(cooldownInterval.current);
      }
    };
  }, [userId, isAdmin]);

  // Загрузка карт пользователя
  const loadUserCards = async () => {
    if (!userId) return;
    
    setLoadingCards(true);
    try {
      const result = await getUserCards(userId);
      if (result.success) {
        setUserCards(result.cards);
        // Если есть карты, выбираем первую по умолчанию
        if (result.cards.length > 0) {
          setSelectedCardId(result.cards[0].id);
        }
      } else {
        toast.error('Не удалось загрузить карты');
      }
    } catch (error) {
      console.error('Ошибка при загрузке карт:', error);
      toast.error('Ошибка при загрузке карт');
    } finally {
      setLoadingCards(false);
    }
  };

  const startCooldownTimer = (minutes) => {
    setCooldownTime(minutes);
    
    if (cooldownInterval.current) {
      clearInterval(cooldownInterval.current);
    }
    
    cooldownInterval.current = setInterval(() => {
      setCooldownTime(prev => {
        if (prev <= 1) {
          clearInterval(cooldownInterval.current);
          setCooldown(false);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Обновляем каждую минуту
  };

  const startGame = async () => {
    // Если пользователь не администратор, проверяем ограничения
    if (!isAdmin) {
      // Проверяем, не превышен ли лимит игр в день
      if (dailyPlays >= maxDailyPlays) {
        toast.warning(`Вы достигли лимита игр на сегодня (${maxDailyPlays}). Возвращайтесь завтра!`);
        return;
      }
      
      // Проверяем, не на кулдауне ли игра
      if (cooldown) {
        toast.warning(`Подождите ${cooldownTime} минут перед следующей игрой`);
        return;
      }
    }
    
    // Проверяем, выбрана ли карта
    if (!selectedCardId) {
      toast.error('Выберите карту для оплаты игры');
      return;
    }
    
    // Находим выбранную карту
    const selectedCard = userCards.find(card => card.id === selectedCardId);
    if (!selectedCard) {
      toast.error('Выбранная карта не найдена');
      return;
    }
    
    // Проверяем, достаточно ли средств на карте
    if (selectedCard.balance < GAME_COST) {
      toast.error(`Недостаточно средств на карте. Необходимо ${GAME_COST} МР`);
      return;
    }
    
    try {
      // Списываем стоимость игры с карты
      const cardRef = doc(firestore, "cards", selectedCardId);
      await updateDoc(cardRef, {
        balance: increment(-GAME_COST)
      });
      
      // Обновляем счетчик игр (только для обычных пользователей)
      if (!isAdmin) {
        const userRef = doc(firestore, "users", userId);
        await updateDoc(userRef, {
          [`games.pullTheTabs.dailyPlays`]: increment(1),
          [`games.pullTheTabs.lastPlayed`]: new Date().toISOString().split('T')[0],
          [`games.pullTheTabs.lastPlayTimestamp`]: serverTimestamp()
        });
        
        // Обновляем локальный счетчик игр
        setDailyPlays(prev => prev + 1);
        
        // Устанавливаем кулдаун
        setCooldown(true);
        startCooldownTimer(30);
      }
      
      // Создаем транзакцию
      await addDoc(collection(firestore, "transactions"), {
        userId: userId,
        cardId: selectedCardId,
        type: "game_fee",
        amount: -GAME_COST,
        description: "Оплата игры Pull the Tabs",
        timestamp: serverTimestamp()
      });
      
      // Обновляем баланс карты в локальном состоянии
      setUserCards(prevCards => 
        prevCards.map(card => 
          card.id === selectedCardId 
            ? { ...card, balance: card.balance - GAME_COST } 
            : card
        )
      );
      
      // Уведомляем родительский компонент об изменении баланса
      if (onBalanceUpdate) {
        onBalanceUpdate(userBalance - GAME_COST);
      }
      
      // Генерируем табы для игры
      generateTabs();
      setGameStarted(true);
      setGameEnded(false);
      setTotalWin(0);
      setPulledTabs([]);
      
      toast.success(`Игра началась! С вашей карты списано ${GAME_COST} МР`);
    } catch (error) {
      console.error("Ошибка при начале игры:", error);
      toast.error("Произошла ошибка при начале игры");
    }
  };

  const generateTabs = () => {
    // Генерируем 5 табов с разными выигрышами
    const newTabs = [];
    
    for (let i = 0; i < 5; i++) {
      // Выбираем случайный выигрыш из возможных
      const winIndex = Math.floor(Math.random() * POSSIBLE_WINS.length);
      const winAmount = POSSIBLE_WINS[winIndex];
      
      newTabs.push({
        id: i,
        win: winAmount,
        pulled: false
      });
    }
    
    setTabs(newTabs);
  };

  const pullTab = async (tabId) => {
    if (isAnimating || pulledTabs.includes(tabId)) return;
    
    setIsAnimating(true);
    
    // Находим таб
    const tab = tabs.find(t => t.id === tabId);
    
    // Логируем для отладки
    console.log(`Вытянут таб ${tabId} с выигрышем ${tab.win} МР`);
    
    // Добавляем таб в список вытянутых
    setPulledTabs(prev => [...prev, tabId]);
    
    // Обновляем общий выигрыш
    const newTotalWin = totalWin + tab.win;
    setTotalWin(newTotalWin);
    
    // Показываем уведомление о выигрыше для текущего таба
    if (tab.win > 0) {
      toast.info(`+${tab.win} МР`, 1500);
    }
    
    // Если вытянули все табы, игра заканчивается
    if (pulledTabs.length === 4) { // После этого пула будет 5 вытянутых табов
      setGameEnded(true);
      
      // Логируем итоговый выигрыш для отладки
      console.log(`Игра завершена. Общий выигрыш: ${newTotalWin} МР`);
      
      // Если есть выигрыш, начисляем его на счет выбранной карты
      if (newTotalWin > 0) {
        try {
          const cardRef = doc(firestore, "cards", selectedCardId);
          await updateDoc(cardRef, {
            balance: increment(newTotalWin)
          });
          
          // Создаем транзакцию
          await addDoc(collection(firestore, "transactions"), {
            userId: userId,
            cardId: selectedCardId,
            type: "game_win",
            amount: newTotalWin,
            description: `Выигрыш в игре Pull the Tabs: ${newTotalWin} МР`,
            timestamp: serverTimestamp()
          });
          
          // Обновляем баланс карты в локальном состоянии
          setUserCards(prevCards => 
            prevCards.map(card => 
              card.id === selectedCardId 
                ? { ...card, balance: card.balance + newTotalWin } 
                : card
            )
          );
          
          // Уведомляем родительский компонент об изменении баланса
          if (onBalanceUpdate) {
            onBalanceUpdate(userBalance - GAME_COST + newTotalWin);
          }
          
          toast.success(`Поздравляем! Вы выиграли ${newTotalWin} МР`);
        } catch (error) {
          console.error("Ошибка при начислении выигрыша:", error);
          toast.error("Произошла ошибка при начислении выигрыша");
        }
      } else {
        toast.info("К сожалению, вы ничего не выиграли");
      }
    }
    
    // Задержка для анимации
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameEnded(false);
    setTabs([]);
    setPulledTabs([]);
    setTotalWin(0);
  };

  // Форматирование номера карты для отображения
  const formatCardNumber = (number) => {
    if (!number) return '';
    return `**** ${number.slice(-4)}`;
  };
  
  // Получение выбранной карты
  const selectedCard = userCards.find(card => card.id === selectedCardId);

  // Функция для подсчета общего выигрыша
  const calculateTotalWin = () => {
    let sum = 0;
    // Суммируем выигрыши со всех вытянутых полосок
    tabs.forEach(tab => {
      if (pulledTabs.includes(tab.id)) {
        sum += tab.value;
      }
    });
    return sum;
  };

  // Функция для обработки конца игры
  const handleEndGame = async () => {
    setGameEnded(true);
    const newTotalWin = calculateTotalWin();
    setTotalWin(newTotalWin);
    
    // Обновляем баланс пользователя
    const userRef = doc(db, 'users', userId);
    
    try {
      // Обновляем баланс
      await updateDoc(userRef, {
        balance: increment(newTotalWin)
      });
      
      // Обновляем счетчик игр для сегодняшнего дня
      const currentPlays = dailyPlays + 1;
      
      // Получаем данные статистики игрока
      await updateGameStats(newTotalWin);
      
      // Записываем историю игры
      await addDoc(collection(db, 'gameHistory'), {
        userId,
        gameType: 'pullTabs',
        cost: GAME_COST,
        win: newTotalWin,
        tabs: tabs.map(tab => ({
          value: tab.value,
          pulled: pulledTabs.includes(tab.id)
        })),
        timestamp: serverTimestamp()
      });
      
      // Обновляем данные игрока
      await updateDoc(userRef, {
        'games.pullTabs.lastPlayed': serverTimestamp(),
        'games.pullTabs.dailyPlays': currentPlays,
        'games.pullTabs.totalPlays': increment(1),
        'games.pullTabs.totalWinnings': increment(newTotalWin)
      });
      
      // Если это не последняя игра за день
      if (currentPlays < maxDailyPlays) {
        setDailyPlays(currentPlays);
        toast.info(`Вы можете сыграть ещё ${maxDailyPlays - currentPlays} раз(а) сегодня`);
      } else {
        // Устанавливаем кулдаун
        setCooldown(true);
        const cooldownEndTime = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
        localStorage.setItem('pullTabs_cooldownEnd', cooldownEndTime.toString());
        setCooldownTime(24 * 60 * 60);
        
        startCooldownTimer();
        toast.info('Вы достигли лимита игр на сегодня. Возвращайтесь завтра!');
      }
      
      // Обновляем баланс в родительском компоненте
      if (onBalanceUpdate) {
        onBalanceUpdate(userBalance + newTotalWin);
      }
      
      // Показываем сообщение о выигрыше, если он есть
      if (newTotalWin > 0) {
        toast.success(`Поздравляем! Вы выиграли ${newTotalWin} МР!`);
      }
    } catch (error) {
      console.error('Ошибка при завершении игры:', error);
      toast.error('Произошла ошибка при завершении игры');
    }
  };

  // Функция для обновления статистики игрока для таблицы лидеров
  const updateGameStats = async (winAmount) => {
    try {
      // Получаем текущую статистику игрока
      const statsRef = doc(db, 'gameStats', userId);
      const statsDoc = await getDoc(statsRef);
      
      // Получаем данные пользователя для имени
      const userDoc = await getDoc(doc(db, 'users', userId));
      const username = userDoc.exists() ? 
        (userDoc.data().username || userDoc.data().displayName || 'Неизвестный игрок') : 
        'Неизвестный игрок';
      
      const timestamp = Timestamp.now();
      
      if (statsDoc.exists()) {
        // Обновляем существующую статистику
        const statsData = statsDoc.data();
        const totalWinnings = (statsData.totalWinnings || 0) + winAmount;
        const totalPlays = (statsData.totalPlays || 0) + 1;
        const winCount = statsData.winCount || 0;
        const newWinCount = winAmount > 0 ? winCount + 1 : winCount;
        const winRate = (newWinCount / totalPlays) * 100;
        const biggestWin = Math.max(statsData.biggestWin || 0, winAmount);
        
        await updateDoc(statsRef, {
          gameType: 'pullTabs',
          userId,
          username,
          totalWinnings,
          totalPlays,
          winCount: newWinCount,
          winRate,
          biggestWin,
          lastWin: winAmount,
          timestamp
        });
      } else {
        // Создаем новую запись статистики
        const winCount = winAmount > 0 ? 1 : 0;
        const winRate = winCount * 100; // 100% или 0%
        
        await setDoc(statsRef, {
          gameType: 'pullTabs',
          userId,
          username,
          totalWinnings: winAmount,
          totalPlays: 1,
          winCount,
          winRate,
          biggestWin: winAmount,
          lastWin: winAmount,
          timestamp
        });
      }
    } catch (error) {
      console.error('Ошибка при обновлении статистики игры:', error);
    }
  };

  return (
    <div className="pull-tabs-game">
      <div className="game-header">
        <h2>Pull the Tabs</h2>
        <div className="header-actions">
          {isAdmin && (
            <div className="admin-badge" title="Режим администратора">
              <FaCrown /> Админ
            </div>
          )}
          <button className="info-button" onClick={() => setShowRules(true)}>
            <FaInfoCircle /> Правила
          </button>
        </div>
      </div>
      
      {!gameStarted ? (
        <div className="game-start">
          <div className="game-info">
            <p>Тяните бумажные полоски с купюр и выигрывайте деньги!</p>
            <p>Стоимость игры: <strong>{GAME_COST} МР</strong></p>
            <p>Возможный выигрыш: до <strong>1000 МР</strong></p>
            
            {isAdmin ? (
              <div className="admin-info">
                <p><FaCrown /> Режим администратора: <strong>без ограничений</strong></p>
              </div>
            ) : (
              <p>Осталось игр сегодня: <strong>{maxDailyPlays - dailyPlays} из {maxDailyPlays}</strong></p>
            )}
            
            {cooldown && !isAdmin && (
              <div className="cooldown-info">
                <p>Следующая игра будет доступна через: <strong>{cooldownTime} мин.</strong></p>
              </div>
            )}
            
            {/* Выбор карты для оплаты */}
            <div className="card-selection">
              <label htmlFor="card-select">Выберите карту для оплаты:</label>
              <div className="card-select-wrapper">
                <FaCreditCard className="card-icon" />
                <select 
                  id="card-select" 
                  value={selectedCardId} 
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  disabled={loadingCards || userCards.length === 0}
                >
                  {loadingCards ? (
                    <option value="">Загрузка карт...</option>
                  ) : userCards.length === 0 ? (
                    <option value="">У вас нет карт</option>
                  ) : (
                    userCards.map(card => (
                      <option key={card.id} value={card.id}>
                        {formatCardNumber(card.cardNumber)} - {card.balance} МР
                      </option>
                    ))
                  )}
                </select>
                <button 
                  className="refresh-cards-button" 
                  onClick={(e) => {
                    e.preventDefault();
                    loadUserCards();
                  }}
                  disabled={loadingCards}
                  title="Обновить список карт"
                >
                  <FaRedo className={loadingCards ? 'loading' : ''} />
                </button>
              </div>
              
              {/* Информация о выбранной карте */}
              {selectedCard && (
                <div className="selected-card-info">
                  <div className="card-preview" style={{ background: selectedCard.color || 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)' }}>
                    <div className="card-number">{formatCardNumber(selectedCard.cardNumber)}</div>
                    <div className="card-balance">{selectedCard.balance} МР</div>
                  </div>
                  <div className="card-details">
                    <p>Владелец: <strong>{selectedCard.firstName} {selectedCard.lastName}</strong></p>
                    <p className={selectedCard.balance < GAME_COST ? 'insufficient-funds' : ''}>
                      Баланс: <strong>{selectedCard.balance} МР</strong>
                      {selectedCard.balance < GAME_COST && (
                        <span className="insufficient-funds-warning">
                          Недостаточно средств для игры
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button 
            className="start-button" 
            onClick={startGame}
            disabled={
              (!isAdmin && dailyPlays >= maxDailyPlays) || 
              (!isAdmin && cooldown) || 
              !selectedCardId || 
              userCards.length === 0 ||
              (selectedCardId && userCards.find(c => c.id === selectedCardId)?.balance < GAME_COST) ||
              checkingAdmin
            }
          >
            Начать игру ({GAME_COST} МР)
          </button>
        </div>
      ) : (
        <div className="game-area">
          <div className="tabs-container">
            {tabs.map(tab => (
              <div 
                key={tab.id} 
                className={`tab ${pulledTabs.includes(tab.id) ? 'pulled' : ''}`}
                onClick={() => !gameEnded && pullTab(tab.id)}
              >
                <div className="bill">
                  <div className="bill-content">
                    <div className="bill-value">{pulledTabs.includes(tab.id) ? `${tab.win} МР` : '???'}</div>
                  </div>
                </div>
                
                {!pulledTabs.includes(tab.id) && (
                  <div className="tab-pull">
                    <div className="tab-arrow">
                      <FaArrowDown />
                    </div>
                    <div className="tab-text">Потяните</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="game-status">
            {gameEnded ? (
              <div className="game-result">
                <h3>Игра завершена!</h3>
                <p>Ваш выигрыш: <strong>{totalWin} МР</strong></p>
                <button className="reset-button" onClick={resetGame}>
                  <FaRedo /> Вернуться
                </button>
              </div>
            ) : (
              <div className="game-progress">
                <p>Вытянуто полосок: {pulledTabs.length} из 5</p>
                <p>Текущий выигрыш: <strong className="total-win">{totalWin} МР</strong></p>
                <div className="win-history">
                  {pulledTabs.map(tabId => {
                    const tab = tabs.find(t => t.id === tabId);
                    return (
                      <div key={tabId} className={`win-item ${tab.win > 0 ? 'win' : 'no-win'}`}>
                        {tab.win > 0 ? `+${tab.win} МР` : '0 МР'}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Модальное окно с правилами */}
      <Modal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
        title="Правила игры Pull the Tabs"
        size="medium"
      >
        <div className="rules-content">
          <h3>Как играть:</h3>
          <ol>
            <li>Стоимость одной игры составляет <strong>{GAME_COST} МР</strong>.</li>
            <li>После начала игры вам будут представлены 5 купюр с полосками.</li>
            <li>Нажимайте на полоски, чтобы вытянуть их и узнать выигрыш.</li>
            <li>Под каждой полоской скрывается сумма от 0 до 1000 МР.</li>
            <li>После вытягивания всех полосок игра завершается, и выигрыш зачисляется на ваш счет.</li>
          </ol>
          
          <h3>Ограничения{isAdmin && " (отключены для администраторов)"}:</h3>
          <ul>
            <li>Вы можете играть не более <strong>{maxDailyPlays} раз в день</strong>.</li>
            <li>После каждой игры действует период ожидания <strong>30 минут</strong>.</li>
            <li>Для игры необходимо иметь на счету минимум <strong>{GAME_COST} МР</strong>.</li>
          </ul>
          
          <h3>Возможные выигрыши:</h3>
          <div className="possible-wins">
            {POSSIBLE_WINS.map((win, index) => (
              <div key={index} className="win-item">
                <FaCoins className="coin-icon" />
                <span>{win} МР</span>
              </div>
            ))}
          </div>
          
          <div className="rules-footer">
            <button className="close-button" onClick={() => setShowRules(false)}>
              Понятно
            </button>
          </div>
        </div>
      </Modal>
      
      <style jsx>{`
        .pull-tabs-game {
          background-color: var(--card-bg, white);
          border-radius: 12px;
          box-shadow: var(--card-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          padding-bottom: 16px;
        }
        
        .game-header h2 {
          margin: 0;
          color: var(--text-color, #333);
          font-size: 1.8rem;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .admin-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #ffc107;
          color: #333;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .admin-info {
          margin-top: 16px;
          padding: 12px;
          background-color: rgba(255, 193, 7, 0.1);
          border-radius: 8px;
          color: #333;
          border-left: 3px solid #ffc107;
        }
        
        .admin-info p {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
        }
        
        .info-button {
          background: none;
          border: none;
          color: var(--primary-color, #4361ee);
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 1rem;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .info-button:hover {
          background-color: rgba(67, 97, 238, 0.1);
        }
        
        .game-start {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        
        .game-info {
          text-align: center;
          color: var(--text-color, #333);
        }
        
        .game-info p {
          margin: 8px 0;
        }
        
        .cooldown-info {
          margin-top: 16px;
          padding: 12px;
          background-color: rgba(255, 152, 0, 0.1);
          border-radius: 8px;
          color: #ff9800;
        }
        
        .start-button {
          background-color: var(--primary-color, #4361ee);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 500;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .start-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
        }
        
        .start-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        .game-area {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .tabs-container {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .tab {
          position: relative;
          width: 120px;
          height: 200px;
          cursor: pointer;
          perspective: 1000px;
          transition: transform 0.3s;
        }
        
        .tab:hover:not(.pulled) {
          transform: translateY(-5px);
        }
        
        .bill {
          width: 100%;
          height: 100%;
          background-color: #e9f0fd;
          border: 1px solid #c4d3f6;
          border-radius: 8px;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .bill-content {
          width: 90%;
          height: 90%;
          border: 1px dashed #a0b4e0;
          border-radius: 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f5f8ff;
        }
        
        .bill-value {
          font-size: 1.2rem;
          font-weight: bold;
          color: #1a237e;
        }
        
        .tab-pull {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 80px;
          background-color: #ffeb3b;
          border-radius: 0 0 30px 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s;
          z-index: 2;
        }
        
        .tab:hover .tab-pull {
          transform: translateX(-50%) translateY(5px);
        }
        
        .tab-arrow {
          color: #d32f2f;
          font-size: 1.5rem;
          margin-bottom: 4px;
          animation: bounce 1s infinite;
        }
        
        .tab-text {
          font-size: 0.8rem;
          font-weight: bold;
          color: #d32f2f;
        }
        
        .tab.pulled .bill {
          transform: translateY(0);
        }
        
        .game-status {
          text-align: center;
          margin-top: 16px;
          padding: 16px;
          background-color: rgba(67, 97, 238, 0.05);
          border-radius: 8px;
        }
        
        .game-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .game-result h3 {
          margin: 0;
          color: var(--text-color, #333);
        }
        
        .reset-button {
          background-color: var(--primary-color, #4361ee);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
        }
        
        .reset-button:hover {
          background-color: var(--button-hover, #3a56d4);
        }
        
        .rules-content {
          color: var(--text-color, #333);
        }
        
        .rules-content h3 {
          margin-top: 24px;
          margin-bottom: 12px;
          color: var(--primary-color, #4361ee);
        }
        
        .rules-content ol, .rules-content ul {
          padding-left: 24px;
          margin-bottom: 20px;
        }
        
        .rules-content li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
        
        .possible-wins {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 16px;
        }
        
        .win-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: rgba(67, 97, 238, 0.1);
          border-radius: 20px;
          color: var(--primary-color, #4361ee);
        }
        
        .coin-icon {
          color: #ffc107;
        }
        
        .rules-footer {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
        }
        
        .close-button {
          background-color: var(--primary-color, #4361ee);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .close-button:hover {
          background-color: var(--button-hover, #3a56d4);
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        
        @media (max-width: 768px) {
          .tabs-container {
            gap: 12px;
          }
          
          .tab {
            width: 100px;
            height: 170px;
          }
          
          .bill-value {
            font-size: 1rem;
          }
          
          .tab-pull {
            width: 50px;
            height: 70px;
          }
        }
        
        @media (max-width: 480px) {
          .tabs-container {
            gap: 8px;
          }
          
          .tab {
            width: 80px;
            height: 140px;
          }
          
          .bill-value {
            font-size: 0.9rem;
          }
          
          .tab-pull {
            width: 40px;
            height: 60px;
          }
          
          .tab-arrow {
            font-size: 1.2rem;
          }
          
          .tab-text {
            font-size: 0.7rem;
          }
        }
        
        /* Стили для выбора карты */
        .card-selection {
          margin-top: 20px;
          padding: 16px;
          background-color: rgba(67, 97, 238, 0.05);
          border-radius: 8px;
          text-align: left;
        }
        
        .card-selection label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text-color, #333);
        }
        
        .card-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .card-icon {
          position: absolute;
          left: 12px;
          color: var(--primary-color, #4361ee);
          font-size: 1.2rem;
        }
        
        #card-select {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 8px;
          background-color: var(--card-bg, white);
          color: var(--text-color, #333);
          font-size: 1rem;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        
        #card-select:focus {
          outline: none;
          border-color: var(--primary-color, #4361ee);
          box-shadow: 0 0 0 2px rgba(67, 97, 238, 0.2);
        }
        
        #card-select:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          background-color: #f5f5f5;
        }
        
        #card-select option {
          padding: 8px;
        }
        
        /* Стрелка для селекта */
        .card-select-wrapper::after {
          content: '';
          position: absolute;
          right: 40px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid var(--text-color, #333);
          pointer-events: none;
        }
        
        /* Стили для кнопки обновления списка карт */
        .refresh-cards-button {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: var(--primary-color, #4361ee);
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: background-color 0.2s;
        }
        
        .refresh-cards-button:hover:not(:disabled) {
          background-color: rgba(67, 97, 238, 0.1);
        }
        
        .refresh-cards-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .refresh-cards-button .loading {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Стили для информации о выбранной карте */
        .selected-card-info {
          display: flex;
          gap: 16px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed var(--border-color, #e0e0e0);
        }
        
        .card-preview {
          width: 120px;
          height: 80px;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          font-size: 0.8rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }
        
        .card-number {
          font-family: monospace;
          letter-spacing: 1px;
        }
        
        .card-balance {
          font-weight: bold;
          font-size: 1rem;
        }
        
        .card-details {
          flex: 1;
        }
        
        .card-details p {
          margin: 0 0 8px;
          font-size: 0.9rem;
        }
        
        .insufficient-funds {
          color: #f44336;
        }
        
        .insufficient-funds-warning {
          display: block;
          font-size: 0.8rem;
          margin-top: 4px;
          color: #f44336;
        }
        
        @media (max-width: 768px) {
          .card-selection {
            padding: 12px;
          }
          
          #card-select {
            padding: 10px 10px 10px 36px;
            font-size: 0.9rem;
          }
          
          .card-icon {
            font-size: 1rem;
            left: 10px;
          }
          
          .selected-card-info {
            flex-direction: column;
            gap: 12px;
          }
          
          .card-preview {
            width: 100%;
            height: 70px;
          }
        }
        
        .game-progress {
          text-align: center;
          margin-top: 16px;
        }
        
        .total-win {
          color: var(--primary-color, #4361ee);
          font-size: 1.2rem;
        }
        
        .win-history {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        
        .win-item {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          animation: popIn 0.3s ease-out;
        }
        
        .win-item.win {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4caf50;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }
        
        .win-item.no-win {
          background-color: rgba(158, 158, 158, 0.1);
          color: #9e9e9e;
          border: 1px solid rgba(158, 158, 158, 0.3);
        }
        
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PullTheTabs; 