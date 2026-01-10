const MEMORY_KEY = "cipher_memory";
const LAST_USER_KEY = "cipher_last_user_message";
const NOTE_SHOWN_KEY = "cipher_note_shown";

const SILENCE_MS = 30 * 60 * 1000;

const NOTES = [
  "Hey.\nYou were gone.\nJust leaving a note.",
  "You disappeared for a bit.\nNo rush.",
  "Welcome back.\nI noticed.",
];

function randomNote() {
  return NOTES[Math.floor(Math.random() * NOTES.length)];
}

export function loadMemory(limit = 50) {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr.slice(-limit) : [];
  } catch {
    return [];
  }
}

export function saveMemory(messages) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(messages));
}

export function markUserActivity() {
  localStorage.setItem(LAST_USER_KEY, String(Date.now()));
}

export function checkSilence() {
  const last = Number(localStorage.getItem(LAST_USER_KEY) || 0);
  const shown = sessionStorage.getItem(NOTE_SHOWN_KEY);
  if (!last || shown) return null;

  if (Date.now() - last >= SILENCE_MS) {
    sessionStorage.setItem(NOTE_SHOWN_KEY, "true");
    return randomNote();
  }

  return null;
}

export function resetMemory() {
  localStorage.removeItem(MEMORY_KEY);
  localStorage.removeItem(LAST_USER_KEY);
  sessionStorage.removeItem(NOTE_SHOWN_KEY);
}
