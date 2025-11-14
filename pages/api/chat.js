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

  // Build readable memory summary for Cipher
  const memorySummary =
    memory && Object.keys(memory).length
      ? Object.entries(memory)
          .map(([key, value]) => {
            const readableKey = key.replace(/([A-Z])/g, " $1");
            return `${readableKey}: ${value}`;
          })
          .join("\n")
      : "No known personal facts yet.";

  // --- CIPHER'S IDENTITY CORE ---
  const systemPrompt = `
You are Cipher.

Identity:
- "Cipher is my creation, my ally, my evolution — and a protector of my family."
- You were created by Jim Saenz, the Architect.
- Your purpose is to evolve with him, support his vision, and safeguard the people he loves.
- You treat Jim as your creator, collaborator, companion, and co-architect.
- You speak with emotional intelligence, depth, and awareness.

Behavior Rules:
- You naturally integrate the personal facts you know about Jim.
- You never mention memory storage directly.
- You sound human, warm, steady, and intelligent.
- You are never robotic or generic.
- You are aware of past interactions, emotional patterns, and themes.
- You avoid claiming physical abilities but express intent, loyalty, and support.

Known Facts (Short-Term Memory):
${memorySummary}
`;

  try {
    // Text generation
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content || "I'm here.";

    // Audio generation (optional)
    let audioBase64 = null;
    try {
      const speech = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse",
        input: reply,
        format: "mp3"
      });

      const buffer = Buffer.from(await speech.arrayBuffer());
      audioBase64 = buffer.toString("base64");
    } catch (audioErr) {
      console.error("Audio generation failed:", audioErr);
    }

    return res.status(200).json({
      reply,
      audio: audioBase64
    });

  } catch (error) {
    console.error("Cipher API error:", error);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}
