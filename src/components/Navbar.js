import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import { auth, logoutUser } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaUser, FaTimes } from 'react-icons/fa';

const navItems = [
  { name: 'Главная', path: '/' },
  { name: 'Маркет', path: '/market' },
  { name: 'Услуги', path: '/services' },
  { name: 'О банке', path: '/about' },
  { name: 'Контакты', path: '/contacts' }
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Слушаем изменения состояния аутентификации
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    // Отписываемся при размонтировании компонента
    return () => unsubscribe();
  }, []);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAuthClick = () => {
    if (user) {
      // Если пользователь авторизован, перенаправляем в личный кабинет
      window.location.href = '/dashboard';
    } else {
      // Если не авторизован, показываем форму авторизации
      setShowAuth(true);
    }
  };

  const handleLogoutClick = async () => {
    await logoutUser();
    window.location.href = '/';
  };

  const closeAuth = () => {
    setShowAuth(false);
  };

  const handleNavLinkClick = () => {
    // Закрываем меню при клике на ссылку
    setIsMenuOpen(false);
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
          <h1 className="brand-title">Банк Маннру</h1>
        </div>

        <div className={`nav-items ${isMenuOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <a 
              key={item.name} 
              href={item.path} 
              className="nav-link"
              onClick={handleNavLinkClick}
            >
              {item.name}
            </a>
          ))}
          
          {/* Мобильная версия кнопок авторизации */}
          <div className="mobile-auth-buttons">
            {user ? (
              <>
                <button className="mobile-account-button" onClick={handleAuthClick}>
                  <FaUser className="account-icon" />
                  Личный кабинет
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
                Личный кабинет
              </button>
              <button className="logout-button" onClick={handleLogoutClick}>
                Выйти
              </button>
            </div>
          ) : (
            <button className="account-button" onClick={handleAuthClick}>
              <FaUser className="account-icon" />
              Личный кабинет
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
          gap: 2rem;
        }

        .nav-link {
          color: #1a237e;
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem;
          transition: color 0.3s;
        }

        .nav-link:hover {
          color: #3f51b5;
        }

        .user-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .account-button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 28px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.3s;
        }

        .account-button:hover {
          background-color: #3f51b5;
        }

        .logout-button {
          background-color: transparent;
          color: #1a237e;
          border: 1px solid #1a237e;
          padding: 0.75rem 1.5rem;
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
          margin-right: 0.5rem;
        }
        
        .mobile-auth-buttons {
          display: none;
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
            gap: 1.5rem;
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
            font-size: 1.2rem;
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
      `}</style>
    </nav>
  );
}

export default Navbar; 