"use strict";

// Массив с жанрами
const genres = {
  absurd: "Абсурд",
  horror: "Ужасы",
  kids: "Детское",
  romance: "Романтика",
  sex: "18+",
  street: "Улица"
};

// Получение элементов DOM
const genreButtonsDiv = document.getElementById("genre-buttons");
const phraseBox = document.getElementById("phrase-box");
const nextBtn = document.getElementById("next-btn");
const mainContainer = document.getElementById("main-container");

// Элементы чата
const chatToggleBtn = document.getElementById("chat-toggle-btn");
const chatContainer = document.getElementById("chat-container");
const closeChatBtn = document.getElementById("close-chat-btn");
const chatBody = document.getElementById("chat-body");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

let phrases = [];
let currentIndex = 0;

// Инициализация кнопок жанров
Object.entries(genres).forEach(([key, label]) => {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.className = "genre-btn";
  btn.addEventListener("click", () => loadGenre(key));
  genreButtonsDiv.appendChild(btn);
});

function setActiveGenreButton(key) {
  document.querySelectorAll(".genre-btn").forEach(b => {
    b.classList.toggle("active", b.textContent.trim() === genres[key]);
  });
}

function revealPhrase(text) {
  phraseBox.innerHTML = `<span class="typewriter"><span class="typewriter-text">${text}</span></span>`;
  phraseBox.classList.remove("reveal");
  void phraseBox.offsetWidth;
  phraseBox.classList.add("reveal");
  if (navigator.vibrate) navigator.vibrate(10);
}

// Асинхронная загрузка фраз
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
    console.error("Ошибка загрузки:", err);
    phraseBox.innerHTML = `Ошибка загрузки фраз. Попробуйте другой жанр.`;
    nextBtn.style.display = "none";
  }
}

nextBtn.addEventListener("click", () => {
  if (phrases.length > 0) {
    currentIndex = (currentIndex + 1) % phrases.length;
    revealPhrase(phrases[currentIndex]);
  }
});

// Навигация между разделами
document.querySelectorAll('a[data-target]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = e.target.getAttribute('data-target');
    showSection(targetId);
  });
});

function showSection(targetId) {
  // Скрыть все разделы
  document.querySelectorAll('.container').forEach(section => {
    section.classList.add('hidden-section');
    section.classList.remove('active');
  });

  // Показать нужный раздел
  let sectionToShow;
  if (targetId === 'main') {
    sectionToShow = mainContainer;
  } else {
    sectionToShow = document.getElementById(targetId + '-section');
  }

  if (sectionToShow) {
    sectionToShow.classList.remove('hidden-section');
    sectionToShow.classList.add('active');
  }
}

// Логика чат-бота
function addMessage(text, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
  messageDiv.innerHTML = text; // Используем innerHTML для форматирования
  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight; // Прокрутка вниз
}

async function handleBotResponse(message) {
  // Показать сообщение о том, что бот думает
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'chat-message bot';
  loadingMessage.id = 'loading-message';
  loadingMessage.textContent = 'Абсурд-бот думает...';
  chatBody.appendChild(loadingMessage);
  chatBody.scrollTop = chatBody.scrollHeight;

  try {
    // Формируем промпт для LLM, чтобы он отвечал в абсурдном стиле
    const prompt = `Ответь на следующий вопрос в абсурдном, нелогичном, но смешном стиле. Твой ответ должен быть не более двух предложений.\nВопрос пользователя: "${message}"`;
    
    let chatHistory = [];
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    const payload = { contents: chatHistory };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Удаляем сообщение о загрузке
    loadingMessage.remove();

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const botReply = result.candidates[0].content.parts[0].text;
    
    // Добавляем ответ бота в чат
    addMessage(botReply, false);

  } catch (error) {
    console.error("Ошибка при получении ответа от бота:", error);
    loadingMessage.remove(); // Удаляем сообщение о загрузке, даже если произошла ошибка
    addMessage("Произошла ошибка. Я слишком занят, пытаясь понять, почему тостер не разговаривает со мной.", false);
  }
}

sendBtn.addEventListener('click', () => {
  const userMessage = chatInput.value.trim();
  if (userMessage) {
    addMessage(userMessage, true);
    chatInput.value = '';
    handleBotResponse(userMessage);
  }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
});

// Управление видимостью чата
chatToggleBtn.addEventListener('click', () => {
  chatContainer.classList.add('open');
  chatBody.scrollTop = chatBody.scrollHeight;
});

closeChatBtn.addEventListener('click', () => {
  chatContainer.classList.remove('open');
});

// Инициализация при загрузке: убедиться, что виден главный контейнер
document.addEventListener('DOMContentLoaded', () => {
  showSection('main');
  addMessage("Привет! Я Абсурд-бот. Задайте мне самый странный вопрос, который придёт вам в голову.", false);
});
