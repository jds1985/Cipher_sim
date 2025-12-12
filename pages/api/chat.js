// pages/api/chat.js
// Cipher Safe Mode — Debug + Always Responds

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // METHOD GUARD
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // DEBUG: ENV CHECK
  console.log("OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);

  const { message } = req.body;

  // INPUT GUARD
  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Cipher, an autonomous AI companion.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "Cipher is online but silent.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("CIPHER CHAT ERROR:", err);
    return res
      .status(500)
      .json({ reply: "Cipher encountered an internal error." });
  }
}
