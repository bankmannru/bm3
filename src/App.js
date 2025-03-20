import React, { useState, useEffect, lazy, Suspense, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FirestoreErrorBanner from './components/FirestoreErrorBanner';
import { auth } from './firebase';
import { FaArrowUp, FaMoon, FaSun } from 'react-icons/fa';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Создаем контекст для темы
export const ThemeContext = createContext();

// Ленивая загрузка компонентов страниц
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MarketPage = lazy(() => import('./pages/MarketPage'));
const ComponentsDemo = lazy(() => import('./pages/ComponentsDemo'));
const GamesPage = lazy(() => import('./pages/GamesPage'));
const InvestmentsPage = lazy(() => import('./pages/InvestmentsPage'));

// Заглушки для новых страниц разработчика
const ApiPage = lazy(() => 
  import('./pages/ComponentsDemo').then(module => {
    return { default: () => <div className="dev-page"><h1>API Documentation</h1><p>Страница в разработке</p></div> };
  })
);

const ToolsPage = lazy(() => 
  import('./pages/ComponentsDemo').then(module => {
    return { default: () => <div className="dev-page"><h1>Developer Tools</h1><p>Страница в разработке</p></div> };
  })
);

// Компонент загрузки
const LoadingFallback = () => (
  <div className="loading-fallback">
    <div className="loading-spinner"></div>
    <style jsx>{`
      .loading-fallback {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        width: 100%;
      }
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(26, 35, 126, 0.2);
        border-radius: 50%;
        border-top-color: #1a237e;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  const [showFirestoreError, setShowFirestoreError] = useState(false);
  const [pageTransition, setPageTransition] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Проверяем сохраненную тему в localStorage или системные настройки
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Применяем тему к документу
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);
  
  useEffect(() => {
    // Анимация при загрузке страницы - сокращаем время до 150мс
    setPageTransition(true);
    const timer = setTimeout(() => {
      setPageTransition(false);
    }, 150);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // Слушаем события консоли для отлова ошибок Firestore
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (
        errorMessage.includes('Missing or insufficient permissions') ||
        errorMessage.includes('Firestore error:')
      ) {
        setShowFirestoreError(true);
      }
      originalConsoleError.apply(console, args);
    };
    
    // Восстанавливаем оригинальную функцию при размонтировании
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  useEffect(() => {
    // Показываем кнопку "Вернуться наверх" при прокрутке
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };
  
  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <Router>
        <div className={`app ${pageTransition ? 'page-transition' : ''} ${darkMode ? 'dark-mode' : ''}`}>
          <Navbar />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/components" element={<ComponentsDemo />} />
              <Route path="/api" element={<ApiPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          
          {showFirestoreError && (
            <FirestoreErrorBanner onClose={() => setShowFirestoreError(false)} />
          )}
          
          {showScrollTop && (
            <button className="scroll-top-button" onClick={scrollToTop} title="Вернуться наверх">
              <FaArrowUp />
            </button>
          )}
          
          <button className="theme-toggle-button" onClick={toggleTheme} title={darkMode ? "Светлая тема" : "Темная тема"}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={darkMode ? "dark" : "light"}
          />

          <style jsx>{`
            .app {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              opacity: 1;
              transition: opacity 0.15s ease-in-out, background-color 0.3s ease;
              will-change: opacity;
            }
            
            .dark-mode {
              background-color: #121212;
              color: #f5f5f5;
            }
            
            .page-transition {
              opacity: 0.8;
            }
            
            .scroll-top-button, .theme-toggle-button {
              position: fixed;
              width: 50px;
              height: 50px;
              border-radius: 50%;
              background-color: #1a237e;
              color: white;
              border: none;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
              z-index: 999;
              transition: all 0.2s;
              animation: fadeIn 0.2s;
            }
            
            .scroll-top-button {
              bottom: 30px;
              right: 30px;
            }
            
            .theme-toggle-button {
              bottom: 30px;
              left: 30px;
            }
            
            .scroll-top-button:hover, .theme-toggle-button:hover {
              background-color: #3f51b5;
              transform: translateY(-5px);
              box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
            }
            
            .dark-mode .scroll-top-button, .dark-mode .theme-toggle-button {
              background-color: #3f51b5;
            }
            
            .dark-mode .scroll-top-button:hover, .dark-mode .theme-toggle-button:hover {
              background-color: #5c6bc0;
            }
            
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes slideIn {
              from { transform: translateX(-10px); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            
            @media (max-width: 768px) {
              .scroll-top-button, .theme-toggle-button {
                width: 40px;
                height: 40px;
              }
              
              .theme-toggle-button {
                left: 20px;
                bottom: 20px;
              }
              
              .scroll-top-button {
                right: 20px;
                bottom: 20px;
              }
            }
            
            .dev-page {
              max-width: 1200px;
              margin: 40px auto;
              padding: 20px;
              background-color: var(--card-bg);
              border-radius: 8px;
              box-shadow: var(--card-shadow);
            }
            
            .dev-page h1 {
              color: var(--primary-color);
              margin-bottom: 20px;
            }
            
            .dev-page p {
              color: var(--text-color);
              font-size: 1.1rem;
            }
          `}</style>
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
