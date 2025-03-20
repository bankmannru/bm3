import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaGamepad, FaCoins, FaTrophy, FaMedal, FaChartLine } from 'react-icons/fa';
import { Link } from 'react-router-dom';

function GameStatsWidget({ userId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState({
    total: 0,
    unlocked: 0
  });

  useEffect(() => {
    if (userId) {
      fetchGameStats();
      fetchAchievements();
    }
  }, [userId]);

  const fetchGameStats = async () => {
    try {
      setLoading(true);
      const statsRef = doc(db, 'gameStats', userId);
      const statsDoc = await getDoc(statsRef);
      
      if (statsDoc.exists()) {
        setStats(statsDoc.data());
      }
    } catch (error) {
      console.error('Ошибка при загрузке статистики игр:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const achievementsRef = doc(db, 'users', userId, 'gamePreferences', 'achievements');
      const achievementsDoc = await getDoc(achievementsRef);
      
      if (achievementsDoc.exists()) {
        const data = achievementsDoc.data();
        const unlockedCount = Object.keys(data.unlockedAchievements || {}).length;
        
        setAchievements({
          total: 7, // Общее количество достижений (захардкожено для примера)
          unlocked: unlockedCount
        });
      }
    } catch (error) {
      console.error('Ошибка при загрузке достижений:', error);
    }
  };

  if (loading) {
    return <div className="stats-loading">Загрузка статистики...</div>;
  }

  return (
    <div className="game-stats-widget">
      <div className="widget-header">
        <h3>
          <FaChartLine className="header-icon" />
          Игровая статистика
        </h3>
        <Link to="/games" className="view-all-link">
          Все игры
        </Link>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaGamepad />
          </div>
          <div className="stat-content">
            <div className="stat-title">Игр сыграно</div>
            <div className="stat-value">{stats?.totalPlays || 0}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon win">
            <FaCoins />
          </div>
          <div className="stat-content">
            <div className="stat-title">Выиграно МР</div>
            <div className="stat-value">{stats?.totalWinnings || 0}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon trophy">
            <FaTrophy />
          </div>
          <div className="stat-content">
            <div className="stat-title">Макс. выигрыш</div>
            <div className="stat-value">{stats?.biggestWin || 0} МР</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon medal">
            <FaMedal />
          </div>
          <div className="stat-content">
            <div className="stat-title">Достижения</div>
            <div className="stat-value">
              {achievements.unlocked}/{achievements.total}
            </div>
          </div>
        </div>
      </div>
      
      <Link to="/games" className="games-button">
        <FaGamepad className="button-icon" />
        Играть
      </Link>
      
      <style jsx>{`
        .game-stats-widget {
          background-color: white;
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.5rem;
        }
        
        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .widget-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .header-icon {
          color: #3f51b5;
        }
        
        .view-all-link {
          font-size: 0.9rem;
          color: #3f51b5;
          text-decoration: none;
        }
        
        .view-all-link:hover {
          text-decoration: underline;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          padding: 1rem;
          background-color: #f9f9f9;
          border-radius: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        
        .stat-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #e0e0e0;
          color: #616161;
          border-radius: 50%;
          font-size: 1.2rem;
          margin-right: 1rem;
        }
        
        .stat-icon.win {
          background-color: rgba(76, 175, 80, 0.2);
          color: #2e7d32;
        }
        
        .stat-icon.trophy {
          background-color: rgba(255, 193, 7, 0.2);
          color: #f57f17;
        }
        
        .stat-icon.medal {
          background-color: rgba(33, 150, 243, 0.2);
          color: #1565c0;
        }
        
        .stat-content {
          flex: 1;
        }
        
        .stat-title {
          font-size: 0.9rem;
          color: #616161;
          margin-bottom: 0.3rem;
        }
        
        .stat-value {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }
        
        .games-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 0.8rem;
          background-color: #3f51b5;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          text-decoration: none;
        }
        
        .games-button:hover {
          background-color: #303f9f;
        }
        
        .button-icon {
          font-size: 1.1rem;
        }
        
        .stats-loading {
          text-align: center;
          padding: 2rem;
          color: #757575;
        }
        
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}

export default GameStatsWidget; 