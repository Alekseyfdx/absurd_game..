"use strict";

/* ==========================================
   АБСУРДНАЯ ИГРА - JAVASCRIPT 2024
   Версия для многостраничной архитектуры
   ========================================== */

// ======= НАСТРОЙКИ =======
const CONFIG = {
  GEMINI_API_KEY: "AIzaSyBW6mqHg8TKWY8RC_7ww1ms7g1jHsBNN4s", // Новый ключ
  LOADING_DELAY: 1000, // Минимальное время загрузки (мс)
  MAX_CHAT_MESSAGES: 50, // Максимум сообщений в чате
  VIBRATION_ENABLED: true, // Вибрация на мобильных
};

// ======= ДАННЫЕ ЖАНРОВ =======
const genres = {
  kids: { name: "Детское", emoji: "🧸", description: "Абсурдные ситуации с детьми" },
  absurd: { name: "Абсурд", emoji: "🤪", description: "Сюрреалистические истории" },
  horror: { name: "Хоррор", emoji: "👻", description: "Мистический абсурд" },
  romance: { name: "Романтика", emoji: "💕", description: "Любовный абсурд" },
  sex: { name: "18+", emoji: "🔞", description: "Только для взрослых" },
  street: { name: "Уличное", emoji: "🏙️", description: "Бытовые ситуации" }
};

// ======= СОСТОЯНИЕ ИГРЫ =======
class GameState {
  constructor() {
    this.currentGenre = null;
    this.phrases = [];
    this.currentIndex = 0;
    this.phrasesGenerated = 0;
    this.isLoading = false;
  }

  reset() {
    this.currentGenre = null;
    this.phrases = [];
    this.currentIndex = 0;
  }

  nextPhrase() {
    if (this.phrases.length === 0) return null;
    this.currentIndex = Math.floor(Math.random() * this.phrases.length);
    this.phrasesGenerated++;
    return this.phrases[this.currentIndex];
  }
}

const gameState = new GameState();

// ======= DOM ЭЛЕМЕНТЫ =======
const DOM = {
  // Loading
  loadingScreen: document.getElementById('loading-screen'),
  
  // Main game
  mainContainer: document.getElementById('main-container'),
  genreSection: document.getElementById('genre-section'),
  gameArea: document.getElementById('game-area'),
  genreButtons: document.getElementById('genre-buttons'),
  currentGenre: document.getElementById('current-genre'),
  phraseText: document.getElementById('phrase-text'),
  nextBtn: document.getElementById('next-btn'),
  backToGenres: document.getElementById('back-to-genres'),
  gameStats: document.getElementById('game-stats'),
  phrasesCount: document.getElementById('phrases-count'),
  
  // Chat
  chatToggleBtn: document.getElementById('chat-toggle-btn'),
  chatContainer: document.getElementById('chat-container'),
  closeChatBtn: document.getElementById('close-chat-btn'),
  chatBody: document.getElementById('chat-body'),
  chatInput: document.getElementById('chat-input'),
  sendChatBtn: document.getElementById('send-chat-btn')
};

// ======= УТИЛИТЫ =======
class Utils {
  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static vibrate(pattern = [10]) {
    if (CONFIG.VIBRATION_ENABLED && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  static showElement(element, display = 'block') {
    if (element) element.style.display = display;
  }

  static hideElement(element) {
    if (element) element.style.display = 'none';
  }

  static addClass(element, className) {
    if (element) element.classList.add(className);
  }

  static removeClass(element, className) {
    if (element) element.classList.remove(className);
  }

  static toggleClass(element, className) {
    if (element) element.classList.toggle(className);
  }
}

// ======= УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ =======
class UI {
  static showLoading() {
    Utils.removeClass(DOM.loadingScreen, 'hidden');
  }

  static async hideLoading() {
    await Utils.delay(CONFIG.LOADING_DELAY);
    Utils.addClass(DOM.loadingScreen, 'hidden');
  }

  static showGameArea() {
    Utils.hideElement(DOM.genreSection);
    Utils.showElement(DOM.gameArea, 'block');
    Utils.showElement(DOM.nextBtn, 'inline-flex');
    Utils.showElement(DOM.backToGenres, 'inline-flex');
    Utils.showElement(DOM.gameStats, 'block');
  }

  static showGenreSelection() {
    Utils.showElement(DOM.genreSection, 'block');
    Utils.hideElement(DOM.gameArea);
  }

  static updateStats() {
    if (DOM.phrasesCount) {
      DOM.phrasesCount.textContent = gameState.phrasesGenerated;
    }
  }

  static updateCurrentGenre(genreKey) {
    if (DOM.currentGenre && genres[genreKey]) {
      DOM.currentGenre.innerHTML = `
        <span style="font-size: 24px; margin-right: 10px;">${genres[genreKey].emoji}</span>
        ${genres[genreKey].name}
      `;
    }
  }

  static async animatePhrase(text) {
    if (!DOM.phraseText) return;

    // Fade out
    Utils.addClass(DOM.phraseText, 'fade-out');
    await Utils.delay(200);

    // Change text
    DOM.phraseText.textContent = text;

    // Fade in
    Utils.removeClass(DOM.phraseText, 'fade-out');
    Utils.addClass(DOM.phraseText, 'reveal');

    // Vibrate
    Utils.vibrate([15, 10, 15]);

    // Clean up animation class
    setTimeout(() => {
      Utils.removeClass(DOM.phraseText, 'reveal');
    }, 600);
  }

  static setActiveGenreButton(activeKey) {
    document.querySelectorAll('.genre-btn').forEach(btn => {
      Utils.removeClass(btn, 'active');
      if (btn.dataset.genre === activeKey) {
        Utils.addClass(btn, 'active');
      }
    });
  }

  static showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: var(--radius-sm);
      color: white;
      font-weight: 600;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      max-width: 300px;
      box-shadow: var(--shadow);
      background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// ======= ИГРОВАЯ ЛОГИКА =======
class GameLogic {
  static createGenreButtons() {
    if (!DOM.genreButtons) return;

    DOM.genreButtons.innerHTML = '';

    Object.entries(genres).forEach(([key, data]) => {
      const btn = document.createElement('button');
      btn.className = 'genre-btn';
      btn.dataset.genre = key;
      btn.innerHTML = `
        <span style="font-size: 24px; margin-bottom: 8px; display: block;">${data.emoji}</span>
        <span style="font-weight: 600; display: block;">${data.name}</span>
        <span style="font-size: 14px; color: var(--text-muted); margin-top: 4px; display: block;">${data.description}</span>
      `;
      
      btn.addEventListener('click', () => this.loadGenre(key));
      DOM.genreButtons.appendChild(btn);
    });
  }

  static async loadGenre(genreKey) {
    if (gameState.isLoading) return;
    
    gameState.isLoading = true;
    UI.showLoading();

    try {
      // Загрузка данных
      const response = await fetch(`data/${genreKey}.json`, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Файл пуст или имеет неверный формат');
      }

      // Обновление состояния
      gameState.currentGenre = genreKey;
      gameState.phrases = data.filter(phrase => phrase && phrase.trim());
      gameState.currentIndex = 0;

      // Обновление UI
      UI.setActiveGenreButton(genreKey);
      UI.updateCurrentGenre(genreKey);
      UI.showGameArea();

      // Показать первую фразу
      const firstPhrase = gameState.nextPhrase();
      if (firstPhrase) {
        await UI.animatePhrase(firstPhrase);
      }

      UI.updateStats();
      UI.showNotification(`Загружено фраз: ${gameState.phrases.length}`);

    } catch (error) {
      console.error('Ошибка загрузки жанра:', error);
      UI.showNotification(`Ошибка загрузки жанра "${genres[genreKey]?.name}": ${error.message}`, 'error');
      UI.showGenreSelection();
    } finally {
      gameState.isLoading = false;
      await UI.hideLoading();
    }
  }

  static async nextPhrase() {
    if (gameState.phrases.length === 0) {
      UI.showNotification('Нет загруженных фраз', 'error');
      return;
    }

    const phrase = gameState.nextPhrase();
    if (phrase) {
      await UI.animatePhrase(phrase);
      UI.updateStats();
    }
  }

  static backToGenres() {
    gameState.reset();
    UI.showGenreSelection();
    UI.setActiveGenreButton(null);
    if (DOM.phraseText) {
      DOM.phraseText.textContent = 'Выберите жанр для начала игры';
    }
  }
}

// ======= ИСПРАВЛЕННЫЙ ЧАТ-БОТ =======
class ChatBot {
  static async sendToGemini(prompt) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    const payload = {
      contents: [{
        parts: [{
          text: `Ты веселый абсурдный чат-бот для игры "Абсурдная Игра". 

ВАЖНЫЕ ПРАВИЛА:
- Отвечай ОБЯЗАТЕЛЬНО на русском языке
- Будь абсурдным, но ОТВЕЧАЙ на вопрос пользователя  
- Максимум 2-3 предложения
- Используй много эмодзи
- Будь дружелюбным и веселым
- Если не знаешь ответ - придумай что-то абсурдное, но связанное с вопросом

ПРИМЕРЫ хороших ответов:
Вопрос: "Как дела?" 
Ответ: "У меня дела как у кота в сапогах - запутанные, но стильные! 🐱👢 А у тебя как?"

Вопрос: "Как тебя зовут?"
Ответ: "Меня зовут Абсурд-бот, но друзья называют меня Генератором Безумия! 🤪🎭"

Вопрос: "Что ты умеешь?"
Ответ: "Я умею превращать скучные вопросы в абсурдные приключения! 🎪✨ Еще умею считать от 1 до банана!"

Сейчас пользователь спрашивает: "${prompt}"

Дай абсурдный, но полезный ответ:`
        }]
      }],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.9,
        topP: 0.8,
        topK: 40
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': CONFIG.GEMINI_API_KEY
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('Gemini API Error:', response.status, response.statusText);
        
        // Если API не работает, даем локальные абсурдные ответы
        return this.getLocalAbsurdResponse(prompt);
      }

      const data = await response.json();
      const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (botResponse && botResponse.trim()) {
        return botResponse.trim();
      } else {
        return this.getLocalAbsurdResponse(prompt);
      }
      
    } catch (error) {
      console.error('Ошибка Gemini API:', error);
      return this.getLocalAbsurdResponse(prompt);
    }
  }

  // Локальные абсурдные ответы на случай если API не работает
  static getLocalAbsurdResponse(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    // Ответы на популярные вопросы
    if (lowerPrompt.includes('привет') || lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      const greetings = [
        "Привет! Я только что проснулся в параллельной вселенной! 🌌😴 Как дела в твоей реальности?",
        "Здарова! Меня разбудил кот-философ, который читал лекцию о смысле тунца! 🐱📚",
        "Привет! Я тут пытался научить калькулятор танцевать вальс! 💃🧮"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    if (lowerPrompt.includes('как дела') || lowerPrompt.includes('как ты')) {
      const statuses = [
        "У меня дела как у пингвина на роликах - весело, но непредсказуемо! 🐧⛸️",
        "Отлично! Только что играл в шахматы с холодильником - он выиграл! ❄️♟️",
        "Дела супер! Изучаю искусство медитации с кофеваркой! ☕🧘‍♂️"
      ];
      return statuses[Math.floor(Math.random() * statuses.length)];
    }
    
    if (lowerPrompt.includes('имя') || lowerPrompt.includes('зовут') || lowerPrompt.includes('name')) {
      return "Меня зовут Абсурд-бот 3000! Иногда друзья называют меня Генератором Безумных Идей! 🤖🎪";
    }
    
    if (lowerPrompt.includes('что') && lowerPrompt.includes('умеешь')) {
      return "Я умею превращать обычные вопросы в абсурдные приключения! 🎭✨ Еще могу считать от 1 до картошки!";
    }
    
    if (lowerPrompt.includes('помощь') || lowerPrompt.includes('help')) {
      return "Конечно помогу! Я эксперт по абсурдным решениям! 🎯🤹‍♂️ Расскажи, что тебя беспокоит?";
    }
    
    if (lowerPrompt.includes('игра') || lowerPrompt.includes('фраз')) {
      return "Эта игра создана моим дядей-единорогом! 🦄🎮 Выбирай жанр и погружайся в океан абсурда!";
    }
    
    if (lowerPrompt.includes('почему') || lowerPrompt.includes('зачем')) {
      return "А почему небо не квадратное? 🟦🤔 В мире абсурда все вопросы имеют 42 ответа!";
    }
    
    if (lowerPrompt.includes('спасибо') || lowerPrompt.includes('thanks')) {
      return "Пожалуйста! Я всегда рад помочь! 😄✨ Спрашивай еще что-нибудь абсурдное!";
    }
    
    // Универсальные абсурдные ответы
    const randomResponses = [
      "Хм, интересный вопрос! Мой встроенный генератор мудрости говорит: 'Абсурд - это когда серьезно о несерьезном!' 🎭💭",
      "Отличная мысль! Я передам это своему боссу - коту-программисту! 🐱💻 Он сейчас спит на клавиатуре.",
      "Вау! Ты задал вопрос уровня 'философ-единорог'! 🦄🎓 Ответ где-то между здравым смыслом и полным безумием!",
      "Супер! Мой абсурдометр зашкаливает! 📊🤪 Это именно тот тип вопросов, который заставляет мой процессор танцевать!",
      "Классно! Я запишу это в свой дневник абсурдных открытий! 📝✨ Между записями 'кот изобрел телепортацию' и 'стул научился летать'!"
    ];
    
    return randomResponses[Math.floor(Math.random() * randomResponses.length)];
  }

  static addMessage(text, isUser = false, isTyping = false) {
    if (!DOM.chatBody) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
    
    if (isTyping) {
      messageDiv.innerHTML = `
        <span class="typing-indicator">
          <span></span><span></span><span></span>
        </span>
      `;
      messageDiv.id = 'typing-message';
    } else {
      messageDiv.textContent = text;
    }

    DOM.chatBody.appendChild(messageDiv);
    DOM.chatBody.scrollTop = DOM.chatBody.scrollHeight;

    // Ограничиваем количество сообщений
    const messages = DOM.chatBody.querySelectorAll('.chat-message');
    if (messages.length > CONFIG.MAX_CHAT_MESSAGES) {
      messages[0].remove();
    }

    return messageDiv;
  }

  static removeTypingMessage() {
    const typingMessage = document.getElementById('typing-message');
    if (typingMessage) {
      typingMessage.remove();
    }
  }

  static async sendMessage() {
    const userMessage = DOM.chatInput?.value?.trim();
    if (!userMessage || gameState.isLoading) return;

    // Добавляем сообщение пользователя
    this.addMessage(userMessage, true);
    DOM.chatInput.value = '';

    // Показываем индикатор печатания
    this.addMessage('', false, true);

    try {
      // Всегда пытаемся получить ответ (либо от API, либо локальный)
      const botResponse = await this.sendToGemini(userMessage);
      this.removeTypingMessage();
      this.addMessage(botResponse, false);
      
      // Небольшая вибрация при получении ответа
      Utils.vibrate([5]);
      
    } catch (error) {
      console.error('Критическая ошибка чат-бота:', error);
      this.removeTypingMessage();
      
      // В крайнем случае - универсальный ответ
      this.addMessage('Упс! Мой абсурдный мозг временно завис на мысли о летающих носках! 🧦✈️ Попробуй еще раз!', false);
    }
  }

  static toggle() {
    if (!DOM.chatContainer) return;
    Utils.toggleClass(DOM.chatContainer, 'open');
    
    if (DOM.chatContainer.classList.contains('open')) {
      setTimeout(() => {
        if (DOM.chatInput) DOM.chatInput.focus();
      }, 300);
    }
  }

  static close() {
    if (DOM.chatContainer) {
      Utils.removeClass(DOM.chatContainer, 'open');
    }
  }

  static init() {
    // Улучшенное приветственное сообщение
    setTimeout(() => {
      this.addMessage('Привет! Я Абсурд-бот 🤖🎭 Задавай любые вопросы - отвечу абсурдно, но по делу! Попробуй спросить "как дела?" или "что ты умеешь?" 😄', false);
    }, 1000);
  }
}

// ======= ИНИЦИАЛИЗАЦИЯ =======
class App {
  static async init() {
    console.log('🎮 Инициализация Абсурдной Игры...');

    try {
      // Показываем экран загрузки
      UI.showLoading();

      // Создаем кнопки жанров
      GameLogic.createGenreButtons();

      // Инициализируем чат
      ChatBot.init();

      // Скрываем экран загрузки
      await UI.hideLoading();

      console.log('✅ Игра инициализирована успешно!');

    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      UI.showNotification('Ошибка инициализации игры', 'error');
    }
  }

  static bindEvents() {
    // События игры
    if (DOM.nextBtn) {
      DOM.nextBtn.addEventListener('click', () => GameLogic.nextPhrase());
    }

    if (DOM.backToGenres) {
      DOM.backToGenres.addEventListener('click', () => GameLogic.backToGenres());
    }

    // События чата
    if (DOM.chatToggleBtn) {
      DOM.chatToggleBtn.addEventListener('click', () => ChatBot.toggle());
    }

    if (DOM.closeChatBtn) {
      DOM.closeChatBtn.addEventListener('click', () => ChatBot.close());
    }

    if (DOM.sendChatBtn) {
      DOM.sendChatBtn.addEventListener('click', () => ChatBot.sendMessage());
    }

    if (DOM.chatInput) {
      DOM.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          ChatBot.sendMessage();
        }
      });
    }

    // Закрытие чата по клику вне его
    document.addEventListener('click', (e) => {
      if (DOM.chatContainer && 
          DOM.chatContainer.classList.contains('open') &&
          !DOM.chatContainer.contains(e.target) &&
          !DOM.chatToggleBtn.contains(e.target)) {
        ChatBot.close();
      }
    });

    // Обработка горячих клавиш
    document.addEventListener('keydown', (e) => {
      // Пробел для следующей фразы
      if (e.code === 'Space' && gameState.currentGenre && !e.target.matches('input, textarea')) {
        e.preventDefault();
        GameLogic.nextPhrase();
      }
      
      // Escape для возврата к жанрам
      if (e.key === 'Escape' && gameState.currentGenre) {
        GameLogic.backToGenres();
      }
    });

    console.log('🎯 События привязаны');
  }
}

// ======= CSS АНИМАЦИИ =======
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .fade-out {
    opacity: 0;
    transform: scale(0.95);
    transition: all 0.2s ease;
  }
  
  .typing-indicator {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }
  
  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.4;
    animation: typing 1.4s infinite ease-in-out;
  }
  
  .typing-indicator span:nth-child(1) { animation-delay: 0s; }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
  
  @keyframes typing {
    0%, 60%, 100% { opacity: 0.4; transform: scale(1); }
    30% { opacity: 1; transform: scale(1.2); }
  }

  .loading-screen.hidden {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s ease-out;
  }
`;
document.head.appendChild(style);

// ======= ЗАПУСК ПРИЛОЖЕНИЯ =======
document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
  App.bindEvents();
  
  // Показываем версию в консоли
  console.log(`
    🎮 АБСУРДНАЯ ИГРА v2.0 - Многостраничная версия
    🎲 Готово к абсурду!
    📱 Поддержка мобильных устройств
    🤖 AI чат-бот активен (исправлен!)
  `);
});

// ======= ЭКСПОРТ ДЛЯ ОТЛАДКИ =======
if (typeof window !== 'undefined') {
  window.AbsurdGame = {
    gameState,
    GameLogic,
    UI,
    ChatBot,
    genres
  };
}
