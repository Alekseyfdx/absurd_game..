"use strict";

/**
 * Absurd Game App
 * This script combines the original game logic for displaying absurd phrases
 * with a new chatbot functionality powered by the Gemini API.
 */

// =========================================================================
// Original Game Logic (Phrases & Genre Buttons)
// =========================================================================

const genres = {
  absurd: "Абсурд",
  horror: "Ужасы",
  kids: "Детское",
  romance: "Романтика",
  sex: "18+",
  street: "Улица"
};

const genreButtonsDiv = document.getElementById("genre-buttons");
const phraseBox = document.getElementById("phrase-box");
const nextBtn = document.getElementById("next-btn");

let phrases = [];
let currentIndex = 0;

/**
 * Sets the active state for the selected genre button.
 * @param {string} key - The genre key to activate.
 */
function setActiveGenreButton(key) {
  document.querySelectorAll(".genre-btn").forEach(b => {
    b.classList.toggle("active", b.textContent.trim() === genres[key]);
  });
}

/**
 * Reveals a new phrase with a typewriter and fade-up animation.
 * @param {string} text - The phrase text to display.
 */
function revealPhrase(text) {
  phraseBox.innerHTML = `<span class="typewriter"><span class="typewriter-text">${text}</span></span>`;
  phraseBox.classList.remove("reveal");
  void phraseBox.offsetWidth; // Trigger reflow to restart animation
  phraseBox.classList.add("reveal");
  if (navigator.vibrate) navigator.vibrate(10);
}

/**
 * Loads phrases from a JSON file based on the selected genre.
 * @param {string} genreKey - The key for the selected genre.
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
// Chatbot Logic
// =========================================================================

// HTML elements for the chatbot
const chatToggleBtn = document.getElementById("chat-toggle-btn");
const chatContainer = document.getElementById("chat-container");
const closeChatBtn = document.getElementById("close-chat-btn");
const chatBody = document.getElementById("chat-body");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

// Gemini API configuration (API key provided by the environment)
const GEMINI_API_KEY = ""; // Your API key will be provided at runtime
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";

/**
 * Toggles the visibility of the chatbot container.
 */
function toggleChat() {
  chatContainer.classList.toggle("open");
}

/**
 * Adds a message to the chat display and scrolls to the bottom.
 * @param {string} text - The message text.
 * @param {string} sender - "user" or "bot".
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
 * Handles user message submission.
 */
function handleSendMessage() {
  const userMessage = chatInput.value.trim();
  if (userMessage.length === 0) return;

  addMessage(userMessage, "user");
  chatInput.value = "";
  getAbsurdAnswer(userMessage);
}

/**
 * Sends a request to the Gemini API for an absurd response.
 * @param {string} userQuestion - The user's question.
 */
async function getAbsurdAnswer(userQuestion) {
  // Add a temporary loading message
  const loadingMessage = addMessage("Бот: Думаю над абсурдным ответом...", "bot");
  
  const prompt = `Ответь на вопрос пользователя, но так, чтобы это было максимально абсурдно, нелепо и сюрреалистично. Вопрос: "${userQuestion}"`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
  };

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const absurdAnswer = data.candidates[0].content.parts[0].text;
    
    // Remove the loading message and add the final response
    loadingMessage.remove(); // This is the old way, a better way is to use a specific ID
    addMessage(absurdAnswer, "bot");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    addMessage("Произошла какая-то абсурдная ошибка с API...", "bot");
  }
}

// =========================================================================
// Initialization and Event Listeners
// =========================================================================

/**
 * Initializes the application by setting up event listeners.
 */
function init() {
  // Set up game genre buttons
  Object.entries(genres).forEach(([key, label]) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "genre-btn";
    btn.addEventListener("click", () => loadGenre(key));
    genreButtonsDiv.appendChild(btn);
  });

  // Event listener for the "Next phrase" button
  nextBtn.addEventListener("click", () => {
    if (!phrases.length) return;
    currentIndex = (currentIndex + 1) % phrases.length;
    revealPhrase(phrases[currentIndex]);
  });

  // Event listeners for the chatbot
  chatToggleBtn.addEventListener("click", toggleChat);
  closeChatBtn.addEventListener("click", toggleChat);
  sendBtn.addEventListener("click", handleSendMessage);
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  });

  // Initial greeting from the bot
  addMessage("Абсурд-бот к вашим услугам! Задавайте вопросы.", "bot");
}

// Start the application when the window loads
window.onload = init;
