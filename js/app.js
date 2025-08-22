"use strict";

/**
 * Абсурдная Игра
 * Этот скрипт объединяет логику игры с фразами и функциональность
 * нового чат-бота, работающего на базе Gemini API.
 */

// =========================================================================
// Игровая логика (фразы и кнопки жанров)
// =========================================================================

const genres = {
  absurd: "Абсурд",
  horror: "Ужасы",
  kids: "Детское",
  romance: "Романтика",
  sex: "18+",
  street: "Улица"
};

// Получаем элементы DOM
const genreButtonsDiv = document.getElementById("genre-buttons");
const phraseBox = document.getElementById("phrase-box");
const nextBtn = document.getElementById("next-btn");

let phrases = [];
let currentIndex = 0;

/**
 * Устанавливает активное состояние для выбранной кнопки жанра.
 * @param {string} key - Ключ жанра для активации.
 */
function setActiveGenreButton(key) {
  document.querySelectorAll(".genre-btn").forEach(b => {
    b.classList.toggle("active", b.textContent.trim() === genres[key]);
  });
}

/**
 * Показывает новую фразу с эффектом печатающей машинки.
 * @param {string} text - Текст фразы для отображения.
 */
function revealPhrase(text) {
  phraseBox.innerHTML = `<span class="typewriter"><span class="typewriter-text">${text}</span></span>`;
  phraseBox.classList.remove("reveal");
  void phraseBox.offsetWidth; // Триггер для перезапуска анимации
  phraseBox.classList.add("reveal");
  if (navigator.vibrate) navigator.vibrate(10);
}

/**
 * Загружает фразы из JSON-файла на основе выбранного жанра.
 * @param {string} genreKey - Ключ выбранного жанра.
 */
async function loadGenre(genreKey) {
  try {
    setActiveGenreButton(genreKey);
    const res = await fetch(`data/${genreKey}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Неверный формат JSON");
    phrases = data;
    currentIndex = 0;
    revealPhrase(phrases[currentIndex]);
    nextBtn.style.display = "inline-block";
  } catch (err) {
    phraseBox.textContent = `Ошибка: ${err.message}`;
    console.error("Fetch error:", err);
  }
}

// =========================================================================
// Логика чат-бота
// =========================================================================

// Элементы HTML для чат-бота
const chatToggleBtn = document.getElementById("chat-toggle-btn");
const chatContainer = document.getElementById("chat-container");
const closeChatBtn = document.getElementById("close-chat-btn");
const chatBody = document.getElementById("chat-body");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Конфигурация Gemini API
const RAPID_API_KEY = "bb6ec1b4e4msh01b6b1ffd9a09f5p111d1fjsn9c51ef8e768c"; // ВАШ КЛЮЧ RapidAPI
const RAPID_API_HOST = "gemini-pro-ai.p.rapidapi.com";
const RAPID_API_URL = `https://${RAPID_API_HOST}/`;

/**
 * Переключает видимость контейнера чат-бота.
 */
function toggleChat() {
  chatContainer.classList.toggle("open");
}

/**
 * Добавляет сообщение в чат и прокручивает его вниз.
 * @param {string} text - Текст сообщения.
 * @param {string} sender - "user" или "bot".
 */
function addMessage(text, sender) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("chat-message", sender);

  if (sender === "bot") {
    const botLabel = document.createElement("strong");
    botLabel.textContent = "Бот: ";
    messageElement.appendChild(botLabel);
    messageElement.appendChild(document.createTextNode(text));
  } else {
    messageElement.textContent = text;
  }
  
  chatBody.appendChild(messageElement);
  chatBody.scrollTop = chatBody.scrollHeight;
}

/**
 * Обрабатывает отправку сообщения от пользователя.
 */
function handleSendMessage() {
  const userMessage = chatInput.value.trim();
  if (userMessage.length === 0) return;

  addMessage(userMessage, "user");
  chatInput.value = "";
  getAbsurdAnswer(userMessage);
}

/**
 * Отправляет запрос к Gemini API для получения абсурдного ответа.
 * @param {string} userQuestion - Вопрос пользователя.
 */
async function getAbsurdAnswer(userQuestion) {
  // Добавляем временное сообщение о загрузке
  addMessage("Думаю над абсурдным ответом...", "bot");
  
  // Обновленный промпт для более психоделичных и смешных ответов
  const prompt = `Ответь на вопрос пользователя так, чтобы это было максимально абсурдно, психоделично и смешно. Используй сюрреалистичные образы и нелепую логику. Вопрос: "${userQuestion}"`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  };

  try {
    const response = await fetch(RAPID_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-key": RAPID_API_KEY,
        "x-rapidapi-host": RAPID_API_HOST,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const absurdAnswer = data.candidates[0].content.parts[0].text;
    
    // Удаляем предыдущее сообщение о загрузке
    chatBody.lastChild.remove();
    addMessage(absurdAnswer, "bot");

  } catch (error) {
    console.error("Ошибка при вызове Gemini API:", error);
    addMessage("Произошла какая-то абсурдная ошибка с API...", "bot");
  }
}

// =========================================================================
// Инициализация и обработчики событий
// =========================================================================

/**
 * Инициализирует приложение, настраивая обработчики событий.
 */
function init() {
  // Настраиваем кнопки жанров
  Object.entries(genres).forEach(([key, label]) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "genre-btn";
    btn.addEventListener("click", () => loadGenre(key));
    genreButtonsDiv.appendChild(btn);
  });

  // Обработчик события для кнопки "Следующая фраза"
  nextBtn.addEventListener("click", () => {
    if (!phrases.length) return;
    currentIndex = (currentIndex + 1) % phrases.length;
    revealPhrase(phrases[currentIndex]);
  });

  // Обработчики событий для чат-бота
  chatToggleBtn.addEventListener("click", toggleChat);
  closeChatBtn.addEventListener("click", toggleChat);
  sendBtn.addEventListener("click", handleSendMessage);
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  });

  // Первое приветствие от бота
  addMessage("Абсурд-бот к вашим услугам! Задавайте вопросы.", "bot");
}

// Запускаем приложение, когда окно загрузится
window.onload = init;
