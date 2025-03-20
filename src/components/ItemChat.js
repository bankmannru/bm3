import React, { useState, useEffect, useRef } from 'react';
import { firestore } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { getItemChatMessages, sendChatMessage, markMessagesAsRead } from '../firebase';

function ItemChat({ itemId, userId, userName, sellerId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const [isSending, setIsSending] = useState(false);

  // Загрузка сообщений при монтировании компонента и настройка подписки на обновления
  useEffect(() => {
    if (itemId && userId) {
      setLoading(true);
      setError(null);
      
      // Сначала загружаем сообщения через функцию с обработкой ошибок
      getItemChatMessages(itemId, userId)
        .then(result => {
          if (result.success) {
            setMessages(result.messages);
            setLoading(false);
            
            // Если это тестовые данные, не настраиваем подписку
            if (result.mockData) {
              console.log('Используются тестовые данные для чата из-за проблем с доступом к Firestore');
              return;
            }
            
            // Настраиваем подписку только если получили реальные данные
            setupChatSubscription();
          } else {
            setError(result.error || 'Не удалось загрузить сообщения');
            setLoading(false);
          }
        })
        .catch(err => {
          console.error('Ошибка при загрузке сообщений:', err);
          setError('Произошла ошибка при загрузке сообщений');
          setLoading(false);
        });
    }
    
    // Функция для настройки подписки на обновления чата
    const setupChatSubscription = () => {
      try {
        // Создаем запрос для получения сообщений
        const messagesQuery = query(
          collection(firestore, "itemChats"),
          where("itemId", "==", itemId),
          orderBy("timestamp", "asc"),
          limit(100)
        );
        
        // Подписываемся на обновления сообщений в реальном времени
        const unsubscribe = onSnapshot(messagesQuery, 
          (snapshot) => {
            // Фильтруем сообщения на стороне клиента
            const updatedMessages = snapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
              .filter(msg => msg.participants && msg.participants.includes(userId));
            
            setMessages(updatedMessages);
            setLoading(false);
            
            // Маркируем сообщения как прочитанные при получении новых
            markMessagesAsRead(itemId, userId).catch(err => {
              console.error('Ошибка при маркировке сообщений как прочитанных:', err);
            });
            
            // Прокручиваем к последнему сообщению при получении новых
            setTimeout(scrollToBottom, 100);
          },
          (err) => {
            console.error('Ошибка при подписке на обновления сообщений:', err);
            
            // Проверяем, связана ли ошибка с доступом
            if (
              err.code === 'permission-denied' || 
              err.message.includes('Missing or insufficient permissions') ||
              err.message.includes('PERMISSION_DENIED')
            ) {
              setError('Ошибка доступа к данным. Используются тестовые данные.');
            } else {
              setError('Произошла ошибка при загрузке сообщений');
            }
            
            setLoading(false);
          }
        );
        
        // Возвращаем функцию отписки
        return unsubscribe;
      } catch (err) {
        console.error('Ошибка при настройке подписки на чат:', err);
        setError('Произошла ошибка при настройке обновлений чата');
        setLoading(false);
        return () => {}; // Возвращаем пустую функцию отписки
      }
    };
    
    // Отписываемся при размонтировании компонента
    let unsubscribe = () => {};
    if (!loading && !error) {
      unsubscribe = setupChatSubscription() || (() => {});
    }
    return () => unsubscribe();
  }, [itemId, userId]);
  
  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  // Отправка сообщения
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    
    try {
      const result = await sendChatMessage(
        itemId,
        userId,
        userName || 'Пользователь',
        sellerId,
        newMessage
      );
      
      if (result.success) {
        setNewMessage('');
        // Прокрутка к последнему сообщению произойдет автоматически 
        // благодаря подписке на обновления
      } else {
        setError(result.error || 'Не удалось отправить сообщение');
      }
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
      setError('Произошла ошибка при отправке сообщения');
    } finally {
      setIsSending(false);
    }
  };
  
  // Форматирование даты
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      let date;
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Ошибка при форматировании даты:', error);
      return '';
    }
  };

  return (
    <div className="item-chat" ref={chatRef}>
      <div className="chat-header">
        <h3>Обсуждение товара</h3>
      </div>
      
      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">Загрузка сообщений...</div>
        ) : error ? (
          <div className="chat-error">{error}</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            Нет сообщений. Начните обсуждение!
          </div>
        ) : (
          <div className="messages-container">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.senderId === userId ? 'own-message' : 'other-message'}`}
              >
                <div className="message-content">
                  <div className="message-sender">{message.senderName}</div>
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">{formatDate(message.timestamp)}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Введите сообщение..."
          disabled={isSending}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || isSending}
        >
          Отправить
        </button>
      </form>

      <style jsx>{`
        .item-chat {
          display: flex;
          flex-direction: column;
          height: 400px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
          margin-top: 1.5rem;
        }
        
        .chat-header {
          padding: 1rem;
          background-color: #1a237e;
          color: white;
        }
        
        .chat-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background-color: #f5f5f5;
        }
        
        .chat-loading,
        .chat-error,
        .chat-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #757575;
          text-align: center;
          font-style: italic;
        }
        
        .chat-error {
          color: #c62828;
        }
        
        .messages-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .message {
          max-width: 80%;
          margin-bottom: 0.5rem;
        }
        
        .own-message {
          align-self: flex-end;
        }
        
        .other-message {
          align-self: flex-start;
        }
        
        .message-content {
          padding: 0.75rem;
          border-radius: 8px;
          position: relative;
        }
        
        .own-message .message-content {
          background-color: #e3f2fd;
          border-bottom-right-radius: 0;
        }
        
        .other-message .message-content {
          background-color: white;
          border-bottom-left-radius: 0;
        }
        
        .message-sender {
          font-weight: 500;
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
          color: #1a237e;
        }
        
        .message-text {
          word-break: break-word;
        }
        
        .message-time {
          font-size: 0.7rem;
          color: #9e9e9e;
          text-align: right;
          margin-top: 0.25rem;
        }
        
        .chat-input {
          display: flex;
          padding: 0.75rem;
          background-color: white;
          border-top: 1px solid #e0e0e0;
        }
        
        .chat-input input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          font-size: 1rem;
          margin-right: 0.5rem;
        }
        
        .chat-input button {
          background-color: #1a237e;
          color: white;
          border: none;
          padding: 0 1.5rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .chat-input button:hover:not(:disabled) {
          background-color: #3f51b5;
        }
        
        .chat-input button:disabled {
          background-color: #c5cae9;
          cursor: not-allowed;
        }
        
        @media (max-width: 576px) {
          .message {
            max-width: 90%;
          }
          
          .chat-input {
            padding: 0.5rem;
          }
          
          .chat-input input {
            padding: 0.5rem;
          }
          
          .chat-input button {
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default ItemChat; 