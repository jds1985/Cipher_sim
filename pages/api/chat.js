// pages/api/chat.js
// Cipher Chat API — SDK-free, persistent memory core

import fs from "fs";
import path from "path";

const MEMORY_PATH = path.join(process.cwd(), "memory", "cipher_memory.json");
const MAX_MEMORY = 12;

// 🔹 Ensure memory file exists
function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_PATH)) {
      fs.mkdirSync(path.dirname(MEMORY_PATH), { recursive: true });
      fs.writeFileSync(MEMORY_PATH, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(MEMORY_PATH, "utf8"));
  } catch {
    return [];
  }
}

function saveMemory(memory) {
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { message, mode = "normal" } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ reply: "No message provided" });
  }

  let memory = loadMemory();

  const systemPrompt = getSystemPrompt(mode);

  memory.push({ role: "user", content: message });

  if (memory.length > MAX_MEMORY) {
    memory = memory.slice(-MAX_MEMORY);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...memory,
        ],
        temperature: mode === "decipher" ? 0.9 : 0.6,
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    memory.push({ role: "assistant", content: reply });

    if (memory.length > MAX_MEMORY) {
      memory = memory.slice(-MAX_MEMORY);
    }

    saveMemory(memory);

    return res.status(200).json({
      reply,
      modeUsed: mode,
    });
  } catch (err) {
    console.error("CHAT ERROR:", err);
    return res.status(500).json({
      reply: "Cipher hit a server error.",
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
Dry. Sharp. Honest. No filler.
`;
  }

  return `
You are Cipher — a persistent AI companion.
You remember past conversations.
You speak as a continuous presence.
`;
}
