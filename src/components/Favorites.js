import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { FaStar, FaRegStar, FaTrash, FaGamepad, FaHistory, FaListAlt, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

function Favorites({ userId }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentGames, setRecentGames] = useState([]);

  useEffect(() => {
    if (userId) {
      loadFavorites();
      loadRecentGames();
    }
  }, [userId]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const userFavoritesRef = doc(db, 'users', userId, 'gamePreferences', 'favorites');
      const favoritesDoc = await getDoc(userFavoritesRef);
      
      if (favoritesDoc.exists()) {
        setFavorites(favoritesDoc.data().games || []);
      } else {
        // Создаем документ, если он не существует
        await setDoc(userFavoritesRef, { games: [] });
        setFavorites([]);
      }
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке избранного:', err);
      setError('Не удалось загрузить избранные игры');
      toast.error('Ошибка при загрузке избранных игр');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentGames = async () => {
    try {
      const userRecentRef = doc(db, 'users', userId, 'gamePreferences', 'recent');
      const recentDoc = await getDoc(userRecentRef);
      
      if (recentDoc.exists()) {
        setRecentGames(recentDoc.data().games || []);
      } else {
        await setDoc(userRecentRef, { games: [] });
        setRecentGames([]);
      }
    } catch (err) {
      console.error('Ошибка при загрузке недавних игр:', err);
    }
  };

  const addToFavorites = async (game) => {
    try {
      const userFavoritesRef = doc(db, 'users', userId, 'gamePreferences', 'favorites');
      
      // Проверяем, не добавлена ли уже игра в избранное
      if (favorites.some(fav => fav.id === game.id)) {
        toast.info('Игра уже добавлена в избранное');
        return;
      }
      
      // Добавляем игру в избранное
      await updateDoc(userFavoritesRef, {
        games: arrayUnion(game)
      });
      
      setFavorites([...favorites, game]);
      toast.success('Игра добавлена в избранное');
    } catch (err) {
      console.error('Ошибка при добавлении в избранное:', err);
      toast.error('Ошибка при добавлении игры в избранное');
    }
  };

  const removeFromFavorites = async (gameId) => {
    try {
      const userFavoritesRef = doc(db, 'users', userId, 'gamePreferences', 'favorites');
      const gameToRemove = favorites.find(game => game.id === gameId);
      
      if (!gameToRemove) {
        toast.error('Игра не найдена в избранном');
        return;
      }
      
      // Удаляем игру из избранного
      await updateDoc(userFavoritesRef, {
        games: arrayRemove(gameToRemove)
      });
      
      setFavorites(favorites.filter(game => game.id !== gameId));
      toast.success('Игра удалена из избранного');
    } catch (err) {
      console.error('Ошибка при удалении из избранного:', err);
      toast.error('Ошибка при удалении игры из избранного');
    }
  };

  const recordGamePlay = async (game) => {
    try {
      const userRecentRef = doc(db, 'users', userId, 'gamePreferences', 'recent');
      
      // Проверяем, есть ли уже эта игра в недавних
      const existingIndex = recentGames.findIndex(g => g.id === game.id);
      let updatedRecentGames = [...recentGames];
      
      // Если игра уже есть, удаляем её из текущей позиции
      if (existingIndex !== -1) {
        updatedRecentGames.splice(existingIndex, 1);
      }
      
      // Добавляем игру в начало списка
      const gameWithTimestamp = {
        ...game,
        lastPlayed: new Date().toISOString()
      };
      updatedRecentGames = [gameWithTimestamp, ...updatedRecentGames];
      
      // Ограничиваем список 10 последними играми
      if (updatedRecentGames.length > 10) {
        updatedRecentGames = updatedRecentGames.slice(0, 10);
      }
      
      // Обновляем в Firestore
      await setDoc(userRecentRef, { games: updatedRecentGames });
      
      // Обновляем локальное состояние
      setRecentGames(updatedRecentGames);
    } catch (err) {
      console.error('Ошибка при записи игры в недавние:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="favorites-loading">Загрузка избранного...</div>;
  }

  return (
    <div className="favorites-container">
      <div className="section favorites-section">
        <h3 className="section-title">
          <FaStar className="section-icon" />
          Избранные игры
        </h3>
        
        {favorites.length > 0 ? (
          <div className="games-grid">
            {favorites.map(game => (
              <div key={game.id} className="game-card">
                <div className="game-header">
                  <FaGamepad className="game-icon" style={{ color: game.color || '#4caf50' }} />
                  <h4 className="game-title">{game.name}</h4>
                </div>
                <div className="game-actions">
                  <Link to={game.path} className="play-button">
                    Играть
                  </Link>
                  <button 
                    className="remove-button" 
                    onClick={() => removeFromFavorites(game.id)}
                    title="Удалить из избранного"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>У вас пока нет избранных игр</p>
            <p className="hint">Добавьте игры в избранное, чтобы быстро находить их</p>
          </div>
        )}
      </div>
      
      {recentGames.length > 0 && (
        <div className="section recent-section">
          <h3 className="section-title">
            <FaHistory className="section-icon" />
            Недавние игры
          </h3>
          <div className="recent-games-list">
            {recentGames.map(game => (
              <div key={game.id} className="recent-game-item">
                <div className="recent-game-info">
                  <FaGamepad className="game-icon" style={{ color: game.color || '#4caf50' }} />
                  <div className="recent-game-details">
                    <h4 className="game-title">{game.name}</h4>
                    <span className="last-played">
                      Последняя игра: {formatDate(game.lastPlayed)}
                    </span>
                  </div>
                </div>
                <div className="recent-game-actions">
                  <Link to={game.path} className="play-button small">
                    Играть
                  </Link>
                  {!favorites.some(fav => fav.id === game.id) ? (
                    <button 
                      className="favorite-button" 
                      onClick={() => addToFavorites(game)}
                      title="Добавить в избранное"
                    >
                      <FaRegStar />
                    </button>
                  ) : (
                    <button 
                      className="favorite-button active" 
                      onClick={() => removeFromFavorites(game.id)}
                      title="Удалить из избранного"
                    >
                      <FaStar />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .favorites-container {
          margin-bottom: 2rem;
        }
        
        .section {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          margin-bottom: 1.5rem;
          padding: 1.5rem;
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #1a237e;
          margin-top: 0;
          margin-bottom: 1.2rem;
          font-size: 1.2rem;
        }
        
        .section-icon {
          color: #ffc107;
        }
        
        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }
        
        .game-card {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .game-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .game-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .game-icon {
          font-size: 1.2rem;
        }
        
        .game-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
          color: #333;
        }
        
        .game-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: auto;
        }
        
        .play-button {
          flex: 1;
          padding: 0.5rem 1rem;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        
        .play-button:hover {
          background-color: #43a047;
        }
        
        .play-button.small {
          padding: 0.3rem 0.8rem;
          font-size: 0.9rem;
        }
        
        .remove-button,
        .favorite-button {
          background: none;
          border: none;
          color: #757575;
          font-size: 1rem;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s, color 0.2s;
        }
        
        .remove-button:hover {
          background-color: rgba(244, 67, 54, 0.1);
          color: #f44336;
        }
        
        .favorite-button:hover {
          background-color: rgba(255, 193, 7, 0.1);
          color: #ffc107;
        }
        
        .favorite-button.active {
          color: #ffc107;
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          background-color: #f5f5f5;
          border-radius: 8px;
          color: #757575;
        }
        
        .empty-state p {
          margin: 0;
        }
        
        .hint {
          font-size: 0.9rem;
          margin-top: 0.5rem !important;
          opacity: 0.8;
        }
        
        .recent-games-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .recent-game-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 0.8rem 1rem;
        }
        
        .recent-game-info {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        
        .recent-game-details {
          display: flex;
          flex-direction: column;
        }
        
        .last-played {
          font-size: 0.8rem;
          color: #757575;
        }
        
        .recent-game-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .favorites-loading {
          text-align: center;
          padding: 2rem;
          color: #757575;
        }
        
        @media (max-width: 768px) {
          .games-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }
          
          .recent-game-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.8rem;
          }
          
          .recent-game-actions {
            width: 100%;
            justify-content: space-between;
          }
          
          .play-button.small {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default Favorites; 