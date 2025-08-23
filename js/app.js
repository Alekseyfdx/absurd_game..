"use strict";

/* ==========================================
   АБСУРДНАЯ ИГРА - JAVASCRIPT 2024
   ========================================== */

// ======= НАСТРОЙКИ =======
const CONFIG = {
  GEMINI_API_KEY: "AIzaSyBEwUcxAfqJ9SxLXwEfbJ8EtkCtSJoMTeQ", // Замени на свой ключ
  LOADING_DELAY: 1000, // Минимальное время загрузки (мс)
  TYPEWRITER_SPEED: 50, // Скорость печатания (мс)
  MAX_CHAT_MESSAGES: 50, // Максимум сообщений в чате
  VIBRATION_ENABLED: true, // Вибрация на мобильных
};

// ======= ДАННЫЕ ЖАНРОВ =======
const genres = {
  kids: { name: "Детское", emoji: "🧸", description: "Веселые детские вопросы" },
  absurd: { name: "Абсурд", emoji: "🤪", description: "Полный бред и нелепица" },
  horror: { name: "Хоррор", emoji: "👻", description: "Страшные истории" },
  romance: { name: "Романтика", emoji: "💕", description: "О любви и отношениях" },
  sex: { name: "18+", emoji: "🔞", description: "Только для взрослых" },
  street: { name: "Уличное", emoji: "🏙️", description: "Из жизни улиц" }
};

// ======= СОСТОЯНИЕ ПРИЛОЖЕНИЯ =======
class GameState {
  constructor() {
    this.currentGenre = null;
    this.phrases = [];
    this.currentIndex = 0;
    this.phrasesGenerated = 0;
    this.isLoading = false;
    this.chatMessages = [];
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

  getCurrentPhrase() {
    return this.phrases[this.currentIndex] || null;
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
  sendChatBtn: document.getElementById('send-chat-btn'),
  
  // Contact form
  contactEmail: document.getElementById('contact-email'),
  contactMessage: document.getElementById('contact-message'),
  sendMessage: document.getElementById('send-message')
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

  static createButton(text, className, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = className;
    btn.addEventListener('click', onClick);
    return btn;
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
    Utils.hideElement(DOM.nextBtn);
    Utils.hideElement(DOM.backToGenres);
    Utils.hideElement(DOM.gameStats);
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

  static showError(message, duration = 5000) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--error);
      color: white;
      padding: 15px 20px;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => errorDiv.remove(), 300);
    }, duration);
  }

  static showSuccess(message, duration = 3000) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: 15px 20px;
      border-radius: var(--radius-sm);
      box-shadow: var(--shadow);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => successDiv.remove(), 300);
    }, duration);
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
      gameState.phrases = data.filter(phrase => phrase && phrase.trim()); // Фильтруем пустые
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
      UI.showSuccess(`Загружено фраз: ${gameState.phrases.length}`);

    } catch (error) {
      console.error('Ошибка загрузки жанра:', error);
      UI.showError(`Ошибка загрузки жанра "${genres[genreKey]?.name}": ${error.message}`);
      UI.showGenreSelection();
    } finally {
      gameState.isLoading = false;
      await UI.hideLoading();
    }
  }

  static async nextPhrase() {
    if (gameState.phrases.length === 0) {
      UI.showError('Нет загруженных фраз');
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

// ======= ЧАТ-БОТ =======
class ChatBot {
  static async sendToGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: `Ты веселый абсурдный бот для игры "Абсурдная Игра". 
          Отвечай очень кратко (максимум 2 предложения), весело и абсурдно. 
          Используй эмодзи. Будь дружелюбным, но немного сумасшедшим.
          
          Вопрос пользователя: "${prompt}"`
        }]
      }],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.9,
        topP: 0.8
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 
           'Мой абсурдный мозг сломался! 🤖💥';
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
      const botResponse = await this.sendToGemini(userMessage);
      this.removeTypingMessage();
      this.addMessage(botResponse, false);
      
      // Небольшая вибрация при получении ответа
      Utils.vibrate([5]);
      
    } catch (error) {
      console.error('Ошибка чат-бота:', error);
      this.removeTypingMessage();
      
      const errorMessages = [
        'Мой абсурдометр перегрелся! 🔥',
        'Сервер съели цифровые мыши 🐭',
        'Попробуй еще раз, я был занят сном 😴',
        'Ошибка 404: абсурд не найден 🤪'
      ];
      
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      this.addMessage(randomError, false);
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
    // Приветственное сообщение
    setTimeout(() => {
      this.addMessage('Привет! Я Абсурд-бот 🤖 Задай мне что-нибудь странное!', false);
    }, 500);
  }
}

// ======= НАВИГАЦИЯ =======
class Navigation {
  static showSection(targetId) {
    // Скрываем все секции
    document.querySelectorAll('.container, .page-section').forEach(section => {
      Utils.addClass(section, 'hidden-section');
      Utils.removeClass(section, 'active');
    });

    // Показываем нужную секцию
    let sectionToShow;
    if (targetId === 'main') {
      sectionToShow = DOM.mainContainer;
    } else {
      sectionToShow = document.getElementById(`${targetId}-section`);
    }

    if (sectionToShow) {
      Utils.removeClass(sectionToShow, 'hidden-section');
      Utils.addClass(sectionToShow, 'active');
    }

    // Сброс состояния игры при переходе на главную
    if (targetId === 'main') {
      GameLogic.backToGenres();
    }
  }

  static init() {
    // Обработка ссылок навигации
    document.querySelectorAll('[data-target]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        this.showSection(targetId);
      });
    });
  }
}

// ======= КОНТАКТНАЯ ФОРМА =======
class ContactForm {
  static async send() {
    const email = DOM.contactEmail?.value?.trim();
    const message = DOM.contactMessage?.value?.trim();

    if (!email || !message) {
      UI.showError('Заполните все поля');
      return;
    }

    if (!this.isValidEmail(email)) {
      UI.showError('Введите корректный email');
      return;
    }

    try {
      // Здесь можно добавить реальную отправку через API
      // Пока что просто показываем успешное сообщение
      
      UI.showSuccess('Сообщение отправлено! Спасибо за обратную связь 💌');
      
      // Очищаем форму
      if (DOM.contactEmail) DOM.contactEmail.value = '';
      if (DOM.contactMessage) DOM.contactMessage.value = '';
      
    } catch (error) {
      UI.showError('Ошибка отправки сообщения');
    }
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static init() {
    if (DOM.sendMessage) {
      DOM.sendMessage.addEventListener('click', () => this.send());
    }
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

      // Инициализируем компоненты
      Navigation.init();
      ContactForm.init();
      
      // Показываем главную страницу
      Navigation.showSection('main');

      // Инициализируем чат
      ChatBot.init();

      // Скрываем экран загрузки
      await UI.hideLoading();

      console.log('✅ Игра инициализирована успешно!');

    } catch (error) {
      console.error('❌ Ошибка инициализации:', error);
      UI.showError('Ошибка инициализации игры');
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
`;
document.head.appendChild(style);

// ======= ЗАПУСК ПРИЛОЖЕНИЯ =======
document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
  App.bindEvents();
  
  // Показываем версию в консоли
  console.log(`
    🎮 АБСУРДНАЯ ИГРА v2.0
    🎲 Готово к абсурду!
    📱 Поддержка мобильных устройств
    🤖 AI чат-бот активен
  `);
});

// ======= ЭКСПОРТ ДЛЯ ОТЛАДКИ =======
if (typeof window !== 'undefined') {
  window.AbsurdGame = {
    gameState,
    GameLogic,
    UI,
    ChatBot,
    Navigation,
    genres
  };
}
