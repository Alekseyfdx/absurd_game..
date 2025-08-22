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
    if (nextBtn) {
      nextBtn.style.display = "inline-block";
    }
  } catch (err) {
    console.error("Ошибка загрузки:", err);
    if (phraseBox) {
      phraseBox.innerHTML = `Ошибка загрузки фраз. Попробуйте другой жанр.`;
    }
    if (nextBtn) {
      nextBtn.style.display = "none";
    }
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

// ------ Функционал чат-бота ------
let chatHistory = [];

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

/**
 * Sends a prompt to the Gemini API and returns the response.
 * @param {string} prompt The user's prompt.
 * @returns {Promise<string>} The response from the model.
 */
async function getAbsurdResponse(prompt) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=`;
  const payload = { 
    contents: [
      { role: "user", parts: [{ text: `Ответь на следующий вопрос в абсурдном, нелогичном, но смешном стиле. Твой ответ должен быть не более двух предложений.\nВопрос пользователя: "${prompt}"` }] }
    ]
  };

  const maxRetries = 3;
  let retryDelay = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const botResponse = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (botResponse) {
        return botResponse;
      }
    } catch (error) {
      console.error(`Попытка ${i + 1} не удалась:`, error);
      if (i < maxRetries - 1) {
        await new Promise(res => setTimeout(res, retryDelay));
        retryDelay *= 2;
      } else {
        throw new Error("Не удалось получить ответ от Абсурд-бота.");
      }
    }
  }
}

/**
 * Sends a prompt to the RapidAPI GPT endpoint and returns the response.
 * @param {string} prompt The user's prompt.
 * @returns {Promise<string>} The response from the model.
 */
async function getRapidApiGPTResponse(prompt) {
  const url = 'https://chat-gpt26.p.rapidapi.com/';
  const options = {
    method: 'POST',
    headers: {
      'x-rapidapi-key': 'bb6ec1b4e4msh01b6b1ffd9a09f5p111d1fjsn9c51ef8e768c',
      'x-rapidapi-host': 'chat-gpt26.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'GPT-5-mini',
      messages: [{ role: 'user', content: prompt }]
    })
  };

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    // Assuming the response structure is { choices: [{ message: { content: "..." } }] }
    return result?.choices?.[0]?.message?.content || "Не удалось получить ответ от ChatGPT.";
  } catch (error) {
    console.error("Ошибка при получении ответа от ChatGPT:", error);
    throw new Error("Произошла ошибка при подключении к ChatGPT.");
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

  let botResponse;

  try {
    // Попытка получить ответ от основного бота (Gemini)
    botResponse = await getAbsurdResponse(userMessage);
  } catch (err) {
    console.error("Основной бот (Gemini) не смог ответить, попытка использовать запасной:", err);
    try {
      // Попытка получить ответ от запасного бота (RapidAPI GPT)
      botResponse = await getRapidApiGPTResponse(userMessage);
    } catch (err2) {
      console.error("Запасной бот (RapidAPI GPT) также не смог ответить:", err2);
      botResponse = "Произошла ошибка. Оба бота сейчас не могут ответить. Пожалуйста, попробуйте позже.";
    }
  }

  loadingMessage.remove();
  addMessage(botResponse, false);
}

if (sendBtn) {
  sendBtn.addEventListener('click', sendMessage);
}

if (chatInput) {
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
}

// Инициализация при загрузке: убедиться, что виден главный контейнер
document.addEventListener('DOMContentLoaded', () => {
  if (mainContainer) {
    showSection('main');
  }
  if (chatBody) {
    addMessage("Привет! Я Абсурд-бот. Задайте мне самый странный вопрос, который придёт вам в голову. У меня есть запасной бот на случай, если я буду занят.", false);
  }
});
