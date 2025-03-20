import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase';
import { FaTrophy, FaUser, FaCoins, FaClock, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

function Leaderboard({ gameType = 'pullTabs' }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('totalWinnings');
  const [sortDirection, setSortDirection] = useState('desc');
  const [timeRange, setTimeRange] = useState('allTime');
  
  useEffect(() => {
    fetchLeaderboardData();
  }, [gameType, sortField, sortDirection, timeRange]);
  
  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      
      let q = collection(db, 'gameStats');
      
      // Фильтрация по типу игры
      q = query(q, where('gameType', '==', gameType));
      
      // Фильтрация по временному диапазону
      if (timeRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        q = query(q, where('timestamp', '>=', today));
      } else if (timeRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        q = query(q, where('timestamp', '>=', weekAgo));
      } else if (timeRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        q = query(q, where('timestamp', '>=', monthAgo));
      }
      
      // Сортировка
      q = query(q, orderBy(sortField, sortDirection), limit(50));
      
      const querySnapshot = await getDocs(q);
      const leaders = [];
      
      // Обработка результатов запроса
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leaders.push({
          id: doc.id,
          userId: data.userId,
          username: data.username,
          totalWinnings: data.totalWinnings || 0,
          totalPlays: data.totalPlays || 0,
          biggestWin: data.biggestWin || 0,
          winRate: data.winRate || 0,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      
      setLeaderboardData(leaders);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке таблицы лидеров:', err);
      setError('Не удалось загрузить таблицу лидеров');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const getSortIcon = (field) => {
    if (field !== sortField) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  if (loading) {
    return <div className="leaderboard-loading">Загрузка таблицы лидеров...</div>;
  }

  if (error) {
    return <div className="leaderboard-error">{error}</div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h3>
          <FaTrophy className="trophy-icon" />
          Таблица лидеров
        </h3>
        <div className="filter-controls">
          <select 
            className="time-filter"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="allTime">За всё время</option>
            <option value="month">За месяц</option>
            <option value="week">За неделю</option>
            <option value="today">За сегодня</option>
          </select>
        </div>
      </div>
      
      {leaderboardData.length === 0 ? (
        <div className="no-data">
          Пока никто не играл. Будьте первым!
        </div>
      ) : (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="rank-column">Место</th>
                <th>Игрок</th>
                <th className="sortable" onClick={() => handleSort('totalWinnings')}>
                  <span>Выигрыш</span>
                  {getSortIcon('totalWinnings')}
                </th>
                <th className="sortable" onClick={() => handleSort('totalPlays')}>
                  <span>Игр</span>
                  {getSortIcon('totalPlays')}
                </th>
                <th className="sortable" onClick={() => handleSort('biggestWin')}>
                  <span>Макс. выигрыш</span>
                  {getSortIcon('biggestWin')}
                </th>
                <th className="sortable" onClick={() => handleSort('winRate')}>
                  <span>Удача (%)</span>
                  {getSortIcon('winRate')}
                </th>
                <th className="date-column sortable" onClick={() => handleSort('timestamp')}>
                  <span>Последняя игра</span>
                  {getSortIcon('timestamp')}
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((player, index) => (
                <tr key={player.id} className={index < 3 ? `top-${index + 1}` : ''}>
                  <td className="rank-column">
                    {index + 1 <= 3 ? (
                      <div className={`medal medal-${index + 1}`}>
                        {index + 1}
                      </div>
                    ) : (
                      index + 1
                    )}
                  </td>
                  <td className="player-column">
                    <FaUser className="user-icon" />
                    <span className="player-name">{player.username || 'Неизвестный игрок'}</span>
                  </td>
                  <td className="winnings-column">
                    <FaCoins className="coin-icon" />
                    {player.totalWinnings} МР
                  </td>
                  <td>{player.totalPlays}</td>
                  <td className="max-win-column">
                    <FaCoins className="coin-icon" />
                    {player.biggestWin} МР
                  </td>
                  <td className="win-rate-column">
                    {player.winRate.toFixed(1)}%
                  </td>
                  <td className="date-column">
                    <FaClock className="clock-icon" />
                    {formatDate(player.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <style jsx>{`
        .leaderboard-container {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          margin-bottom: 30px;
        }
        
        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .leaderboard-header h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.2rem;
          color: #333;
        }
        
        .trophy-icon {
          color: #ffc107;
        }
        
        .filter-controls {
          display: flex;
          gap: 10px;
        }
        
        .time-filter {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          background-color: white;
          font-size: 0.9rem;
          color: #555;
          cursor: pointer;
        }
        
        .leaderboard-table-container {
          overflow-x: auto;
        }
        
        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        
        .leaderboard-table th,
        .leaderboard-table td {
          padding: 1rem;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .leaderboard-table th {
          background-color: #f9f9f9;
          font-weight: 600;
          color: #555;
          position: sticky;
          top: 0;
        }
        
        .sortable {
          cursor: pointer;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .sortable:hover {
          background-color: #f5f5f5;
        }
        
        .rank-column {
          width: 60px;
          text-align: center;
        }
        
        .medal {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin: 0 auto;
          color: white;
        }
        
        .medal-1 {
          background-color: #ffd700; /* Золото */
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }
        
        .medal-2 {
          background-color: #c0c0c0; /* Серебро */
          box-shadow: 0 0 10px rgba(192, 192, 192, 0.5);
        }
        
        .medal-3 {
          background-color: #cd7f32; /* Бронза */
          box-shadow: 0 0 10px rgba(205, 127, 50, 0.5);
        }
        
        .top-1 {
          background-color: rgba(255, 215, 0, 0.1);
        }
        
        .top-2 {
          background-color: rgba(192, 192, 192, 0.1);
        }
        
        .top-3 {
          background-color: rgba(205, 127, 50, 0.1);
        }
        
        .player-column {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .user-icon {
          color: #666;
        }
        
        .player-name {
          font-weight: 500;
        }
        
        .winnings-column,
        .max-win-column {
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .coin-icon {
          color: #ffc107;
        }
        
        .win-rate-column {
          font-weight: 500;
        }
        
        .date-column {
          white-space: nowrap;
          width: 140px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .clock-icon {
          color: #666;
        }
        
        .no-data {
          padding: 3rem;
          text-align: center;
          color: #666;
          font-style: italic;
        }
        
        .leaderboard-loading,
        .leaderboard-error {
          padding: 2rem;
          text-align: center;
          color: #666;
        }
        
        @media (max-width: 768px) {
          .leaderboard-table th,
          .leaderboard-table td {
            padding: 0.8rem 0.5rem;
            font-size: 0.9rem;
          }
          
          .date-column {
            display: none;
          }
          
          .leaderboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .filter-controls {
            width: 100%;
          }
          
          .time-filter {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Leaderboard; 