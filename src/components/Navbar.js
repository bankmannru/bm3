import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import { auth, logoutUser, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { FaBars, FaUser, FaTimes, FaCubes, FaCode, FaTools, FaGift, FaExchangeAlt } from 'react-icons/fa';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

// Основные пункты меню
const navItems = [
  { name: 'Главная', path: '/' },
  { name: 'Маркет', path: '/market' },
  { name: 'Инвестиции', path: '/investments' },
  { name: 'Игры', path: '/games' }
];

// Дополнительные пункты меню (будут в выпадающем списке "Ещё")
const moreItems = [
  { name: 'Услуги', path: '/services' },
  { name: 'О банке', path: '/about' },
  { name: 'Контакты', path: '/contacts' }
];

// Группа "Для разработчиков"
const devItems = [
  { name: 'Компоненты', path: '/components', icon: <FaCubes /> },
  { name: 'API', path: '/api', icon: <FaCode /> },
  { name: 'Инструменты', path: '/tools', icon: <FaTools /> }
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hasReward, setHasReward] = useState(false);
  const [hasNewTransfers, setHasNewTransfers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Слушаем изменения состояния аутентификации
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Проверяем наличие ежедневной награды
        checkDailyReward(currentUser.uid);
        // Проверяем наличие новых переводов
        checkNewTransfers(currentUser.uid);
      }
    });

    // Отписываемся при размонтировании компонента
    return () => unsubscribe();
  }, []);

  // Проверяем, доступна ли ежедневная награда
  const checkDailyReward = async (userId) => {
    try {
      const rewardsRef = doc(db, 'users', userId, 'rewards', 'daily');
      const rewardsDoc = await getDoc(rewardsRef);
      
      if (!rewardsDoc.exists()) {
        // Если нет данных о наградах, значит награда доступна
        setHasReward(true);
        return;
      }
      
      const rewardsData = rewardsDoc.data();
      
      if (!rewardsData.lastClaimTimestamp) {
        // Если никогда не получал награду, то она доступна
        setHasReward(true);
        return;
      }
      
      const lastClaim = rewardsData.lastClaimTimestamp.toDate();
      const now = new Date();
      
      // Проверяем, что последнее получение было вчера или раньше
      // и что сегодня еще не получали награду
      const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const differenceInDays = Math.floor((today - lastClaimDay) / (1000 * 60 * 60 * 24));
      
      // Устанавливаем флаг, если награда доступна
      setHasReward(differenceInDays >= 1 && !rewardsData.claimedToday);
    } catch (err) {
      console.error('Error checking daily reward:', err);
      // В случае ошибки не показываем индикатор
      setHasReward(false);
    }
  };

  // Проверяем наличие новых переводов
  const checkNewTransfers = async (userId) => {
    try {
      // Получаем последние 5 транзакций, где пользователь был получателем
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef, 
        where('receiverId', '==', userId),
        where('type', '==', 'transfer'),
        where('seen', '==', false),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      // Если есть хотя бы одна непросмотренная транзакция
      setHasNewTransfers(!querySnapshot.empty);
    } catch (err) {
      console.error('Ошибка при проверке новых переводов:', err);
    }
  };

  // Закрываем меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.navbar-container') && !event.target.closest('.menu-button')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Закрываем меню при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMenuOpen]);

  // Предзагрузка страниц для быстрой навигации
  useEffect(() => {
    // Предзагружаем основные страницы
    const prefetchPages = async () => {
      const { default: Dashboard } = await import('../pages/Dashboard');
      const { default: MarketPage } = await import('../pages/MarketPage');
    };
    
    prefetchPages();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAuthClick = () => {
    if (user) {
      // Если пользователь авторизован, перенаправляем в личный кабинет
      navigate('/dashboard');
    } else {
      // Если не авторизован, показываем форму авторизации
      setShowAuth(true);
    }
  };

  const handleLogoutClick = async () => {
    await logoutUser();
    navigate('/');
  };

  const closeAuth = () => {
    setShowAuth(false);
  };

  const handleNavLinkClick = (path) => {
    // Закрываем меню при клике на ссылку
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <button 
            className="menu-button" 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
          >
            {isMenuOpen ? <FaTimes className="menu-icon" /> : <FaBars className="menu-icon" />}
          </button>
          <Link to="/" className="brand-title">Банк Маннру</Link>
        </div>

        <div className={`nav-items ${isMenuOpen ? 'active' : ''}`}>
          {/* Основные пункты меню */}
          {navItems.map((item) => (
            <button 
              key={item.name} 
              className={`nav-link ${window.location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNavLinkClick(item.path)}
            >
              {item.icon && <span className="nav-icon">{item.icon}</span>}
              {item.name}
            </button>
          ))}
          
          {/* Выпадающее меню "Ещё" */}
          <div className="more-menu-container">
            <button 
              className={`nav-link more-menu-toggle ${showMoreMenu ? 'active' : ''}`}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              Ещё
            </button>
            
            {showMoreMenu && (
              <div className="more-submenu">
                {moreItems.map((item) => (
                  <button 
                    key={item.name} 
                    className={`nav-link ${window.location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => handleNavLinkClick(item.path)}
                  >
                    {item.icon && <span className="nav-icon">{item.icon}</span>}
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Группа "Для разработчиков" */}
          <div className="dev-menu-container">
            <button 
              className={`nav-link dev-menu-toggle ${showDevMenu ? 'active' : ''}`}
              onClick={() => setShowDevMenu(!showDevMenu)}
            >
              <span className="nav-icon"><FaTools /></span>
              Для разработчиков
            </button>
            
            {showDevMenu && (
              <div className="dev-submenu">
                {devItems.map((item) => (
                  <button 
                    key={item.name} 
                    className={`nav-link ${window.location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => handleNavLinkClick(item.path)}
                  >
                    {item.icon && <span className="nav-icon">{item.icon}</span>}
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Мобильная версия кнопок авторизации */}
          <div className="mobile-auth-buttons">
            {user ? (
              <>
                <button className="mobile-account-button" onClick={handleAuthClick}>
                  <FaUser className="account-icon" />
                  Личный кабинет
                  {hasReward && (
                    <span className="mobile-reward-indicator" title="Доступна ежедневная награда!">
                      <FaGift />
                    </span>
                  )}
                  {hasNewTransfers && (
                    <span className="mobile-transfers-indicator" title="У вас новые переводы!">
                      <FaExchangeAlt />
                    </span>
                  )}
                </button>
                <button className="mobile-logout-button" onClick={handleLogoutClick}>
                  Выйти
                </button>
              </>
            ) : (
              <button className="mobile-account-button" onClick={handleAuthClick}>
                <FaUser className="account-icon" />
                Личный кабинет
              </button>
            )}
          </div>
        </div>

        {/* Десктопная версия кнопок авторизации */}
        <div className="desktop-auth-buttons">
          {user ? (
            <div className="user-actions">
              <button className="account-button" onClick={handleAuthClick}>
                <FaUser className="account-icon" />
                <span className="account-text">Личный кабинет</span>
                {hasReward && (
                  <span className="reward-indicator" title="Доступна ежедневная награда!">
                    <FaGift />
                  </span>
                )}
                {hasNewTransfers && (
                  <span className="transfers-indicator" title="У вас новые переводы!">
                    <FaExchangeAlt />
                  </span>
                )}
              </button>
              <button className="logout-button" onClick={handleLogoutClick}>
                Выйти
              </button>
            </div>
          ) : (
            <button className="account-button" onClick={handleAuthClick}>
              <FaUser className="account-icon" />
              <span className="account-text">Личный кабинет</span>
            </button>
          )}
        </div>
      </div>

      {showAuth && <Auth onClose={closeAuth} />}

      <style jsx>{`
        .navbar {
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 0.75rem 1rem;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
          z-index: 1001; /* Выше, чем мобильное меню */
        }

        .brand-title {
          margin: 0;
          font-size: 1.5rem;
          color: #1a237e;
          white-space: nowrap;
          text-decoration: none;
          font-weight: 700;
        }

        .menu-button {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
          color: #1a237e;
          z-index: 1001;
        }

        .nav-items {
          display: flex;
          gap: 1.25rem; /* Уменьшенный отступ между элементами */
        }

        .nav-link {
          color: #1a237e;
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem;
          transition: color 0.15s, transform 0.15s;
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .nav-link:hover {
          color: #3f51b5;
          transform: translateY(-2px);
        }
        
        .nav-link.active {
          color: #3f51b5;
          font-weight: 700;
        }
        
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0.5rem;
          right: 0.5rem;
          height: 2px;
          background-color: #3f51b5;
          border-radius: 2px;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .user-actions {
          display: flex;
          gap: 0.75rem; /* Уменьшенный отступ между кнопками */
          align-items: center;
        }

        .account-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem 1.25rem;
          border-radius: 28px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.3s;
          position: relative;
        }

        .account-button:hover {
          background-color: #3f51b5;
        }

        .logout-button {
          background-color: transparent;
          color: #1a237e;
          border: 1px solid #1a237e;
          padding: 0.75rem 1.25rem;
          border-radius: 28px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .logout-button:hover {
          background-color: #f5f5f5;
        }

        .menu-icon {
          font-size: 1.5rem;
        }
        
        .account-icon {
          margin-right: 0.25rem;
        }
        
        .mobile-auth-buttons {
          display: none;
        }
        
        /* Стили для выпадающего меню "Ещё" */
        .more-menu-container {
          position: relative;
        }
        
        .more-menu-toggle {
          color: #1a237e;
          position: relative;
        }
        
        .more-submenu {
          position: absolute;
          top: 100%;
          left: 0;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 8px 0;
          z-index: 1000;
          min-width: 180px;
          animation: fadeIn 0.2s ease-out;
        }
        
        .more-submenu .nav-link {
          padding: 10px 16px;
          width: 100%;
          text-align: left;
          border-radius: 0;
        }
        
        .more-submenu .nav-link:hover {
          background-color: rgba(63, 81, 181, 0.1);
        }
        
        /* Стили для выпадающего меню "Для разработчиков" */
        .dev-menu-container {
          position: relative;
        }
        
        .dev-menu-toggle {
          color: #1a237e;
          position: relative;
        }
        
        .dev-submenu {
          position: absolute;
          top: 100%;
          left: 0;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 8px 0;
          z-index: 1000;
          min-width: 200px;
          animation: fadeIn 0.2s ease-out;
        }
        
        .dev-submenu .nav-link {
          padding: 10px 16px;
          width: 100%;
          text-align: left;
          border-radius: 0;
        }
        
        .dev-submenu .nav-link:hover {
          background-color: rgba(63, 81, 181, 0.1);
        }
        
        /* Темная тема для выпадающих меню */
        .dark-mode .more-submenu,
        .dark-mode .dev-submenu {
          background-color: #1e1e1e;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .dark-mode .more-submenu .nav-link:hover,
        .dark-mode .dev-submenu .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        /* Адаптивные стили для планшетов */
        @media (max-width: 992px) {
          .account-text {
            display: none; /* Скрываем текст кнопки на планшетах */
          }
          
          .account-button {
            padding: 0.75rem;
            border-radius: 50%;
            aspect-ratio: 1;
          }
          
          .account-icon {
            margin-right: 0;
            font-size: 1.2rem;
          }
          
          .logout-button {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
          
          .nav-items {
            gap: 0.75rem; /* Еще меньше отступы на планшетах */
          }
          
          .nav-link {
            padding: 0.5rem 0.75rem;
            font-size: 0.9rem;
          }
        }
        
        /* Стили для мобильных устройств */
        @media (max-width: 768px) {
          .menu-button {
            display: block;
          }
          
          .desktop-auth-buttons {
            display: none;
          }
          
          .mobile-auth-buttons {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1.5rem;
            width: 100%;
          }

          .nav-items {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: white;
            flex-direction: column;
            padding: 5rem 2rem 2rem;
            gap: 1rem;
            z-index: 1000;
            overflow-y: auto;
            transition: transform 0.3s ease-in-out;
            transform: translateX(-100%);
          }

          .nav-items.active {
            display: flex;
            transform: translateX(0);
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
          }
          
          .nav-link {
            font-size: 1.1rem;
            padding: 0.75rem 0;
            border-bottom: 1px solid #f0f0f0;
            width: 100%;
            display: block;
          }
          
          .mobile-account-button {
            background-color: #1a237e;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 28px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            width: 100%;
            position: relative;
          }
          
          .mobile-logout-button {
            background-color: transparent;
            color: #1a237e;
            border: 1px solid #1a237e;
            padding: 0.75rem 1.5rem;
            border-radius: 28px;
            font-weight: 500;
            cursor: pointer;
            width: 100%;
            text-align: center;
          }
          
          .mobile-reward-indicator {
            position: absolute;
            top: -5px;
            right: 20px;
            background-color: #ff5722;
            color: white;
            font-size: 0.7rem;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
          }
          
          .mobile-transfers-indicator {
            position: absolute;
            top: -5px;
            right: 20px;
            background-color: #4caf50;
            color: white;
            font-size: 0.7rem;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 2s infinite;
          }
          
          .mobile-reward-indicator + .mobile-transfers-indicator {
            right: 20px;
          }
          
          .more-submenu,
          .dev-submenu {
            position: static;
            box-shadow: none;
            padding: 0;
            margin-left: 16px;
            border-left: 2px solid #e0e0e0;
            min-width: auto;
            width: 100%;
          }
          
          .dark-mode .more-submenu,
          .dark-mode .dev-submenu {
            border-left-color: #333;
          }
        }
        
        /* Дополнительные стили для очень маленьких экранов */
        @media (max-width: 480px) {
          .navbar {
            padding: 0.5rem;
          }
          
          .brand-title {
            font-size: 1.2rem;
          }
          
          .nav-items {
            padding: 4rem 1.5rem 1.5rem;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .reward-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          background-color: #ff5722;
          color: white;
          font-size: 0.7rem;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .transfers-indicator {
          position: absolute;
          top: -5px;
          right: -5px;
          background-color: #4caf50;
          color: white;
          font-size: 0.7rem;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        /* Если обе иконки активны, смещаем индикатор переводов */
        .reward-indicator + .transfers-indicator {
          right: 20px;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 87, 34, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 87, 34, 0);
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar; 