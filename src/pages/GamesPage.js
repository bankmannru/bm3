import React, { useState, useEffect } from 'react';
import { auth, firestore, getUserData, getUserCards } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import PullTheTabs from '../components/PullTheTabs';
import Leaderboard from '../components/Leaderboard';
import Achievements from '../components/Achievements';
import GameHistory from '../components/GameHistory';
import Footer from '../components/Footer';
import { FaGamepad, FaCoins, FaHistory, FaTrophy, FaMedal } from 'react-icons/fa';
import { useToast } from '../components/Toast';

function GamesPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pull-tabs');
  const [userBalance, setUserBalance] = useState(0);
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Загружаем данные пользователя
        try {
          const userDataResult = await getUserData(currentUser.uid);
          if (userDataResult.success) {
            setUserData(userDataResult.userData);
            setUserBalance(userDataResult.userData.balance || 0);
          } else {
            toast.error('Не удалось загрузить данные пользователя');
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
          toast.error('Ошибка при загрузке данных пользователя');
        }
        
        setLoading(false);
      } else {
        // Если пользователь не авторизован, перенаправляем на главную
        window.location.href = '/';
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleBalanceUpdate = (newBalance) => {
    setUserBalance(newBalance);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="games-page">
      <div className="games-container">
        <div className="games-header">
          <h1>Игры БанкМаннру</h1>
          <div className="user-balance">
            <FaCoins className="coin-icon" />
            <span>{userBalance} МР</span>
          </div>
        </div>
        
        <div className="games-tabs">
          <button 
            className={`tab-button ${activeTab === 'pull-tabs' ? 'active' : ''}`}
            onClick={() => setActiveTab('pull-tabs')}
          >
            <FaGamepad /> Pull the Tabs
          </button>
          <button 
            className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <FaTrophy /> Таблица лидеров
          </button>
          <button 
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <FaMedal /> Достижения
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory /> История игр
          </button>
        </div>
        
        <div className="games-content">
          {activeTab === 'pull-tabs' && (
            <PullTheTabs 
              userId={user.uid} 
              userBalance={userBalance}
              onBalanceUpdate={handleBalanceUpdate}
            />
          )}
          
          {activeTab === 'leaderboard' && (
            <Leaderboard gameType="pullTabs" />
          )}
          
          {activeTab === 'achievements' && (
            <Achievements userId={user.uid} />
          )}
          
          {activeTab === 'history' && (
            <GameHistory userId={user.uid} />
          )}
        </div>
      </div>
      
      <Footer />
      
      <style jsx>{`
        .games-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--background-color, #f8f9fa);
        }
        
        .games-container {
          flex: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
          width: 100%;
        }
        
        .games-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        
        .games-header h1 {
          margin: 0;
          color: var(--text-color, #333);
          font-size: 2.5rem;
        }
        
        .user-balance {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--card-bg, white);
          padding: 12px 20px;
          border-radius: 30px;
          box-shadow: var(--card-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--text-color, #333);
        }
        
        .coin-icon {
          color: #ffc107;
          font-size: 1.2rem;
        }
        
        .games-tabs {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          padding-bottom: 16px;
          overflow-x: auto;
        }
        
        .tab-button {
          background: none;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-color, #333);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s, color 0.2s;
        }
        
        .tab-button:hover {
          background-color: rgba(67, 97, 238, 0.05);
        }
        
        .tab-button.active {
          background-color: var(--primary-color, #4361ee);
          color: white;
        }
        
        .games-content {
          margin-bottom: 40px;
        }
        
        .coming-soon {
          background-color: var(--card-bg, white);
          border-radius: 12px;
          box-shadow: var(--card-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
          padding: 40px;
          text-align: center;
          color: var(--text-color, #333);
        }
        
        .coming-soon h2 {
          margin-top: 0;
          margin-bottom: 16px;
          color: var(--primary-color, #4361ee);
        }
        
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: var(--text-color, #333);
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(67, 97, 238, 0.2);
          border-radius: 50%;
          border-top-color: var(--primary-color, #4361ee);
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .games-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .games-header h1 {
            font-size: 2rem;
          }
          
          .games-tabs {
            padding-bottom: 8px;
            margin-bottom: 24px;
          }
          
          .tab-button {
            white-space: nowrap;
            padding: 10px 16px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}

export default GamesPage; 