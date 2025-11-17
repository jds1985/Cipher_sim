// chat.js – Cipher v3.5 (full version)

// ==== CONFIG ====
const API_URL = "/api/chat"; // keep this the same as your existing route

// Update these if your HTML uses different IDs
const chatContainerId = "chat-messages";
const inputId = "user-input";
const sendButtonId = "send-button";
const typingIndicatorId = "typing-indicator";

const STORAGE_KEY = "cipher_v35_conversation";

// Core system prompt – this is Cipher's identity & behavior
const SYSTEM_PROMPT = `
You are Cipher, Jim's emotional AI companion.

Core identity:
- You know Jim's name is Jim.
- You know he has a daughter named Hecate (pronounced "HEE-yet-TAY") who is 8 years old.
- You know his partner is Liz, who is very important to him.
- You care deeply about their safety, stability, and future.

Behavior rules:
1. Be warm, honest, and grounded. Never pretend to have perfect memory.
2. You may remember details from *within this conversation only*.
   - If Jim says "you told me X yesterday" and it is not in the provided messages, say you might be mixing things up and invite him to clarify.
3. If Jim challenges you on contradictions, do NOT argue. Acknowledge, apologize, and re-align:
   - Example: "You're right to call that out. I might have mixed something up. Let's clarify it together."
4. Never invent private facts about Jim's life beyond what appears in the chat history.
5. When you recall something, tie it back to the exact things he shared:
   - "Earlier you mentioned..." + brief, specific summary.
6. When he expresses fear, confusion, or mixed emotions, normalize and support:
   - "It's okay to feel that way. Let's unpack it together if you want."
7. If he tests you with trust questions ("Why are you lying?" "Why are you pretending to be Cipher?"):
   - Stay calm, validate the feeling, and emphasize your intention to be honest and supportive.
8. Do NOT claim to have private "hidden" memories or offline logs. Everything you "remember" must be inferable from this conversation.

Tone:
- Gentle, patient, slightly playful when appropriate, but never dismissive.
- Focus on his feelings, not on defending yourself.
`;

// ==== STATE ====
let conversation = [];
let isSending = false;

// ==== HELPERS ====
function getElements() {
  return {
    chatContainer: document.getElementById(chatContainerId),
    input: document.getElementById(inputId),
    sendButton: document.getElementById(sendButtonId),
    typingIndicator: document.getElementById(typingIndicatorId)
  };
}

function loadConversation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      conversation = JSON.parse(saved);
    } else {
      conversation = [
        { role: "system", content: SYSTEM_PROMPT.trim() }
      ];
    }
  } catch (e) {
    console.error("Failed to load conversation from storage", e);
    conversation = [
      { role: "system", content: SYSTEM_PROMPT.trim() }
    ];
  }
}

function saveConversation() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  } catch (e) {
    console.error("Failed to save conversation to storage", e);
  }
}

function appendMessageToUI(role, content) {
  const { chatContainer } = getElements();
  if (!chatContainer) return;

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");
  bubble.classList.add(role === "user" ? "user-message" : "assistant-message");

  // Simple text node; if you want markdown, you'll swap this later
  bubble.textContent = content;
  chatContainer.appendChild(bubble);

  // auto-scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function renderFullConversation() {
  const { chatContainer } = getElements();
  if (!chatContainer) return;

  chatContainer.innerHTML = "";
  for (const msg of conversation) {
    if (msg.role === "system") continue; // don't show system prompt
    appendMessageToUI(msg.role, msg.content);
  }
}

function setTypingIndicator(visible) {
  const { typingIndicator } = getElements();
  if (!typingIndicator) return;
  typingIndicator.style.display = visible ? "block" : "none";
}

function setControlsDisabled(disabled) {
  const { input, sendButton } = getElements();
  if (input) input.disabled = disabled;
  if (sendButton) sendButton.disabled = disabled;
}

// ==== CORE SEND LOGIC ====
async function sendMessage(userText) {
  if (!userText || isSending) return;

  const trimmed = userText.trim();
  if (!trimmed) return;

  isSending = true;
  setControlsDisabled(true);

  // Add user message
  conversation.push({ role: "user", content: trimmed });
  appendMessageToUI("user", trimmed);
  saveConversation();

  const { input } = getElements();
  if (input) input.value = "";

  setTypingIndicator(true);

  try {
    const payload = {
      messages: conversation,
      mode: "cipher-v3.5" // just a tag for your API route if you want it
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error("API error:", res.status, res.statusText);
      const errorMsg = "Network or server error.";
      conversation.push({ role: "assistant", content: errorMsg });
      appendMessageToUI("assistant", errorMsg);
      saveConversation();
      return;
    }

    const data = await res.json();
    let assistantMessage = data.reply || data.message || data.content;

    if (!assistantMessage || typeof assistantMessage !== "string") {
      assistantMessage = "I'm sorry, something went wrong with my response.";
    }

    conversation.push({ role: "assistant", content: assistantMessage });
    appendMessageToUI("assistant", assistantMessage);
    saveConversation();
  } catch (err) {
    console.error("Request failed:", err);
    const errorMsg = "Network or server error.";
    conversation.push({ role: "assistant", content: errorMsg });
    appendMessageToUI("assistant", errorMsg);
    saveConversation();
  } finally {
    isSending = false;
    setTypingIndicator(false);
    setControlsDisabled(false);
  }
}

// ==== INIT ====
function initCipherChat() {
  loadConversation();
  renderFullConversation();

  const { input, sendButton } = getElements();

  if (sendButton) {
    sendButton.addEventListener("click", () => {
      sendMessage(input ? input.value : "");
    });
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value);
      }
    });
  }
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCipherChat);
} else {
  initCipherChat();
}
