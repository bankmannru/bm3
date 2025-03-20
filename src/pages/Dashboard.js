import React, { useState, useEffect, useRef } from 'react';
import { auth, getUserCards, getUnreadMessagesCount, checkAlphaStatus, checkIsAdmin, getUserData, checkPremiumStatus, logoutUser } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Footer from '../components/Footer';
import VirtualCard from '../components/VirtualCard';
import CreateCard from '../components/CreateCard';
import MarketTransactions from '../components/MarketTransactions';
import UserChats from '../components/UserChats';
import AlphaInfo from '../components/AlphaInfo';
import AdminPanel from '../components/AdminPanel';
import AdminCreator from '../components/AdminCreator';
import PremiumStatus from '../components/PremiumStatus';
import PremiumFeatures from '../components/PremiumFeatures';
import DailyRewards from '../components/DailyRewards';
import GameStatsWidget from '../components/GameStatsWidget';
import QuickTransfer from '../components/QuickTransfer';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaExclamationTriangle, FaInfoCircle, FaUserShield, FaUserSecret, FaPlus, FaStar, FaCrown, FaCoins, FaCreditCard, FaShoppingBag, FaTimes, FaComments, FaLock, FaPuzzlePiece } from 'react-icons/fa';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAlphaInfo, setShowAlphaInfo] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminCreator, setShowAdminCreator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alphaStatus, setAlphaStatus] = useState({
    isAlpha: true,
    loading: true
  });
  const [secretKeyPresses, setSecretKeyPresses] = useState(0);
  const [keySequence, setKeySequence] = useState([]);
  const [premiumStatus, setPremiumStatus] = useState({
    isPremium: false,
    loading: true,
    error: null
  });
  const [showPremiumFeatures, setShowPremiumFeatures] = useState(false);

  // Флаг для отслеживания, было ли показано приветственное сообщение
  const [welcomeShown, setWelcomeShown] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем alpha-статус при загрузке компонента
    const checkStatus = async () => {
      try {
        const result = await checkAlphaStatus();
        setAlphaStatus({
          isAlpha: result.isAlpha,
          loading: false
        });
      } catch (err) {
        console.error('Ошибка при проверке alpha-статуса:', err);
        setAlphaStatus({
          isAlpha: true, // По умолчанию считаем, что alpha включена
          loading: false
        });
        toast.error('Ошибка при проверке alpha-статуса');
      }
    };
    
    checkStatus();
  }, []); // Удаляем зависимость toast

  useEffect(() => {
    // Проверяем авторизацию
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Загружаем данные пользователя
        const userDataResult = await getUserData(currentUser.uid);
        if (userDataResult.success) {
          setUserData(userDataResult.userData);
          // Показываем приветственное сообщение только один раз
          if (!welcomeShown) {
            toast.success(`Добро пожаловать, ${userDataResult.userData.displayName || currentUser.email}!`);
            setWelcomeShown(true);
          }
        } else {
          setError(userDataResult.error || 'Не удалось загрузить данные пользователя');
          if (!welcomeShown) {
            toast.error('Не удалось загрузить данные пользователя');
            setWelcomeShown(true);
          }
        }
        // Загружаем карты пользователя
        await loadUserCards(currentUser.uid);
        // Загружаем количество непрочитанных сообщений
        await loadUnreadMessages(currentUser.uid);
        // Проверяем, является ли пользователь администратором
        await checkAdminStatus(currentUser.uid);
        // Проверяем премиум-статус
        await loadPremiumStatus(currentUser.uid);
      } else {
        // Если пользователь не авторизован, перенаправляем на главную
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]); // Удаляем зависимость toast

  // Обработчик секретной комбинации для открытия AdminCreator
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Если нажата клавиша 'Z' и зажат Ctrl+Shift
      if (e.key === 'Z' && e.ctrlKey && e.shiftKey) {
        setSecretKeyPresses(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Если секретная комбинация нажата 3 раза, показываем AdminCreator
  useEffect(() => {
    if (secretKeyPresses >= 3) {
      setShowAdminCreator(true);
      setSecretKeyPresses(0);
    }
  }, [secretKeyPresses]);

  const checkAdminStatus = async (userId) => {
    try {
      const result = await checkIsAdmin(userId);
      if (result.success) {
        setIsAdmin(result.isAdmin);
      }
    } catch (err) {
      console.error('Ошибка при проверке статуса администратора:', err);
    }
  };

  const loadUserCards = async (userId) => {
    setLoading(true);
    try {
      const result = await getUserCards(userId);
      if (result.success) {
        setCards(result.cards);
        // Убираем уведомление о загрузке карт, так как оно не нужно при каждой загрузке
        // if (result.cards.length > 0) {
        //   toast.info(`Загружено ${result.cards.length} карт`);
        // }
      } else {
        setError(result.error || 'Не удалось загрузить карты');
        toast.error('Не удалось загрузить карты');
      }
    } catch (err) {
      console.error('Ошибка при загрузке карт:', err);
      setError('Произошла ошибка при загрузке карт');
      toast.error('Произошла ошибка при загрузке карт');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadMessages = async (userId) => {
    try {
      const result = await getUnreadMessagesCount(userId);
      if (result.success) {
        setUnreadMessages(result.count);
      }
    } catch (err) {
      console.error('Ошибка при загрузке непрочитанных сообщений:', err);
    }
  };

  const loadPremiumStatus = async (userId) => {
    try {
      setPremiumStatus(prev => ({ ...prev, loading: true }));
      const result = await checkPremiumStatus(userId);
      
      // Проверяем, изменился ли статус премиума
      const wasPremium = premiumStatus.isPremium;
      const isPremiumNow = result.isPremium;
      
      setPremiumStatus({
        isPremium: isPremiumNow,
        premiumExpiry: result.premiumExpiry,
        features: result.features,
        loading: false,
        error: null
      });
      
      // Показываем уведомление только если статус изменился с не-премиум на премиум
      if (!wasPremium && isPremiumNow) {
        toast.success('У вас активирован премиум-аккаунт!');
      }
    } catch (err) {
      console.error('Ошибка при проверке премиум-статуса:', err);
      setPremiumStatus({
        isPremium: false,
        loading: false,
        error: 'Не удалось проверить премиум-статус'
      });
      toast.error('Не удалось проверить премиум-статус');
    }
  };

  const handleCardCreated = (newCard) => {
    setCards([...cards, newCard]);
    setShowCreateCard(false);
    toast.success('Карта успешно создана!');
  };

  const handlePremiumPurchased = () => {
    // Обновляем карты пользователя после покупки премиума
    if (user) {
      loadUserCards(user.uid);
      loadPremiumStatus(user.uid);
      toast.success('Премиум-статус успешно активирован!');
    }
  };

  const handleShowPremiumFeatures = () => {
    setShowPremiumFeatures(true);
  };
  
  const handlePurchasePremiumClick = () => {
    setShowPremiumFeatures(false);
    // Открываем компонент PremiumStatus для покупки
    document.getElementById('premium-status-section').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  if (!user || alphaStatus.loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="dashboard">
      {alphaStatus.isAlpha && (
        <div className="alpha-banner">
          <FaExclamationTriangle className="alpha-icon" />
          <div className="alpha-text">
            <strong>АЛЬФА-ВЕРСИЯ</strong> - Вы используете тестовую версию сайта. Ограничения можно отключить через Firestore.
          </div>
          <button 
            className="info-button" 
            onClick={() => setShowAlphaInfo(true)}
            title="Подробнее об альфа-версии"
          >
            <FaInfoCircle />
          </button>
        </div>
      )}
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="dashboard-title">Личный кабинет</h1>
            <p className="dashboard-welcome">Добро пожаловать, {userData?.displayName || user.email}</p>
          </div>
          
          <div className="header-right">
            {premiumStatus.isPremium && (
              <div className="premium-badge">
                <FaCrown className="premium-icon" />
                <span>Премиум-аккаунт</span>
              </div>
            )}
            <button 
              className="create-card-button"
              onClick={() => setShowCreateCard(true)}
            >
              <FaPlus /> Создать карту
            </button>
            {isAdmin && (
              <button 
                className="admin-button"
                onClick={() => setShowAdminPanel(true)}
                title="Панель администратора"
              >
                <FaUserShield /> Админ
              </button>
            )}
            <div className="toast-demo">
              <button 
                className="toast-demo-button"
                onClick={() => {
                  // Генерируем случайный тип уведомления
                  const types = ['success', 'error', 'info', 'warning'];
                  const type = types[Math.floor(Math.random() * types.length)];
                  
                  // Сообщения для разных типов уведомлений
                  const messages = {
                    success: 'Операция успешно выполнена!',
                    error: 'Произошла ошибка при выполнении операции',
                    info: 'Информация о вашем аккаунте обновлена',
                    warning: 'Внимание! Ваша сессия скоро истечет'
                  };
                  
                  // Добавляем случайный идентификатор к сообщению, чтобы избежать дублирования
                  const randomId = Math.floor(Math.random() * 1000);
                  toast(messages[type] + ' (Тест #' + randomId + ')', {
                    type: type,
                    autoClose: 5000
                  });
                }}
              >
                Тест уведомлений
              </button>
            </div>
          </div>
        </div>
        
        {!premiumStatus.isPremium && !showPremiumFeatures && (
          <div className="premium-promo">
            <div className="premium-promo-content">
              <h3>Откройте для себя преимущества Премиум-аккаунта!</h3>
              <p>Размещайте объявления без комиссии, получайте приоритетное размещение и многое другое.</p>
              <button className="show-premium-button" onClick={handleShowPremiumFeatures}>
                Узнать больше
              </button>
            </div>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        {/* Компонент ежедневных наград */}
        <div className="dashboard-section">
          <DailyRewards userId={user?.uid} />
        </div>
        
        {/* Компонент быстрых переводов */}
        <div className="dashboard-section">
          <QuickTransfer userId={user?.uid} userCards={cards} />
        </div>
        
        {/* Игровая статистика */}
        <div className="dashboard-section">
          <GameStatsWidget userId={user?.uid} />
        </div>
        
        <div id="premium-status-section" className="dashboard-section">
          <h2 className="section-title">Премиум-статус</h2>
          <PremiumStatus 
            userId={user.uid} 
            userCards={cards} 
            onPremiumPurchased={handlePremiumPurchased} 
          />
        </div>
        
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Мои карты</h2>
          </div>
          
          {loading ? (
            <div className="loading">Загрузка карт...</div>
          ) : cards.length > 0 ? (
            <div className="cards-grid">
              {cards.map((card) => (
                <VirtualCard key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="no-cards">
              <p>У вас пока нет карт. Создайте свою первую карту!</p>
            </div>
          )}
        </div>
        
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Маркет</h2>
          </div>
          <div className="market-promo">
            <div className="market-info">
              <h3>Маркет МаннБанка</h3>
              <p>Покупайте и продавайте товары за маннрубли (МР). Размещение объявления стоит всего 15 МР.</p>
              <div className="market-actions">
                <Link to="/market" className="market-link">
                  Перейти в маркет
                </Link>
                {unreadMessages > 0 && (
                  <div className="unread-messages-badge">
                    {unreadMessages} {unreadMessages === 1 ? 'новое сообщение' : 
                      unreadMessages < 5 ? 'новых сообщения' : 'новых сообщений'}
                  </div>
                )}
              </div>
            </div>
            <div className="market-icon">
              <FaShoppingCart />
            </div>
          </div>
          
          <div className="market-sections">
            {user && cards.length > 0 && (
              <>
                <div className="market-transactions-container">
                  <MarketTransactions userId={cards[0].id} />
                </div>
                
                <div className="user-chats-container">
                  <UserChats userId={user.uid} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
      
      {showCreateCard && (
        <CreateCard 
          userId={user.uid} 
          onSuccess={handleCardCreated} 
          onClose={() => setShowCreateCard(false)} 
        />
      )}
      
      {showAlphaInfo && <AlphaInfo onClose={() => setShowAlphaInfo(false)} />}
      
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      
      {showAdminCreator && (
        <AdminCreator 
          userId={user.uid} 
          onClose={() => setShowAdminCreator(false)} 
        />
      )}

      <div className="secret-hint">
        <FaUserSecret className="secret-icon" />
        <span>Нажмите Ctrl+Shift+Z три раза для доступа к секретной функции</span>
        <button 
          className="secret-button" 
          onClick={() => setShowAdminCreator(true)}
          title="Открыть панель создания администратора"
        >
          <FaUserSecret />
        </button>
      </div>

      {showPremiumFeatures && (
        <PremiumFeatures 
          isPremium={premiumStatus.isPremium} 
          onPurchaseClick={handlePurchasePremiumClick} 
        />
      )}

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .alpha-banner {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          background-color: rgba(244, 67, 54, 0.9);
          color: white;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          z-index: 999;
        }
        
        .alpha-icon {
          font-size: 1.25rem;
        }
        
        .alpha-text {
          font-size: 0.9rem;
        }
        
        .dashboard-container {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .dashboard-header {
          margin-bottom: 2rem;
          border-bottom: 1px solid #e0e0e0;
          padding-bottom: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-left {
          flex: 1;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: nowrap;
        }
        
        .dashboard-title {
          color: #1a237e;
          margin-bottom: 0.5rem;
        }
        
        .dashboard-welcome {
          color: #616161;
          font-size: 1.1rem;
        }
        
        .admin-button {
          background-color: #ff9800;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 28px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .admin-button:hover {
          background-color: #f57c00;
        }
        
        .admin-icon {
          font-size: 1.25rem;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }
        
        .dashboard-section {
          margin-bottom: 3rem;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .section-title {
          color: #1a237e;
          margin: 0;
        }
        
        .create-card-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 28px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .create-card-button:hover {
          background-color: #3f51b5;
        }
        
        .loading {
          text-align: center;
          padding: 2rem;
          color: #616161;
        }
        
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
          gap: 2rem;
          justify-items: center;
        }
        
        .no-cards {
          background-color: #f5f5f5;
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
          color: #616161;
        }
        
        .market-promo {
          display: flex;
          background-color: #e8f5e9;
          border-radius: 8px;
          padding: 2rem;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        
        .market-info {
          flex: 1;
        }
        
        .market-info h3 {
          color: #2e7d32;
          margin-top: 0;
          margin-bottom: 0.5rem;
        }
        
        .market-info p {
          color: #616161;
          margin-bottom: 1.5rem;
        }
        
        .market-link {
          display: inline-block;
          background-color: #4caf50;
          color: white;
          text-decoration: none;
          padding: 0.75rem 1.5rem;
          border-radius: 28px;
          font-weight: 500;
          transition: background-color 0.3s;
        }
        
        .market-link:hover {
          background-color: #66bb6a;
        }
        
        .market-icon {
          font-size: 4rem;
          margin-left: 2rem;
          color: #4caf50;
        }
        
        .market-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .market-transactions-container,
        .user-chats-container {
          width: 100%;
        }
        
        .market-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .unread-messages-badge {
          background-color: #f44336;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          animation: pulse 2s infinite;
        }
        
        .secret-hint {
          position: fixed;
          bottom: 10px;
          left: 10px;
          font-size: 0.7rem;
          color: #9e9e9e;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.5;
          transition: opacity 0.3s;
          z-index: 10;
        }
        
        .secret-hint:hover {
          opacity: 1;
        }
        
        .secret-icon {
          font-size: 0.8rem;
        }
        
        .secret-button {
          background: none;
          border: none;
          color: #9e9e9e;
          cursor: pointer;
          padding: 5px;
          margin-left: 5px;
          opacity: 0.2;
          transition: opacity 0.3s;
        }
        
        .secret-button:hover {
          opacity: 1;
          color: #1a237e;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .cards-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .market-promo {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }
          
          .market-icon {
            margin-left: 0;
            margin-top: 1.5rem;
          }
          
          .admin-button {
            width: 100%;
            justify-content: center;
          }
          
          .secret-hint {
            left: 10px;
            right: 10px;
            text-align: center;
            justify-content: center;
          }
          
          .dashboard-section {
            padding: 1rem;
          }
          
          .market-link {
            width: 100%;
            text-align: center;
          }
          
          .market-actions {
            flex-direction: column;
            width: 100%;
          }
          
          .unread-messages-badge {
            width: 100%;
            text-align: center;
          }
          
          .alpha-banner {
            padding: 0.5rem;
            flex-wrap: wrap;
            justify-content: center;
            text-align: center;
          }
          
          .alpha-text {
            width: 100%;
            text-align: center;
            margin-bottom: 0.5rem;
          }
          
          .info-button {
            margin-top: 0.5rem;
          }
        }
        
        @media (max-width: 992px) {
          .market-sections {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .user-chats-container {
            margin-top: 0;
          }
          
          .cards-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .dashboard-title {
            font-size: 1.5rem;
          }
          
          .dashboard-welcome {
            font-size: 0.9rem;
          }
          
          .header-right {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .premium-badge, .create-card-button, .admin-button {
            font-size: 0.9rem;
            padding: 0.6rem 1rem;
          }
          
          .section-title {
            font-size: 1.2rem;
          }
          
          .market-info h3 {
            font-size: 1.2rem;
          }
          
          .market-info p {
            font-size: 0.9rem;
          }
          
          .market-link {
            width: 100%;
            text-align: center;
          }
          
          .market-actions {
            flex-direction: column;
            width: 100%;
          }
          
          .unread-messages-badge {
            width: 100%;
            text-align: center;
          }
          
          .alpha-banner {
            padding: 0.5rem;
            flex-wrap: wrap;
            justify-content: center;
            text-align: center;
          }
          
          .alpha-text {
            width: 100%;
            text-align: center;
            margin-bottom: 0.5rem;
          }
          
          .info-button {
            margin-top: 0.5rem;
          }
        }
        
        .info-button {
          background: none;
          border: none;
          color: white;
          font-size: 1.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 50%;
          transition: background-color 0.3s;
        }
        
        .info-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .premium-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #ffc107;
          color: #333;
          padding: 0.5rem 1rem;
          border-radius: 28px;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .premium-icon {
          color: #ff6d00;
          font-size: 1.1rem;
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
        }
        
        .premium-promo {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border-left: 4px solid #ffc107;
        }
        
        .premium-promo-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .premium-promo-content h3 {
          margin: 0 0 0.5rem;
          color: #333;
        }
        
        .premium-promo-content p {
          margin: 0 0 1rem;
          color: #666;
        }
        
        .show-premium-button {
          background-color: #ffc107;
          color: #333;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .show-premium-button:hover {
          background-color: #ffca28;
        }
        
        .toast-demo {
          margin-left: 10px;
        }
        
        .toast-demo-button {
          background-color: var(--accent-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .toast-demo-button:hover {
          background-color: var(--primary-color);
        }
        
        @media (max-width: 768px) {
          .header-right {
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .toast-demo {
            margin-left: 0;
            margin-top: 8px;
            width: 100%;
          }
          
          .toast-demo-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard; 