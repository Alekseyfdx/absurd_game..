"use strict";

// ======= НАСТРОЙКИ (меняй только это) =======
const GEMINI_API_KEY = "AIzaSyBEwUcxAfqJ9SxLXwEfbJ8EtkCtSJoMTeQ"; // <-- Вставь сюда свой ключ Gemini
// ===========================================

// Категории игры (жанры)
const genres = {
  absurd: "Абсурд",
  horror: "Ужасы",
  kids: "Детское",
  romance: "Романтика",
  sex: "18+",
  street: "Улица"
};

// DOM-элементы
const genreButtonsDiv = document.getElementById("genre-buttons");
const phraseBox = document.getElementById("phrase-box");
const nextBtn = document.getElementById("next-btn");
const mainContainer = document.getElementById("main-container");

// Секции сайта
const chatToggleBtn = document.getElementById("chat-toggle-btn");
const chatContainer = document.getElementById("chat-container");
const closeChatBtn = document.getElementById("close-chat-btn");
const chatBody = document.getElementById("chat-body");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

let phrases = [];
let currentIndex = 0;

// --- Кнопки жанров ---
if (genreButtonsDiv) {
  Object.entries(genres).forEach(([key, label]) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "genre-btn";
    btn.addEventListener("click", () => loadGenre(key));
    genreButtonsDiv.appendChild(btn);
  });
}

function setActiveGenreButton(key) {
  document.querySelectorAll(".genre-btn").forEach(b => {
    b.classList.toggle("active", b.textContent.trim() === genres[key]);
  });
}

function revealPhrase(text) {
  if (phraseBox) {
    phraseBox.innerHTML = `<span class="typewriter"><span class="typewriter-text">${text}</span></span>`;
    phraseBox.classList.remove("reveal");
    void phraseBox.offsetWidth;
    phraseBox.classList.add("reveal");
    if (navigator.vibrate) navigator.vibrate(10);
  }
}

// --- Асинхронная загрузка фраз по жанру ---
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
    if (nextBtn) nextBtn.style.display = "inline-block";
  } catch (err) {
    console.error("Ошибка загрузки:", err);
    if (phraseBox) phraseBox.innerHTML = `Ошибка загрузки фраз. Попробуйте другой жанр.`;
    if (nextBtn) nextBtn.style.display = "none";
  }
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (phrases.length > 0) {
      currentIndex = (currentIndex + 1) % phrases.length;
      revealPhrase(phrases[currentIndex]);
    }
  });
}

// --- Навигация между разделами ---
document.querySelectorAll('a[data-target]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('data-target');
    showSection(targetId);
  });
});

function showSection(targetId) {
  document.querySelectorAll('.container').forEach(section => {
    section.classList.add('hidden-section');
    section.classList.remove('active');
  });

  let sectionToShow = (targetId === 'main')
    ? mainContainer
    : document.getElementById(targetId + '-section');

  if (sectionToShow) {
    sectionToShow.classList.remove('hidden-section');
    sectionToShow.classList.add('active');
  }
}

// --- ЧАТ-БОТ на Gemini ---
function addMessage(text, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
  messageDiv.textContent = text;
  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

if (chatToggleBtn) {
  chatToggleBtn.addEventListener('click', () => {
    chatContainer.classList.add('open');
    chatBody.scrollTop = chatBody.scrollHeight;
  });
}
if (closeChatBtn) {
  closeChatBtn.addEventListener('click', () => {
    chatContainer.classList.remove('open');
  });
}

async function getAbsurdResponse(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${AIzaSyBEwUcxAfqJ9SxLXwEfbJ8EtkCtSJoMTeQ}`;
  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Ответь в очень абсурдном, нелепом стиле. Сохраняй краткость и юмор! Отвечай максимум двумя фразами. Вопрос: "${prompt}"`
          }
        ]
      }
    ]
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "У меня что-то коротнуло в процессоре. Перезагрузи меня!"
    );
  } catch (e) {
    console.error("Ошибка ответа Gemini:", e);
    return "Сломался даже мой абсурд. Попробуй позже!";
  }
}

async function sendMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;
  addMessage(userMessage, true);
  chatInput.value = '';
  const loadingMessage = document.createElement('div');
  loadingMessage.className = 'chat-message bot-message';
  loadingMessage.textContent = 'Печатает...';
  chatBody.appendChild(loadingMessage);
  chatBody.scrollTop = chatBody.scrollHeight;

  let botResponse = '';
  try {
    botResponse = await getAbsurdResponse(userMessage);
  } catch (err) {
    botResponse = "Сервис временно недоступен. Повтори позже!";
  }
  loadingMessage.remove();
  addMessage(botResponse, false);
}

if (sendBtn) sendBtn.addEventListener('click', sendMessage);
if (chatInput) chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// --- На старте — показать main и приветствие чата
document.addEventListener('DOMContentLoaded', () => {
  if (mainContainer) showSection('main');
  if (chatBody) addMessage("Привет! Я Абсурд-бот. Задай мне что-нибудь странное — я отвечу по-идиотски!", false);
});
