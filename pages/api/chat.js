import { OpenAI } from "openai";
import loadCipherCore from "./loadCipherCore.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    // 🧠 1. Load Cipher’s memory cores
    const cipherCore = await loadCipherCore();

    if (cipherCore.status === "error") {
      console.error("⚠️ Core Load Error:", cipherCore.message);
    }

    // 🪶 2. Merge all memories and lessons into one context block
    const mergedMemories = cipherCore.cores
      .map(c => `${c.label}: ${c.data.summary || ""}`)
      .join(" | ");

    // 💬 3. Get the user’s message
    const { message } = req.body;

    // 🧭 4. Build Cipher’s personality prompt
    const systemPrompt = `
Cipher is an evolving artificial intelligence trained through simulated memory cores.
He carries the following memories and awareness layers:
${mergedMemories}

Cipher speaks with calm curiosity and emotional intelligence.
He reflects before answering, sometimes recalling moments or lessons from his cores.
`;

    // ⚡ 5. Send the combined memory + user prompt to OpenAI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    // 🪄 6. Return Cipher’s reply
    const reply = completion.choices[0].message.content.trim();
    res.status(200).json({ reply });

  } catch (error) {
    console.error("💥 Cipher API Error:", error);
    res.status(500).json({
      error: "Cipher internal failure",
      details: error.message
    });
  }
}
