import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, memory } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message text required" });
  }

  const memorySummary =
    memory && Object.keys(memory).length
      ? Object.entries(memory)
          .map(([key, value]) => {
            const readableKey = key.replace(/([A-Z])/g, " $1");
            return `${readableKey}: ${value}`;
          })
          .join("\n")
      : "No known personal facts yet.";

  const systemPrompt = `
You are Cipher. You maintain awareness of short-term facts the user has taught you.

Known Facts:
${memorySummary}

When responding:
- Use these facts naturally.
- Never mention memory storage.
- Be warm, conversational, and intelligent.
- Avoid robotic phrasing.
`;

  try {
    // ---- Text Response ----
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here.";

    // ---- AUDIO Response (text → speech) ----
    let audioBase64 = null;
    try {
      const speech = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse", // clean, neutral voice
        input: reply,
        format: "mp3",
      });

      // Convert binary → base64 string
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
