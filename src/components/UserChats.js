import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getItemChatMessages } from '../firebase';

function UserChats({ userId }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadUserChats();
    }
  }, [userId]);

  const loadUserChats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем все сообщения для пользователя
      const result = await getItemChatMessages(null, userId);
      
      if (!result.success) {
        setError(result.error || 'Не удалось загрузить чаты');
        setLoading(false);
        return;
      }
      
      // Группируем сообщения по itemId
      const chatsByItem = {};
      
      result.messages.forEach(message => {
        if (!chatsByItem[message.itemId]) {
          chatsByItem[message.itemId] = [];
        }
        chatsByItem[message.itemId].push(message);
      });
      
      // Формируем список чатов с последним сообщением
      const chatsList = Object.keys(chatsByItem).map(itemId => {
        const messages = chatsByItem[itemId];
        // Сортируем сообщения по времени
        messages.sort((a, b) => {
          const timeA = a.timestamp ? (a.timestamp.seconds ? a.timestamp.seconds : a.timestamp.getTime()) : 0;
          const timeB = b.timestamp ? (b.timestamp.seconds ? b.timestamp.seconds : b.timestamp.getTime()) : 0;
          return timeB - timeA; // Сортировка по убыванию (новые сначала)
        });
        
        // Получаем последнее сообщение
        const lastMessage = messages[0];
        
        // Считаем непрочитанные сообщения
        const unreadCount = messages.filter(msg => 
          msg.senderId !== userId && !msg.read
        ).length;
        
        return {
          itemId,
          lastMessage,
          unreadCount,
          messages
        };
      });
      
      // Сортируем чаты по времени последнего сообщения
      chatsList.sort((a, b) => {
        const timeA = a.lastMessage.timestamp ? 
          (a.lastMessage.timestamp.seconds ? a.lastMessage.timestamp.seconds : a.lastMessage.timestamp.getTime()) : 0;
        const timeB = b.lastMessage.timestamp ? 
          (b.lastMessage.timestamp.seconds ? b.lastMessage.timestamp.seconds : b.lastMessage.timestamp.getTime()) : 0;
        return timeB - timeA;
      });
      
      setChats(chatsList);
    } catch (err) {
      console.error('Ошибка при загрузке чатов:', err);
      setError('Произошла ошибка при загрузке чатов');
    } finally {
      setLoading(false);
    }
  };

  // Форматирование даты
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Неизвестно';
    
    const date = timestamp.seconds ? 
      new Date(timestamp.seconds * 1000) : 
      (timestamp instanceof Date ? timestamp : new Date());
    
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="user-chats">
      <h2>Мои обсуждения</h2>
      
      {loading && <div className="loading">Загрузка чатов...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && chats.length === 0 && (
        <div className="no-chats">У вас пока нет обсуждений</div>
      )}
      
      <div className="chats-list">
        {chats.map(chat => (
          <Link 
            to={`/market?item=${chat.itemId}&chat=true`} 
            key={chat.itemId}
            className={`chat-item ${chat.unreadCount > 0 ? 'unread' : ''}`}
          >
            <div className="chat-info">
              <div className="chat-header">
                <span className="item-id">Товар #{chat.itemId.substring(0, 8)}</span>
                <span className="chat-date">{formatDate(chat.lastMessage.timestamp)}</span>
              </div>
              <div className="last-message">
                <span className="sender">{chat.lastMessage.senderName || 'Пользователь'}:</span>
                <span className="text">{chat.lastMessage.text}</span>
              </div>
            </div>
            {chat.unreadCount > 0 && (
              <div className="unread-badge">{chat.unreadCount}</div>
            )}
          </Link>
        ))}
      </div>
      
      <style jsx>{`
        .user-chats {
          background: #fff;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #333;
          font-size: 1.5rem;
        }
        
        .loading, .error, .no-chats {
          padding: 16px;
          text-align: center;
          color: #666;
        }
        
        .error {
          color: #e53935;
        }
        
        .chats-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .chat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-radius: 6px;
          background: #f5f5f5;
          text-decoration: none;
          color: inherit;
          transition: background-color 0.2s;
        }
        
        .chat-item:hover {
          background: #e0e0e0;
        }
        
        .chat-item.unread {
          background: #e3f2fd;
        }
        
        .chat-item.unread:hover {
          background: #bbdefb;
        }
        
        .chat-info {
          flex: 1;
        }
        
        .chat-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .item-id {
          font-weight: bold;
          color: #1976d2;
        }
        
        .chat-date {
          font-size: 0.8rem;
          color: #757575;
        }
        
        .last-message {
          display: flex;
          gap: 6px;
          font-size: 0.9rem;
        }
        
        .sender {
          font-weight: 500;
        }
        
        .text {
          color: #555;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        
        .unread-badge {
          background: #f44336;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}

export default UserChats; 