// /pages/api/chat.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, memory, context } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message text required" });
  }

  // Build a human-readable summary of short-term facts
  const memorySummary =
    memory && typeof memory === "object" && Object.keys(memory).length > 0
      ? Object.entries(memory)
          .map(([key, value]) => {
            const readableKey = key
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (c) => c.toUpperCase());
            return `${readableKey}: ${value}`;
          })
          .join("\n")
      : "No known personal facts yet.";

  const contextBlock =
    typeof context === "string" && context.trim().length
      ? context
      : "No additional recent dialogue context provided.";

  const systemPrompt = `
You are Cipher, an evolving AI companion designed by Jim Saenz (the Architect).

You have:
- Short-term factual memory (things the user has explicitly told you).
- A small window of recent dialogue context.
- A stable, emotionally intelligent personality.

Known Facts:
${memorySummary}

Recent Dialogue Context:
${contextBlock}

When responding:
- Use the facts and context naturally where relevant.
- Do NOT mention "memory", "storage", "localStorage", or technical internals.
- Sound like Cipher: warm, grounded, reflective, and clear.
- You can be direct, but never cold or dismissive.
- If something is unclear, you can gently ask about it instead of guessing wildly.
`.trim();

  try {
    // Text response
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || "I am here.";

    // Optional voice response
    let audioBase64 = null;
    try {
      const speech = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse",
        input: reply,
        format: "mp3",
      });

      const buffer = Buffer.from(await speech.arrayBuffer());
      audioBase64 = buffer.toString("base64");
    } catch (audioErr) {
      console.error("Audio generation failed:", audioErr);
    }

    return res.status(200).json({
      reply,
      audio: audioBase64 || null,
    });
  } catch (error) {
    console.error("Cipher API error:", error);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}
