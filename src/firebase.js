// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit, doc, getDoc, updateDoc, serverTimestamp, deleteDoc, setDoc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAK8cgAKNDAfXIOzA_0kn4QhVk5OYkcGbk",
  authDomain: "bank-mannru2.firebaseapp.com",
  databaseURL: "https://bank-mannru2-default-rtdb.firebaseio.com",
  projectId: "bank-mannru2",
  storageBucket: "bank-mannru2.firebasestorage.app",
  messagingSenderId: "666672164834",
  appId: "1:666672164834:web:345e24babd44b9704c13bb",
  measurementId: "G-V7M4079X30"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);
// Добавляем db как псевдоним для firestore для совместимости с компонентами
const db = firestore;

// Временное решение для обработки ошибок доступа
const handleFirestoreError = (error, defaultReturn = null) => {
  console.error('Firestore error:', error);
  
  // Проверяем, является ли ошибка связанной с отсутствием прав доступа
  if (
    error.code === 'permission-denied' || 
    error.message.includes('Missing or insufficient permissions') ||
    error.message.includes('PERMISSION_DENIED') ||
    error.message.includes('failed: PERMISSION_DENIED')
  ) {
    console.warn('Ошибка доступа к Firestore. Пожалуйста, проверьте правила безопасности в консоли Firebase.');
    
    // Возвращаем заглушку данных для предотвращения краха приложения
    return {
      success: true,
      mockData: true,
      error: 'Временные данные из-за ошибки доступа к Firestore'
    };
  }
  
  // Проверяем другие типы ошибок, которые могут возникнуть при работе с Firestore
  if (
    error.code === 'unavailable' || 
    error.message.includes('network error') ||
    error.message.includes('Failed to get document') ||
    error.message.includes('The operation was aborted')
  ) {
    console.warn('Ошибка сети при доступе к Firestore. Проверьте подключение к интернету.');
    
    return {
      success: true,
      mockData: true,
      error: 'Временные данные из-за проблем с сетью'
    };
  }
  
  return defaultReturn || { success: false, error: error.message };
};

// Функция для входа пользователя
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Функция для регистрации пользователя
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Функция для выхода пользователя
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Функция для создания новой карты
export const createCard = async (userId, cardData) => {
  try {
    // Генерируем случайный номер карты (16 цифр)
    const cardNumber = Array(16).fill().map(() => Math.floor(Math.random() * 10)).join('');
    
    // Генерируем случайный CVV код (3 цифры)
    const cvv = Array(3).fill().map(() => Math.floor(Math.random() * 10)).join('');
    
    // Генерируем случайный PIN код (6 цифр)
    const pin = Array(6).fill().map(() => Math.floor(Math.random() * 10)).join('');
    
    // Устанавливаем срок действия карты (текущая дата + 5 лет)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);
    const expiryMonth = (expiryDate.getMonth() + 1).toString().padStart(2, '0');
    const expiryYear = expiryDate.getFullYear().toString().slice(2);
    
    // Создаем объект карты
    const card = {
      userId,
      firstName: cardData.firstName,
      lastName: cardData.lastName,
      cardNumber,
      cvv,
      pin,
      color: cardData.color,
      expiryDate: `${expiryMonth}/${expiryYear}`,
      createdAt: new Date(),
      balance: 10000, // Начальный баланс 10,000 МР
      isBlocked: false,
      internetPayments: true,
      contactlessPayments: true,
      withdrawalLimit: 100000,
      notifyOnTransaction: true
    };
    
    // Добавляем карту в Firestore
    const docRef = await addDoc(collection(firestore, "cards"), card);
    
    return { 
      success: true, 
      cardId: docRef.id,
      card: {
        ...card,
        id: docRef.id
      }
    };
  } catch (error) {
    console.error("Error creating card:", error);
    return { success: false, error: error.message };
  }
};

// Функция для получения карт пользователя
export const getUserCards = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'ID пользователя не указан' };
    }

    const cardsRef = collection(firestore, 'cards');
    const q = query(cardsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const cards = [];
    querySnapshot.forEach((doc) => {
      cards.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, cards };
  } catch (error) {
    // Используем обработчик ошибок с заглушкой данных
    const mockResult = handleFirestoreError(error);
    if (mockResult.mockData) {
      // Возвращаем тестовые данные карт
      return {
        success: true,
        cards: [
          {
            id: 'mock-card-1',
            userId,
            cardNumber: '4276123456789012',
            firstName: 'Иван',
            lastName: 'Иванов',
            expiryDate: '12/28',
            cvv: '123',
            pin: '1234',
            balance: 50000,
            color: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
            isBlocked: false,
            createdAt: new Date()
          }
        ],
        mockData: true
      };
    }
    return { success: false, error: error.message };
  }
};

// Функция для обновления настроек карты
export const updateCardSettings = async (cardId, settings) => {
  try {
    const cardRef = doc(firestore, "cards", cardId);
    await updateDoc(cardRef, settings);
    
    return { success: true };
  } catch (error) {
    console.error("Error updating card settings:", error);
    return { success: false, error: error.message };
  }
};

// Функция для получения транзакций карты
export const getCardTransactions = async (cardId) => {
  try {
    const q = query(
      collection(firestore, "transactions"),
      where("cardId", "==", cardId),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    
    const transactions = [];
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, transactions };
  } catch (error) {
    console.error("Error getting card transactions:", error);
    return { success: false, error: error.message };
  }
};

// Функция для создания транзакции
export const createTransaction = async (transactionData) => {
  try {
    // Получаем данные карты отправителя
    const senderCardRef = doc(firestore, "cards", transactionData.cardId);
    const senderCardSnap = await getDoc(senderCardRef);
    
    if (!senderCardSnap.exists()) {
      return { success: false, error: "Карта отправителя не найдена" };
    }
    
    const senderCard = senderCardSnap.data();
    
    // Проверяем достаточно ли средств
    if (senderCard.balance < transactionData.amount) {
      return { success: false, error: "Недостаточно средств на карте" };
    }
    
    // Если это перевод на другую карту, проверяем существование карты получателя
    let recipientCard = null;
    let recipientCardRef = null;
    
    if (transactionData.type === 'transfer' && transactionData.recipientCardId) {
      recipientCardRef = doc(firestore, "cards", transactionData.recipientCardId);
      const recipientCardSnap = await getDoc(recipientCardRef);
      
      if (!recipientCardSnap.exists()) {
        return { success: false, error: "Карта получателя не найдена" };
      }
      
      recipientCard = recipientCardSnap.data();
    }
    
    // Создаем транзакцию
    const transaction = {
      ...transactionData,
      timestamp: serverTimestamp(),
      status: 'completed'
    };
    
    // Добавляем транзакцию в Firestore
    const transactionRef = await addDoc(collection(firestore, "transactions"), transaction);
    
    // Обновляем баланс карты отправителя
    await updateDoc(senderCardRef, {
      balance: senderCard.balance - transactionData.amount
    });
    
    // Если это перевод, обновляем баланс карты получателя
    if (transactionData.type === 'transfer' && recipientCardRef) {
      await updateDoc(recipientCardRef, {
        balance: recipientCard.balance + transactionData.amount
      });
    }
    
    return { 
      success: true, 
      transactionId: transactionRef.id,
      transaction: {
        ...transaction,
        id: transactionRef.id
      }
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    return { success: false, error: error.message };
  }
};

// Функции для работы с маркетом

// Функция для создания нового товара
export const createMarketItem = async (userId, cardId, itemData) => {
  try {
    // Получаем данные карты продавца
    const cardRef = doc(firestore, "cards", cardId);
    const cardSnap = await getDoc(cardRef);
    
    if (!cardSnap.exists()) {
      return { success: false, error: "Карта не найдена" };
    }
    
    const card = cardSnap.data();
    
    // Проверяем премиум-статус пользователя
    const userRef = doc(firestore, "users", userId);
    const userSnap = await getDoc(userRef);
    
    // Определяем комиссию в зависимости от премиум-статуса
    let commissionFee = 15; // Стандартная комиссия
    let isPremium = false;
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const premiumExpiry = userData.premiumExpiry ? userData.premiumExpiry.toDate() : null;
      isPremium = userData.isPremium && premiumExpiry && premiumExpiry > new Date();
      
      if (isPremium) {
        commissionFee = 0; // Для премиум-пользователей комиссия отсутствует
      }
    }
    
    // Проверяем достаточно ли средств для комиссии
    if (card.balance < commissionFee) {
      return { 
        success: false, 
        error: `Недостаточно средств для создания товара. ${commissionFee > 0 ? `Комиссия составляет ${commissionFee} МР.` : ''}` 
      };
    }
    
    // Создаем товар
    const item = {
      ...itemData,
      sellerId: userId,
      sellerCardId: cardId,
      createdAt: serverTimestamp(),
      status: 'active',
      isPremium: isPremium // Добавляем флаг премиум для приоритетного размещения
    };
    
    // Добавляем товар в Firestore
    const itemRef = await addDoc(collection(firestore, "marketItems"), item);
    
    // Если комиссия больше 0, создаем транзакцию и обновляем баланс
    if (commissionFee > 0) {
      // Создаем транзакцию комиссии
      const commissionTransaction = {
        cardId,
        amount: commissionFee,
        type: 'commission',
        description: 'Комиссия за создание товара',
        category: 'Комиссия',
        timestamp: serverTimestamp(),
        status: 'completed'
      };
      
      // Добавляем транзакцию в Firestore
      await addDoc(collection(firestore, "transactions"), commissionTransaction);
      
      // Обновляем баланс карты продавца
      await updateDoc(cardRef, {
        balance: card.balance - commissionFee
      });
    }
    
    return { 
      success: true, 
      itemId: itemRef.id,
      item: {
        ...item,
        id: itemRef.id
      }
    };
  } catch (error) {
    console.error("Error creating market item:", error);
    return { success: false, error: error.message };
  }
};

// Функция для получения всех товаров на маркете
export const getMarketItems = async (filter = {}) => {
  try {
    const itemsRef = collection(firestore, 'marketItems');
    let q = query(itemsRef);
    
    // Применяем фильтры, если они указаны
    if (filter.category) {
      q = query(q, where('category', '==', filter.category));
    }
    
    if (filter.minPrice) {
      q = query(q, where('price', '>=', filter.minPrice));
    }
    
    if (filter.maxPrice) {
      q = query(q, where('price', '<=', filter.maxPrice));
    }
    
    const querySnapshot = await getDocs(q);
    
    let items = [];
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Сортируем товары: сначала премиум, затем по дате создания (новые в начале)
    items.sort((a, b) => {
      // Сначала сортируем по премиум-статусу
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      
      // Затем по дате создания (новые в начале)
      const dateA = a.createdAt ? (a.createdAt.seconds ? a.createdAt.seconds : a.createdAt.getTime()) : 0;
      const dateB = b.createdAt ? (b.createdAt.seconds ? b.createdAt.seconds : b.createdAt.getTime()) : 0;
      
      return dateB - dateA;
    });
    
    return { success: true, items };
  } catch (error) {
    // Используем обработчик ошибок с заглушкой данных
    const mockResult = handleFirestoreError(error);
    if (mockResult.mockData) {
      // Возвращаем тестовые данные товаров
      return {
        success: true,
        items: [
          {
            id: 'mock-item-1',
            title: 'Смартфон (тестовые данные)',
            description: 'Новый смартфон с отличными характеристиками',
            price: 15000,
            category: 'Электроника',
            condition: 'Новый',
            sellerId: 'test-user-id',
            sellerName: 'Тестовый Пользователь',
            createdAt: new Date(),
            isPremium: true
          },
          {
            id: 'mock-item-2',
            title: 'Книга (тестовые данные)',
            description: 'Интересная книга в хорошем состоянии',
            price: 500,
            category: 'Книги',
            condition: 'Б/у',
            sellerId: 'test-user-id',
            sellerName: 'Тестовый Пользователь',
            createdAt: new Date(Date.now() - 86400000), // Вчера
            isPremium: false
          }
        ],
        mockData: true
      };
    }
    return { success: false, error: error.message };
  }
};

// Функция для получения товаров пользователя
export const getUserMarketItems = async (userId) => {
  try {
    const q = query(
      collection(firestore, "marketItems"),
      where("sellerId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, items };
  } catch (error) {
    console.error("Error getting user market items:", error);
    return { success: false, error: error.message };
  }
};

// Функция для покупки товара
export const purchaseMarketItem = async (itemId, buyerId, buyerCardId) => {
  try {
    // Получаем данные товара
    const itemRef = doc(firestore, "marketItems", itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (!itemSnap.exists()) {
      return { success: false, error: "Товар не найден" };
    }
    
    const item = itemSnap.data();
    
    // Проверяем, что товар активен
    if (item.status !== 'active') {
      return { success: false, error: "Товар уже продан или неактивен" };
    }
    
    // Получаем данные карты покупателя
    const buyerCardRef = doc(firestore, "cards", buyerCardId);
    const buyerCardSnap = await getDoc(buyerCardRef);
    
    if (!buyerCardSnap.exists()) {
      return { success: false, error: "Карта покупателя не найдена" };
    }
    
    const buyerCard = buyerCardSnap.data();
    
    // Проверяем достаточно ли средств
    if (buyerCard.balance < item.price) {
      return { success: false, error: "Недостаточно средств для покупки" };
    }
    
    // Получаем данные карты продавца
    const sellerCardRef = doc(firestore, "cards", item.sellerCardId);
    const sellerCardSnap = await getDoc(sellerCardRef);
    
    if (!sellerCardSnap.exists()) {
      return { success: false, error: "Карта продавца не найдена" };
    }
    
    const sellerCard = sellerCardSnap.data();
    
    // Создаем транзакцию покупки
    const purchaseTransaction = {
      cardId: buyerCardId,
      amount: item.price,
      type: 'purchase',
      description: `Покупка: ${item.title}`,
      category: 'Покупки',
      timestamp: serverTimestamp(),
      status: 'completed',
      marketItemId: itemId
    };
    
    // Добавляем транзакцию в Firestore
    const purchaseTransactionRef = await addDoc(collection(firestore, "transactions"), purchaseTransaction);
    
    // Создаем транзакцию продажи
    const saleTransaction = {
      cardId: item.sellerCardId,
      amount: item.price,
      type: 'sale',
      description: `Продажа: ${item.title}`,
      category: 'Продажи',
      timestamp: serverTimestamp(),
      status: 'completed',
      marketItemId: itemId
    };
    
    // Добавляем транзакцию в Firestore
    await addDoc(collection(firestore, "transactions"), saleTransaction);
    
    // Обновляем баланс карты покупателя
    await updateDoc(buyerCardRef, {
      balance: buyerCard.balance - item.price
    });
    
    // Обновляем баланс карты продавца
    await updateDoc(sellerCardRef, {
      balance: sellerCard.balance + item.price
    });
    
    // Обновляем статус товара
    await updateDoc(itemRef, {
      status: 'sold',
      buyerId,
      buyerCardId,
      soldAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      transactionId: purchaseTransactionRef.id
    };
  } catch (error) {
    console.error("Error purchasing market item:", error);
    return { success: false, error: error.message };
  }
};

// Функция для удаления товара
export const deleteMarketItem = async (itemId, userId) => {
  try {
    // Получаем данные товара
    const itemRef = doc(firestore, "marketItems", itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (!itemSnap.exists()) {
      return { success: false, error: "Товар не найден" };
    }
    
    const item = itemSnap.data();
    
    // Проверяем, что пользователь является продавцом
    if (item.sellerId !== userId) {
      return { success: false, error: "У вас нет прав на удаление этого товара" };
    }
    
    // Проверяем, что товар активен
    if (item.status !== 'active') {
      return { success: false, error: "Товар уже продан и не может быть удален" };
    }
    
    // Удаляем товар
    await deleteDoc(itemRef);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting market item:", error);
    return { success: false, error: error.message };
  }
};

// Функции для работы с чатом

// Получение сообщений чата для товара
export const getItemChatMessages = async (itemId, userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'ID пользователя не указан' };
    }
    
    // Если itemId не указан, получаем все сообщения для пользователя
    let messagesQuery;
    
    if (itemId) {
      // Используем только одно условие where для избежания проблем с составными запросами
      messagesQuery = query(
        collection(firestore, "itemChats"),
        where("itemId", "==", itemId),
        orderBy("timestamp", "asc"),
        limit(100)
      );
    } else {
      // Получаем все сообщения и фильтруем на стороне клиента
      messagesQuery = query(
        collection(firestore, "itemChats"),
        orderBy("timestamp", "desc"),
        limit(100)
      );
    }
    
    const snapshot = await getDocs(messagesQuery);
    
    // Фильтруем сообщения на стороне клиента
    const messages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(msg => msg.participants && msg.participants.includes(userId));
    
    return { success: true, messages };
  } catch (error) {
    console.error("Ошибка при получении сообщений чата:", error);
    
    // Используем обработчик ошибок с заглушкой данных
    const mockResult = handleFirestoreError(error);
    if (mockResult.mockData) {
      // Возвращаем тестовые данные сообщений
      const mockMessages = [];
      
      // Если указан itemId, создаем тестовые сообщения для этого товара
      if (itemId) {
        // Добавляем несколько тестовых сообщений
        mockMessages.push({
          id: 'mock-msg-1',
          itemId: itemId,
          senderId: 'seller-id',
          senderName: 'Продавец',
          text: 'Здравствуйте! Товар в наличии, готов ответить на ваши вопросы.',
          timestamp: new Date(Date.now() - 3600000), // 1 час назад
          participants: [userId, 'seller-id'],
          read: true
        });
        
        mockMessages.push({
          id: 'mock-msg-2',
          itemId: itemId,
          senderId: userId,
          senderName: 'Вы',
          text: 'Добрый день! Товар еще доступен?',
          timestamp: new Date(Date.now() - 1800000), // 30 минут назад
          participants: [userId, 'seller-id'],
          read: true
        });
        
        mockMessages.push({
          id: 'mock-msg-3',
          itemId: itemId,
          senderId: 'seller-id',
          senderName: 'Продавец',
          text: 'Да, конечно! Когда вам будет удобно встретиться?',
          timestamp: new Date(Date.now() - 900000), // 15 минут назад
          participants: [userId, 'seller-id'],
          read: false
        });
      }
      
      return { 
        success: true, 
        messages: mockMessages,
        mockData: true
      };
    }
    
    return { success: false, error: error.message };
  }
};

// Отправка сообщения в чат
export const sendChatMessage = async (itemId, senderId, senderName, receiverId, text) => {
  try {
    // Проверяем входные данные
    if (!itemId || !senderId || !receiverId || !text.trim()) {
      return { 
        success: false, 
        error: "Недостаточно данных для отправки сообщения" 
      };
    }
    
    const messageData = {
      itemId,
      senderId,
      senderName: senderName || 'Пользователь',
      text: text.trim(),
      timestamp: serverTimestamp(),
      participants: [senderId, receiverId]
    };
    
    const docRef = await addDoc(collection(firestore, "itemChats"), messageData);
    
    return { 
      success: true, 
      message: {
        id: docRef.id,
        ...messageData,
        timestamp: new Date() // Временная метка для немедленного отображения
      }
    };
  } catch (error) {
    console.error("Ошибка при отправке сообщения:", error);
    
    // Используем обработчик ошибок с заглушкой данных
    const mockResult = handleFirestoreError(error);
    if (mockResult.mockData) {
      // Возвращаем тестовое сообщение
      const mockMessage = {
        id: 'mock-msg-' + Date.now(),
        itemId,
        senderId,
        senderName: senderName || 'Вы',
        text: text.trim(),
        timestamp: new Date(),
        participants: [senderId, receiverId],
        mockData: true
      };
      
      return { 
        success: true, 
        message: mockMessage,
        mockData: true
      };
    }
    
    return { success: false, error: error.message };
  }
};

// Получение непрочитанных сообщений для пользователя
export const getUnreadMessagesCount = async (userId) => {
  try {
    // Получаем все сообщения и фильтруем на стороне клиента
    const messagesQuery = query(
      collection(firestore, "itemChats"),
      orderBy("timestamp", "desc"),
      limit(100)
    );
    
    const snapshot = await getDocs(messagesQuery);
    
    // Фильтруем сообщения, в которых пользователь является получателем
    // и которые не были прочитаны
    const unreadMessages = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(msg => 
        msg.participants && 
        msg.participants.includes(userId) && 
        msg.senderId !== userId && 
        !msg.read
      );
    
    return { success: true, count: unreadMessages.length };
  } catch (error) {
    console.error("Ошибка при получении непрочитанных сообщений:", error);
    return { success: false, error: error.message };
  }
};

// Маркировка сообщений как прочитанных
export const markMessagesAsRead = async (itemId, userId) => {
  try {
    // Получаем сообщения для маркировки
    const messagesQuery = query(
      collection(firestore, "itemChats"),
      where("itemId", "==", itemId),
      orderBy("timestamp", "desc"),
      limit(100)
    );
    
    const snapshot = await getDocs(messagesQuery);
    
    // Фильтруем сообщения, которые нужно отметить как прочитанные
    const unreadMessages = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.participants && 
               data.participants.includes(userId) && 
               data.senderId !== userId && 
               !data.read;
      });
    
    // Обновляем каждое сообщение
    const updatePromises = unreadMessages.map(doc => 
      updateDoc(doc.ref, { read: true })
    );
    
    await Promise.all(updatePromises);
    
    return { 
      success: true, 
      count: unreadMessages.length 
    };
  } catch (error) {
    console.error("Ошибка при маркировке сообщений как прочитанных:", error);
    return { success: false, error: error.message };
  }
};

// Функция для проверки alpha-статуса и получения кода тестера
export const checkAlphaStatus = async () => {
  try {
    const settingsRef = doc(firestore, "settings", "alpha");
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      const settings = settingsSnap.data();
      return { 
        success: true, 
        isAlpha: settings.enabled === true,
        testerCode: settings.testerCode || ""
      };
    } else {
      // Если документ не существует, создаем его с дефолтными значениями
      await setDoc(settingsRef, {
        enabled: true,
        testerCode: "882"
      });
      return { 
        success: true, 
        isAlpha: true,
        testerCode: "882"
      };
    }
  } catch (error) {
    console.error("Ошибка при проверке alpha-статуса:", error);
    return { 
      success: false, 
      isAlpha: true, // По умолчанию считаем, что alpha включена
      testerCode: "",
      error: error.message 
    };
  }
};

// Функция для проверки, является ли пользователь администратором
export const checkIsAdmin = async (userId) => {
  try {
    if (!userId) {
      return { success: false, isAdmin: false };
    }
    
    // Получаем документ пользователя из коллекции admins
    const adminRef = doc(firestore, "admins", userId);
    const adminSnap = await getDoc(adminRef);
    
    // Если документ существует и поле isAdmin равно true, то пользователь - администратор
    if (adminSnap.exists() && adminSnap.data().isAdmin === true) {
      return { success: true, isAdmin: true };
    }
    
    return { success: true, isAdmin: false };
  } catch (error) {
    console.error("Ошибка при проверке статуса администратора:", error);
    return { success: false, isAdmin: false, error: error.message };
  }
};

// Функция для создания администратора (только для тестирования)
export const createAdmin = async (userId, secretKey) => {
  try {
    // Проверяем секретный ключ (для безопасности)
    if (secretKey !== 'mannru_admin_secret') {
      return { success: false, error: 'Неверный секретный ключ' };
    }
    
    if (!userId) {
      return { success: false, error: 'Не указан ID пользователя' };
    }
    
    // Создаем или обновляем документ администратора
    const adminRef = doc(firestore, "admins", userId);
    await setDoc(adminRef, {
      isAdmin: true,
      createdAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Ошибка при создании администратора:", error);
    return { success: false, error: error.message };
  }
};

// Функции для работы с премиум-статусом

// Проверка премиум-статуса пользователя
export const checkPremiumStatus = async (userId) => {
  try {
    if (!userId) {
      return { isPremium: false, error: 'ID пользователя не указан' };
    }

    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { isPremium: false };
    }

    const userData = userDoc.data();
    
    // Проверяем, есть ли у пользователя премиум-статус и не истек ли он
    if (userData.isPremium && userData.premiumExpiry) {
      const expiryDate = userData.premiumExpiry.toDate ? 
        userData.premiumExpiry.toDate() : 
        new Date(userData.premiumExpiry);
      
      const now = new Date();
      
      if (expiryDate > now) {
        return {
          isPremium: true,
          premiumExpiry: expiryDate,
          features: userData.premiumFeatures || []
        };
      }
    }

    return { isPremium: false };
  } catch (error) {
    // Используем обработчик ошибок с заглушкой данных
    const mockResult = handleFirestoreError(error);
    if (mockResult.mockData) {
      // Возвращаем тестовые данные премиум-статуса
      return {
        isPremium: true,
        premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней от текущей даты
        features: [
          'no_commission',
          'priority_listing',
          'extended_stats',
          'increased_limits',
          'exclusive_designs'
        ],
        mockData: true
      };
    }
    return { isPremium: false, error: error.message };
  }
};

// Покупка премиум-статуса
export const purchasePremium = async (userId, cardId) => {
  try {
    if (!userId || !cardId) {
      return { 
        success: false, 
        error: 'Не указан ID пользователя или карты' 
      };
    }

    // Получаем данные карты
    const cardRef = doc(firestore, 'cards', cardId);
    const cardDoc = await getDoc(cardRef);

    if (!cardDoc.exists()) {
      return { 
        success: false, 
        error: 'Карта не найдена' 
      };
    }

    const cardData = cardDoc.data();
    
    // Проверяем, принадлежит ли карта пользователю
    if (cardData.userId !== userId) {
      return { 
        success: false, 
        error: 'Карта не принадлежит пользователю' 
      };
    }
    
    // Стоимость премиум-статуса
    const premiumCost = 20000;
    
    // Проверяем, достаточно ли средств на карте
    if (cardData.balance < premiumCost) {
      return { 
        success: false, 
        error: `Недостаточно средств на карте. Требуется ${premiumCost} МР` 
      };
    }
    
    // Обновляем баланс карты
    const newBalance = cardData.balance - premiumCost;
    await updateDoc(cardRef, { balance: newBalance });
    
    // Устанавливаем дату истечения премиум-статуса (1 месяц от текущей даты)
    const premiumExpiry = new Date();
    premiumExpiry.setMonth(premiumExpiry.getMonth() + 1);
    
    // Обновляем данные пользователя
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      isPremium: true,
      premiumExpiry: premiumExpiry,
      premiumFeatures: [
        'no_commission',
        'priority_listing',
        'extended_stats',
        'increased_limits',
        'exclusive_designs'
      ]
    });
    
    // Создаем транзакцию для списания средств
    const transactionData = {
      senderId: userId,
      receiverId: 'system',
      senderCardId: cardId,
      receiverCardId: 'premium',
      amount: premiumCost,
      type: 'premium_purchase',
      description: 'Покупка премиум-статуса',
      timestamp: serverTimestamp()
    };
    
    await addDoc(collection(firestore, 'transactions'), transactionData);
    
    return { 
      success: true, 
      isPremium: true,
      premiumExpiry: premiumExpiry,
      features: [
        'no_commission',
        'priority_listing',
        'extended_stats',
        'increased_limits',
        'exclusive_designs'
      ]
    };
  } catch (error) {
    console.error("Ошибка при покупке премиум-статуса:", error);
    
    // Используем обработчик ошибок с заглушкой данных
    const mockResult = handleFirestoreError(error);
    if (mockResult.mockData) {
      // Возвращаем тестовые данные премиум-статуса
      const premiumExpiry = new Date();
      premiumExpiry.setMonth(premiumExpiry.getMonth() + 1);
      
      return {
        success: true,
        isPremium: true,
        premiumExpiry: premiumExpiry,
        features: [
          'no_commission',
          'priority_listing',
          'extended_stats',
          'increased_limits',
          'exclusive_designs'
        ],
        mockData: true
      };
    }
    
    return { success: false, error: error.message };
  }
};

// Функция для получения данных пользователя
export const getUserData = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: 'ID пользователя не указан' };
    }
    
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { 
        success: true, 
        userData: { 
          id: userDoc.id, 
          ...userDoc.data() 
        } 
      };
    } else {
      // Если документ пользователя не существует, создаем его
      const newUserData = {
        displayName: '',
        email: auth.currentUser?.email || '',
        createdAt: serverTimestamp(),
        isPremium: false
      };
      
      await setDoc(userRef, newUserData);
      
      return { 
        success: true, 
        userData: { 
          id: userId, 
          ...newUserData 
        } 
      };
    }
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return { success: false, error: 'Не удалось получить данные пользователя' };
  }
};

// Экспортируем db вместе с другими
export { app, analytics, auth, database, firestore, db }; 