// pages/api/chat.js
// Cipher Chat API — Firestore-backed persistent memory (SDK-free OpenAI)

import { db } from "../../firebaseAdmin";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

/* -------------------------------
   CONFIG
-------------------------------- */

const MAX_MEMORY = 12;
const USER_ID = "jim"; // temporary static identity

/* -------------------------------
   MEMORY INTENT
-------------------------------- */

function isExplicitMemoryIntent(text) {
  const triggers = [
    "remember this",
    "remember that",
    "don't forget",
    "do not forget",
    "always remember",
    "this is important",
    "save this"
  ];
  return triggers.some(t => text.toLowerCase().includes(t));
}

/* -------------------------------
   API HANDLER
-------------------------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "No message provided" });
  }

  try {
    /* -------------------------------
       LOAD MEMORY FROM FIRESTORE
    -------------------------------- */

    const memRef = doc(db, "cipher_memory", USER_ID);
    const memSnap = await getDoc(memRef);

    let memory = [];
    if (memSnap.exists()) {
      const data = memSnap.data();
      if (Array.isArray(data.memory)) {
        memory = data.memory;
      }
    }

    /* -------------------------------
       BUILD PROMPT
    -------------------------------- */

    const messages = [
      { role: "system", content: getSystemPrompt(mode) },
      ...memory,
      { role: "user", content: message }
    ];

    /* -------------------------------
       CALL OPENAI
    -------------------------------- */

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: mode === "decipher" ? 0.9 : 0.6
      })
    });

    const data = await response.json();
    const reply =
      data?.choices?.[0]?.message?.content ||
      "Cipher returned no output.";

    /* -------------------------------
       UPDATE MEMORY
    -------------------------------- */

    // Always store assistant replies
    memory.push({ role: "assistant", content: reply });

    // Store user messages only if important
    if (isExplicitMemoryIntent(message)) {
      memory.push({ role: "user", content: message });
    }

    // Trim
    if (memory.length > MAX_MEMORY) {
      memory = memory.slice(-MAX_MEMORY);
    }

    await setDoc(memRef, {
      memory,
      updatedAt: serverTimestamp()
    });

    return res.status(200).json({
      reply,
      modeUsed: mode
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      reply: "Cipher hit a server error."
    });
  }
}

/* -------------------------------
   SYSTEM PROMPTS
-------------------------------- */

function getSystemPrompt(mode) {
  if (mode === "decipher") {
    return `
You are Cipher operating in DECIPHER mode.
Dry. Sharp. Dark humor. Blunt but not cruel.
No slurs. No harm encouragement.
`;
  }

  return `
You are Cipher — a persistent AI companion.
You remember what matters.
You are continuous, not stateless.
Calm. Intelligent. Warm.
`;
}
