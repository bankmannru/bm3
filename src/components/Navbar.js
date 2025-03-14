import React, { useState, useEffect } from 'react';
import Auth from './Auth';
import { auth, logoutUser } from '../firebase';
import { useNavigate } from 'react-router-dom';

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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <button className="menu-button" onClick={toggleMenu}>
            <span className="menu-icon">☰</span>
          </button>
          <h1 className="brand-title">Банк Маннру</h1>
        </div>

        <div className={`nav-items ${isMenuOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <a key={item.name} href={item.path} className="nav-link">
              {item.name}
            </a>
          ))}
        </div>

        {user ? (
          <div className="user-actions">
            <button className="account-button" onClick={handleAuthClick}>
              <span className="account-icon">👤</span>
              Личный кабинет
            </button>
            <button className="logout-button" onClick={handleLogoutClick}>
              Выйти
            </button>
          </div>
        ) : (
          <button className="account-button" onClick={handleAuthClick}>
            <span className="account-icon">👤</span>
            Личный кабинет
          </button>
        )}
      </div>

      {showAuth && <Auth onClose={closeAuth} />}

      <style jsx>{`
        .navbar {
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 1rem;
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
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .brand-title {
          margin: 0;
          font-size: 1.5rem;
          color: #1a237e;
        }

        .menu-button {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
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

        @media (max-width: 768px) {
          .menu-button {
            display: block;
          }

          .nav-items {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: white;
            flex-direction: column;
            padding: 1rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .nav-items.active {
            display: flex;
          }

          .user-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .account-button, .logout-button {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar; 