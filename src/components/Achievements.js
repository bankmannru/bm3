import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { FaTrophy, FaLock, FaUnlock, FaCoins, FaGift, FaMedal, FaStar, FaCalendarAlt, FaGamepad, FaShoppingCart, FaAward, FaCheck, FaClock, FaCalendarCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Определение достижений
const ACHIEVEMENTS = [
  {
    id: 'first_login',
    title: 'Первый вход',
    description: 'Войдите в систему первый раз',
    icon: <FaUnlock />,
    reward: 50,
    condition: () => true, // Всегда выполнено при первом входе
    color: '#4285F4'
  },
  {
    id: 'daily_streak_3',
    title: 'Постоянство - 3 дня',
    description: 'Получите ежедневные награды 3 дня подряд',
    icon: <FaCalendarAlt />,
    reward: 100,
    condition: (userData) => userData?.dailyRewards?.currentStreak >= 3,
    color: '#FBBC05'
  },
  {
    id: 'daily_streak_7',
    title: 'Постоянство - 7 дней',
    description: 'Получите ежедневные награды 7 дней подряд',
    icon: <FaCalendarAlt />,
    reward: 200,
    condition: (userData) => userData?.dailyRewards?.currentStreak >= 7,
    color: '#EA4335'
  },
  {
    id: 'pull_tabs_10',
    title: 'Азартный игрок',
    description: 'Сыграйте в "Pull the Tabs" 10 раз',
    icon: <FaGamepad />,
    reward: 150,
    condition: (userData) => userData?.games?.pullTabs?.totalPlays >= 10,
    color: '#34A853'
  },
  {
    id: 'pull_tabs_win_1000',
    title: 'Счастливчик',
    description: 'Выиграйте 1000 МР в "Pull the Tabs"',
    icon: <FaTrophy />,
    reward: 300,
    condition: (userData) => userData?.games?.pullTabs?.totalWinnings >= 1000,
    color: '#D4AF37'
  },
  {
    id: 'market_listing',
    title: 'Продавец',
    description: 'Разместите объявление на маркете',
    icon: <FaShoppingCart />,
    reward: 100,
    condition: (userData) => userData?.market?.listingsCount > 0,
    color: '#8E44AD'
  },
  {
    id: 'premium_user',
    title: 'VIP-персона',
    description: 'Активируйте премиум-статус',
    icon: <FaStar />,
    reward: 500,
    condition: (userData) => userData?.isPremium,
    color: '#E67E22'
  }
];

function Achievements({ userId }) {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState({});
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadUserData();
      loadAchievements();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (err) {
      console.error('Ошибка при загрузке данных пользователя:', err);
    }
  };

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const userAchievementsRef = doc(db, 'users', userId, 'gamePreferences', 'achievements');
      const achievementsDoc = await getDoc(userAchievementsRef);
      
      if (achievementsDoc.exists()) {
        setUserAchievements(achievementsDoc.data());
      } else {
        // Инициализируем документ достижений, если он не существует
        await setDoc(userAchievementsRef, { 
          unlockedAchievements: {},
          totalRewardsCollected: 0
        });
        setUserAchievements({ 
          unlockedAchievements: {},
          totalRewardsCollected: 0
        });
      }
      
      // Проверяем новые достижения
      setTimeout(() => {
        checkNewAchievements();
      }, 1000);
      
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке достижений:', err);
      setError('Не удалось загрузить достижения');
      toast.error('Ошибка при загрузке достижений');
    } finally {
      setLoading(false);
    }
  };

  const checkNewAchievements = async () => {
    if (!userData || !userAchievements) return;
    
    const unlockedAchievements = userAchievements.unlockedAchievements || {};
    let newUnlocked = false;
    let totalReward = 0;
    
    // Проверяем каждое достижение
    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedAchievements[achievement.id] && achievement.condition(userData)) {
        // Достижение разблокировано
        unlockedAchievements[achievement.id] = {
          unlockedAt: new Date().toISOString(),
          rewarded: false
        };
        newUnlocked = true;
        totalReward += achievement.reward;
        
        // Показываем уведомление о новом достижении
        toast.success(`Достижение разблокировано: ${achievement.title}!`);
      }
    }
    
    if (newUnlocked) {
      try {
        // Обновляем достижения пользователя
        const userAchievementsRef = doc(db, 'users', userId, 'gamePreferences', 'achievements');
        await updateDoc(userAchievementsRef, {
          unlockedAchievements: unlockedAchievements
        });
        
        // Начисляем награду
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          balance: (userData.balance || 0) + totalReward
        });
        
        // Обновляем общую сумму полученных наград
        await updateDoc(userAchievementsRef, {
          totalRewardsCollected: (userAchievements.totalRewardsCollected || 0) + totalReward
        });
        
        // Обновляем состояние
        setUserAchievements({
          ...userAchievements,
          unlockedAchievements,
          totalRewardsCollected: (userAchievements.totalRewardsCollected || 0) + totalReward
        });
        
        if (totalReward > 0) {
          toast.success(`Вы получили ${totalReward} МР за достижения!`);
        }
      } catch (err) {
        console.error('Ошибка при обновлении достижений:', err);
        toast.error('Ошибка при обновлении достижений');
      }
    }
  };

  const getAchievementStatus = (achievementId) => {
    if (!userAchievements || !userAchievements.unlockedAchievements) {
      return 'locked';
    }
    
    return userAchievements.unlockedAchievements[achievementId] ? 'unlocked' : 'locked';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateProgress = () => {
    if (!userAchievements || !userAchievements.unlockedAchievements) {
      return 0;
    }
    
    const unlockedCount = Object.keys(userAchievements.unlockedAchievements).length;
    return Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);
  };

  if (loading) {
    return <div className="achievements-loading">Загрузка достижений...</div>;
  }

  const progressPercentage = calculateProgress();

  return (
    <div className="achievements-container">
      <div className="achievements-header">
        <h3 className="achievements-title">
          <FaTrophy className="title-icon" />
          Достижения
        </h3>
        <div className="achievements-progress">
          <div className="progress-text">
            Прогресс: {progressPercentage}%
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          {userAchievements.totalRewardsCollected > 0 && (
            <div className="rewards-total">
              <FaCoins className="coins-icon" />
              {userAchievements.totalRewardsCollected} МР получено
            </div>
          )}
        </div>
      </div>
      
      <div className="achievements-grid">
        {ACHIEVEMENTS.map(achievement => {
          const status = getAchievementStatus(achievement.id);
          const unlockData = userAchievements.unlockedAchievements?.[achievement.id];
          
          return (
            <div 
              key={achievement.id} 
              className={`achievement-card ${status}`}
              style={{ 
                borderColor: status === 'unlocked' ? achievement.color : 'transparent' 
              }}
            >
              <div 
                className="achievement-icon-container"
                style={{ backgroundColor: status === 'unlocked' ? achievement.color : '#bdbdbd' }}
              >
                {status === 'unlocked' ? achievement.icon : <FaLock />}
              </div>
              <div className="achievement-content">
                <h4 className="achievement-title">{achievement.title}</h4>
                <p className="achievement-description">{achievement.description}</p>
                
                {status === 'unlocked' && unlockData && (
                  <div className="achievement-unlocked-info">
                    <span className="unlock-date">
                      Получено: {formatDate(unlockData.unlockedAt)}
                    </span>
                  </div>
                )}
                
                <div className="achievement-reward">
                  <FaCoins className="reward-icon" />
                  <span className="reward-amount">{achievement.reward} МР</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .achievements-container {
          margin-bottom: 2rem;
        }
        
        .achievements-header {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .achievements-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #1a237e;
          margin-top: 0;
          margin-bottom: 1.2rem;
          font-size: 1.2rem;
        }
        
        .title-icon {
          color: #ffc107;
        }
        
        .achievements-progress {
          margin-top: 1rem;
        }
        
        .progress-text {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          color: #616161;
          font-size: 0.9rem;
        }
        
        .progress-bar-container {
          height: 8px;
          background-color: #f5f5f5;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.8rem;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #2e7d32);
          border-radius: 4px;
          transition: width 0.5s;
        }
        
        .rewards-total {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #616161;
          justify-content: flex-end;
        }
        
        .coins-icon {
          color: #ffc107;
        }
        
        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        
        .achievement-card {
          display: flex;
          background-color: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          border-left: 4px solid transparent;
        }
        
        .achievement-card.unlocked {
          background-color: #fafafa;
        }
        
        .achievement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .achievement-icon-container {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-right: 1rem;
          color: white;
          font-size: 1.2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .achievement-content {
          flex: 1;
        }
        
        .achievement-title {
          margin: 0;
          font-size: 1rem;
          color: #333;
          margin-bottom: 0.5rem;
        }
        
        .achievement-card.locked .achievement-title {
          color: #757575;
        }
        
        .achievement-description {
          margin: 0;
          font-size: 0.9rem;
          color: #616161;
          margin-bottom: 0.5rem;
        }
        
        .achievement-card.locked .achievement-description {
          color: #9e9e9e;
        }
        
        .achievement-unlocked-info {
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: #757575;
        }
        
        .achievement-reward {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.9rem;
          color: #ffc107;
          font-weight: 500;
        }
        
        .achievement-card.locked .achievement-reward {
          opacity: 0.5;
        }
        
        .achievements-loading {
          text-align: center;
          padding: 2rem;
          color: #757575;
        }
        
        @media (max-width: 768px) {
          .achievements-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default Achievements; 