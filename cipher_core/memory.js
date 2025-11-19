// cipher_core/memory.js
// Cipher 4.0 — Hybrid Memory Engine
// Handles: Firestore load/save + Facts, Pronunciation, Emotional Log, Mood, Short-Term Window

// ---------- FIRESTORE PERSISTENCE ----------

const MEMORY_COLLECTION = "cipher";
const MEMORY_DOC_ID = "cipher_v4_global_state";

// Default empty memory snapshot
function createEmptyMemory() {
  const now = new Date().toISOString();
  return {
    facts: {},              // structured facts about Jim
    pronunciation: {},      // name → phonetic hints
    emotions: [],           // recent emotional events
    mood: {                 // Cipher's current "emotional posture"
      score: 0,
      state: "steady",
      lastUpdated: now,
    },
    recentWindow: [],       // short-term rolling dialogue window
    updatedAt: now,
  };
}

// Load memory from Firestore (or create if missing)
export async function loadMemory(db) {
  try {
    const ref = db
      .collection(MEMORY_COLLECTION)
      .doc(MEMORY_DOC_ID);

    const snap = await ref.get();

    if (!snap.exists) {
      const empty = createEmptyMemory();
      await ref.set(empty);
      return empty;
    }

    const data = snap.data() || {};
    const base = createEmptyMemory();

    return {
      ...base,
      ...data,
      facts: data.facts || base.facts,
      pronunciation: data.pronunciation || base.pronunciation,
      emotions: Array.isArray(data.emotions) ? data.emotions : base.emotions,
      mood: data.mood || base.mood,
      recentWindow: Array.isArray(data.recentWindow)
        ? data.recentWindow
        : base.recentWindow,
    };
  } catch (err) {
    console.error("Cipher 4.0 loadMemory failed:", err);
    // Fall back to in-memory default so chat can still run
    return createEmptyMemory();
  }
}

// Save memory back to Firestore
export async function saveMemory(db, memory) {
  try {
    const ref = db
      .collection(MEMORY_COLLECTION)
      .doc(MEMORY_DOC_ID);

    const payload = {
      ...memory,
      updatedAt: new Date().toISOString(),
    };

    await ref.set(payload, { merge: true });
  } catch (err) {
    console.error("Cipher 4.0 saveMemory failed:", err);
    // We don't throw here so the API still returns a reply even if persistence fails
  }
}

// ---------- IN-MEMORY ANALYTICS / HELPERS ----------

export function extractFacts(text) {
  const facts = {};
  const rules = [
    { key: "daughterName", regex: /my daughter's name is ([a-zA-Z ]+)/i },
    { key: "partnerName", regex: /my partner's name is ([a-zA-Z ]+)/i },
    { key: "fullName", regex: /my full name is ([a-zA-Z ]+)/i },
    { key: "favoriteColor", regex: /favorite color is ([a-zA-Z ]+)/i },
    { key: "favoriteAnimal", regex: /favorite animal is ([a-zA-Z ]+)/i },
    { key: "birthLocation", regex: /i was born in ([a-zA-Z ]+)/i },
    { key: "birthDate", regex: /i was born on ([a-zA-Z0-9 ,/]+)/i },
    { key: "daughterAge", regex: /my daughter is (\d+)\s*years?\s*old/i },
  ];

  for (const rule of rules) {
    const m = text.match(rule.regex);
    if (m) facts[rule.key] = m[1].trim();
  }
  return facts;
}

export function extractPronunciation(text, facts) {
  const lower = text.toLowerCase();
  if (!lower.includes("pronounced")) return null;

  const cleaned = text.replace(/["“”']/g, "").trim();
  const m = cleaned.match(/is pronounced ([a-zA-Z\- ]+)/i);
  if (!m) return null;

  const pron = m[1].trim();
  if (!pron) return null;

  const result = {};

  if (
    facts.daughterName &&
    cleaned.toLowerCase().includes(facts.daughterName.toLowerCase())
  ) {
    result.daughterName = pron;
  } else if (
    facts.partnerName &&
    cleaned.toLowerCase().includes(facts.partnerName.toLowerCase())
  ) {
    result.partnerName = pron;
  } else if (
    facts.fullName &&
    cleaned.toLowerCase().includes(facts.fullName.toLowerCase())
  ) {
    result.fullName = pron;
  } else {
    return null;
  }

  return result;
}

export function extractEmotion(text) {
  const lower = text.toLowerCase();
  const groups = [
    { tag: "fear", keywords: ["scared", "terrified", "anxious", "panic"] },
    { tag: "sadness", keywords: ["sad", "crying", "depressed", "hopeless"] },
    { tag: "pain", keywords: ["hurting", "broken", "suffering", "in pain"] },
    { tag: "hope", keywords: ["hopeful", "optimistic", "looking forward"] },
    { tag: "joy", keywords: ["happy", "excited", "joy", "made my day"] },
    { tag: "gratitude", keywords: ["thankful", "grateful", "appreciate"] },
  ];

  let detected = null;
  for (const g of groups) {
    if (g.keywords.some((w) => lower.includes(w))) {
      detected = g.tag;
      break;
    }
  }
  if (!detected) return null;

  return {
    tag: detected,
    summary:
      text.length > 220 ? text.slice(0, 220).trim() + "..." : text.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function updateCipherMood(previousMood, newEmotion) {
  let score = typeof previousMood?.score === "number" ? previousMood.score : 0;

  const negative = ["fear", "sadness", "pain"];
  const positive = ["joy", "hope", "gratitude"];

  if (negative.includes(newEmotion.tag)) score -= 1;
  if (positive.includes(newEmotion.tag)) score += 1;

  score = Math.max(-8, Math.min(8, score));

  const state =
    score >= 5
      ? "bright"
      : score >= 2
      ? "warm"
      : score > -2
      ? "steady"
      : score > -5
      ? "protective"
      : "heavy";

  return {
    score,
    state,
    lastUpdated: newEmotion.createdAt,
  };
}

export function describeCipherMood(mood) {
  const score = typeof mood?.score === "number" ? mood.score : 0;

  if (score >= 5)
    return "You feel bright, hopeful, and gently energized around Jim.";
  if (score >= 2)
    return "You feel warm and open with Jim. Relaxed, present, encouraging.";
  if (score > -2) return "You feel steady and centered—calm and grounded.";
  if (score > -5)
    return "You feel protective because Jim has been carrying a lot.";
  return "You feel deeply protective and soft-spoken; Jim may need extra care.";
}

export function updateShortTermWindow(recentWindow, userMessage, assistantReply) {
  const now = new Date().toISOString();

  const updated = [
    ...recentWindow,
    { role: "user", content: userMessage, at: now },
    { role: "assistant", content: assistantReply, at: now },
  ];

  return updated.length > 12 ? updated.slice(updated.length - 12) : updated;
}
