// pages/api/chat.js
// Phase 2 — Minimal, transport-safe handler
// NO OpenAI
// NO memory
// NO Cipher core
// NO async dependencies

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method !== "POST") {
      return res.status(200).json({ reply: "Method not allowed." });
    }

    const body = req.body || {};
    const message = body.message;

    if (!message || typeof message !== "string") {
      return res.status(200).json({ reply: "Say something real." });
    }

    // ✅ Dynamic but safe echo
    const reply = `Yeah. I'm here. You said: "${message}"`;

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API CRASH:", err);
    return res.status(200).json({
      reply: "Cipher caught itself. Try again.",
    });
  }
}
