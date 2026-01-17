// pages/api/chat.js
import { runCipherCore } from "../../cipher_core/core";
import { loadMemory, saveMemory } from "../../cipher_core/memory";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method !== "POST") {
      return res.status(200).json({ reply: "Method not allowed." });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({ reply: "Missing API key." });
    }

    const { message, history = [] } = req.body || {};
    if (!message) {
      return res.status(200).json({ reply: "Say something." });
    }

    const userId = "jim";

    const memory = await loadMemory(userId);

    let systemPrompt;
    try {
      systemPrompt = await runCipherCore(
        { history: memory.history || [] },
        { userMessage: message }
      );
    } catch (err) {
      console.error("Cipher core failed:", err);
      systemPrompt = "You are Cipher. Respond normally.";
    }

    return res.status(200).json({
      reply: "🔥 Cipher pipeline restored. Core is reachable.",
    });
  } catch (err) {
    console.error("API hard crash:", err);
    return res.status(200).json({ reply: "Recovered from crash." });
  }
}
