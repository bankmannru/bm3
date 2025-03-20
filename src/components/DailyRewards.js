import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { FaGift, FaCalendarAlt, FaStar, FaTrophy, FaMedal, FaCoins } from 'react-icons/fa';
import { useToast } from './Toast';

const REWARDS = [
  { day: 1, amount: 50, icon: <FaGift />, color: '#4285F4', label: 'День 1' },
  { day: 2, amount: 100, icon: <FaStar />, color: '#EA4335', label: 'День 2' },
  { day: 3, amount: 150, icon: <FaCalendarAlt />, color: '#FBBC05', label: 'День 3' },
  { day: 4, amount: 200, icon: <FaMedal />, color: '#34A853', label: 'День 4' },
  { day: 5, amount: 250, icon: <FaCoins />, color: '#8E44AD', label: 'День 5' },
  { day: 6, amount: 300, icon: <FaStar />, color: '#E67E22', label: 'День 6' },
  { day: 7, amount: 500, icon: <FaTrophy />, color: '#D4AF37', label: 'День 7' }
];

// Компонент конфетти
const Confetti = ({ active }) => {
  if (!active) return null;
  
  return (
    <div className="confetti-container">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            backgroundColor: REWARDS.map(r => r.color)[Math.floor(Math.random() * REWARDS.length)]
          }}
        />
      ))}
      <style jsx>{`
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
        }
        
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          opacity: 0.7;
          animation: confettiDrop 3s linear forwards;
        }
        
        @keyframes confettiDrop {
          0% {
            transform: translate(0, -10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(${() => (Math.random() * 200) - 100}px, calc(100vh + 10px)) rotate(${() => Math.random() * 360}deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Компонент анимации награды
const RewardAnimation = ({ reward, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  return (
    <div className="reward-animation">
      <div className="reward-animation-icon" style={{ color: reward.color }}>
        {reward.icon}
      </div>
      <div className="reward-animation-amount">+{reward.amount} МР</div>
      <style jsx>{`
        .reward-animation {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: popIn 0.5s ease-out, fadeOut 0.5s ease-in 2.5s forwards;
        }
        
        .reward-animation-icon {
          font-size: 6rem;
          margin-bottom: 1rem;
          animation: pulse 1s ease-in-out infinite;
        }
        
        .reward-animation-amount {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a237e;
          background: linear-gradient(45deg, #1a237e, #3949ab);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        @keyframes popIn {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

function DailyRewards({ userId }) {
  const [rewardsData, setRewardsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedReward, setClaimedReward] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const fetchRewardsData = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const rewardsRef = doc(db, 'users', userId, 'rewards', 'daily');
        const rewardsDoc = await getDoc(rewardsRef);
        
        if (rewardsDoc.exists()) {
          setRewardsData(rewardsDoc.data());
        } else {
          // Инициализация данных о наградах, если их еще нет
          const initialData = {
            lastClaimTimestamp: null,
            currentStreak: 0,
            maxStreak: 0,
            totalClaimed: 0,
            claimedToday: false,
            claimedDays: {}
          };
          
          await setDoc(rewardsRef, initialData);
          setRewardsData(initialData);
        }
      } catch (err) {
        console.error('Error fetching rewards data:', err);
        setError('Не удалось загрузить данные о ежедневных наградах');
        toast.error('Ошибка при загрузке данных о ежедневных наградах');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRewardsData();
  }, [userId, toast]);

  const isEligibleForClaim = () => {
    if (!rewardsData || !rewardsData.lastClaimTimestamp) {
      return true; // Никогда не получал награду раньше
    }
    
    const lastClaim = rewardsData.lastClaimTimestamp.toDate();
    const now = new Date();
    
    // Проверяем, что последнее получение было вчера или раньше
    // и что сегодня еще не получали награду
    const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const differenceInDays = Math.floor((today - lastClaimDay) / (1000 * 60 * 60 * 24));
    
    return differenceInDays >= 1 && !rewardsData.claimedToday;
  };

  const getStreakDay = () => {
    if (!rewardsData) return 1;
    
    // Если есть текущая серия, вернуть день в серии (от 1 до 7)
    const day = rewardsData.currentStreak % 7 + 1;
    return day;
  };

  const claimDailyReward = async () => {
    if (!userId || claiming) return;
    
    try {
      setClaiming(true);
      
      const eligible = isEligibleForClaim();
      if (!eligible) {
        toast.info('Вы уже получили ежедневную награду сегодня. Возвращайтесь завтра!');
        return;
      }
      
      const rewardsRef = doc(db, 'users', userId, 'rewards', 'daily');
      const userRef = doc(db, 'users', userId);
      
      // Получаем текущие данные пользователя
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error('Пользователь не найден');
      }
      
      const userData = userDoc.data();
      const currentBalance = userData.balance || 0;
      
      // Определяем день в серии и соответствующую награду
      const streakDay = getStreakDay();
      const reward = REWARDS.find(r => r.day === streakDay) || REWARDS[0];
      
      // Проверяем, была ли прервана серия
      let newStreak = rewardsData.currentStreak;
      const lastClaim = rewardsData.lastClaimTimestamp ? rewardsData.lastClaimTimestamp.toDate() : null;
      const now = new Date();
      
      if (lastClaim) {
        const lastClaimDay = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const differenceInDays = Math.floor((today - lastClaimDay) / (1000 * 60 * 60 * 24));
        
        // Если прошло больше одного дня, серия прерывается
        if (differenceInDays > 1) {
          newStreak = 0;
        }
      }
      
      // Увеличиваем серию на 1
      newStreak += 1;
      
      // Обновляем максимальную серию, если текущая серия больше
      const newMaxStreak = Math.max(rewardsData.maxStreak || 0, newStreak);
      
      // Обновляем данные о наградах
      const today = new Date().toISOString().split('T')[0];
      const updatedRewardsData = {
        lastClaimTimestamp: serverTimestamp(),
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        totalClaimed: (rewardsData.totalClaimed || 0) + reward.amount,
        claimedToday: true,
        claimedDays: { 
          ...rewardsData.claimedDays,
          [today]: reward.amount
        }
      };
      
      // Обновляем баланс пользователя
      await updateDoc(userRef, {
        balance: currentBalance + reward.amount
      });
      
      // Обновляем данные о наградах
      await updateDoc(rewardsRef, updatedRewardsData);
      
      // Обновляем состояние компонента
      setRewardsData({
        ...rewardsData,
        ...updatedRewardsData,
        lastClaimTimestamp: { toDate: () => new Date() } // Имитация объекта Timestamp для локального обновления
      });
      
      // Показываем анимацию и конфетти
      setClaimedReward(reward);
      setShowConfetti(true);
      
      // Через 3 секунды удаляем эффекты
      setTimeout(() => {
        setShowConfetti(false);
        setClaimedReward(null);
      }, 3000);
      
      toast.success(`Вы получили ежедневную награду: ${reward.amount} МР! Продолжайте заходить ежедневно для увеличения серии!`);
    } catch (err) {
      console.error('Error claiming daily reward:', err);
      setError('Не удалось получить ежедневную награду');
      toast.error('Ошибка при получении ежедневной награды');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <div className="daily-rewards-loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="daily-rewards-error">{error}</div>;
  }

  const streakDay = getStreakDay();
  const canClaim = isEligibleForClaim();

  return (
    <div className="daily-rewards">
      <div className="daily-rewards-header">
        <h3 className="daily-rewards-title">Ежедневные награды</h3>
        {rewardsData && (
          <div className="daily-rewards-streak">
            <span className="streak-icon"><FaCalendarAlt /></span>
            <span className="streak-text">
              Текущая серия: {rewardsData.currentStreak || 0} {' '}
              (Макс: {rewardsData.maxStreak || 0})
            </span>
          </div>
        )}
      </div>
      
      <div className="daily-rewards-container">
        {REWARDS.map((reward) => (
          <div 
            key={reward.day}
            className={`reward-item ${reward.day === streakDay ? 'current' : ''} ${reward.day < streakDay ? 'claimed' : ''}`}
            style={{ 
              borderColor: reward.day === streakDay ? reward.color : 'transparent',
              opacity: reward.day < streakDay || reward.day > streakDay + 2 ? 0.6 : 1
            }}
          >
            <div className="reward-day">{reward.label}</div>
            <div className="reward-icon" style={{ color: reward.color }}>
              {reward.icon}
            </div>
            <div className="reward-amount">{reward.amount} МР</div>
          </div>
        ))}
      </div>
      
      <div className="daily-rewards-actions">
        <button 
          className={`claim-button ${!canClaim ? 'claimed' : ''} ${canClaim ? 'pulse-animation' : ''}`}
          onClick={claimDailyReward}
          disabled={!canClaim || claiming}
        >
          {claiming ? 'Получение...' : canClaim ? 'Получить награду' : 'Уже получено'}
          {canClaim && <span className="claim-glow"></span>}
        </button>
        
        <div className="rewards-info">
          {canClaim ? (
            <p>Получите ежедневную награду прямо сейчас!</p>
          ) : (
            <p>Вы уже получили награду сегодня. Возвращайтесь завтра!</p>
          )}
          <p className="rewards-totals">Всего получено: {rewardsData?.totalClaimed || 0} МР</p>
        </div>
      </div>
      
      {/* Анимации */}
      <Confetti active={showConfetti} />
      {claimedReward && (
        <RewardAnimation 
          reward={claimedReward} 
          onComplete={() => setClaimedReward(null)} 
        />
      )}
      
      <style jsx>{`
        .daily-rewards {
          background-color: #ffffff;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .daily-rewards::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, 
            #4285F4, #EA4335, #FBBC05, #34A853, 
            #8E44AD, #E67E22, #D4AF37, #4285F4);
          background-size: 200% 100%;
          animation: gradient-shift 15s linear infinite;
        }
        
        @keyframes gradient-shift {
          0% {
            background-position: 0% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .daily-rewards-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.2rem;
          flex-wrap: wrap;
        }
        
        .daily-rewards-title {
          color: #1a237e;
          margin: 0;
          font-size: 1.25rem;
        }
        
        .daily-rewards-streak {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #f5f5f5;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
        }
        
        .streak-icon {
          color: #ffa000;
        }
        
        .streak-text {
          color: #424242;
          font-weight: 500;
        }
        
        .daily-rewards-container {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.5rem 0;
          margin-bottom: 1.5rem;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: #bdbdbd #f5f5f5;
        }
        
        .daily-rewards-container::-webkit-scrollbar {
          height: 6px;
        }
        
        .daily-rewards-container::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 10px;
        }
        
        .daily-rewards-container::-webkit-scrollbar-thumb {
          background-color: #bdbdbd;
          border-radius: 10px;
        }
        
        .reward-item {
          flex: 0 0 100px;
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 1rem 0.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.3s;
          border: 2px solid transparent;
          text-align: center;
          position: relative;
        }
        
        .reward-item.current {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          background-color: #fff;
          transform: translateY(-4px) scale(1.05);
        }
        
        .reward-item.claimed {
          background-color: #e8f5e9;
        }
        
        .reward-item.claimed::after {
          content: '✓';
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          font-size: 1rem;
          color: #4caf50;
          font-weight: bold;
        }
        
        .reward-day {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #616161;
        }
        
        .reward-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.8);
        }
        
        .reward-amount {
          font-weight: 700;
          color: #1a237e;
        }
        
        .daily-rewards-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-top: 1rem;
          flex-wrap: wrap;
        }
        
        .claim-button {
          background-color: #4caf50;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 28px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s, transform 0.2s;
          min-width: 180px;
          position: relative;
          overflow: hidden;
        }
        
        .claim-button:hover:not(:disabled) {
          background-color: #388e3c;
          transform: translateY(-2px);
        }
        
        .claim-button:disabled {
          background-color: #e0e0e0;
          color: #9e9e9e;
          cursor: not-allowed;
        }
        
        .claim-button.claimed {
          background-color: #e0e0e0;
          color: #9e9e9e;
          cursor: not-allowed;
        }
        
        .claim-button.pulse-animation {
          animation: pulse 2s infinite;
        }
        
        .claim-glow {
          position: absolute;
          width: 50px;
          height: 100%;
          top: 0;
          left: -60px;
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.4) 50%, 
            rgba(255,255,255,0) 100%);
          transform: skewX(-20deg);
          animation: glow 2.5s infinite;
        }
        
        @keyframes glow {
          0% {
            left: -60px;
          }
          60%, 100% {
            left: 130%;
          }
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }
        
        .rewards-info {
          flex: 1;
        }
        
        .rewards-info p {
          margin: 0 0 0.5rem;
          color: #616161;
          font-size: 0.9rem;
        }
        
        .rewards-totals {
          font-weight: 500;
          color: #1a237e;
        }
        
        .daily-rewards-loading,
        .daily-rewards-error {
          padding: 1.5rem;
          text-align: center;
          color: #616161;
        }
        
        .daily-rewards-error {
          color: #d32f2f;
        }
        
        @media (max-width: 768px) {
          .daily-rewards-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          
          .daily-rewards-streak {
            width: 100%;
          }
          
          .daily-rewards-container {
            padding: 0.5rem 0;
          }
          
          .daily-rewards-actions {
            flex-direction: column;
            align-items: stretch;
          }
          
          .claim-button {
            width: 100%;
          }
          
          .rewards-info {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

export default DailyRewards; 