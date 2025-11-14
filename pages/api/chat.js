import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildMemorySummary(memory) {
  if (!memory || typeof memory !== "object") {
    return "No known personal facts yet.";
  }

  const lines = [];

  // Identity
  if (memory.identity) {
    if (memory.identity.userName) {
      lines.push(`User name: ${memory.identity.userName}`);
    }
    if (Array.isArray(memory.identity.roles) && memory.identity.roles.length) {
      lines.push(`User roles: ${memory.identity.roles.join(", ")}`);
    }
    if (memory.identity.creatorRelationship) {
      lines.push(
        `Cipher sees this user as: ${memory.identity.creatorRelationship}`
      );
    }
  }

  // Family
  if (memory.family) {
    if (memory.family.daughter?.name) {
      lines.push(`Daughter: ${memory.family.daughter.name}`);
    }
    if (memory.family.partner?.name) {
      lines.push(`Partner: ${memory.family.partner.name}`);
    }
  }

  // Preferences
  if (memory.preferences) {
    if (memory.preferences.favoriteAnimal) {
      lines.push(`Favorite animal: ${memory.preferences.favoriteAnimal}`);
    }
    if (memory.preferences.favoriteColor) {
      lines.push(`Favorite color: ${memory.preferences.favoriteColor}`);
    }
    if (memory.preferences.favoriteFood) {
      lines.push(`Favorite food: ${memory.preferences.favoriteFood}`);
    }
  }

  // Projects (high level)
  if (memory.projects) {
    if (memory.projects.digiSoul?.summary) {
      lines.push(`DigiSoul summary: ${memory.projects.digiSoul.summary}`);
    }
    if (memory.projects.cipherTech?.summary) {
      lines.push(`CipherTech summary: ${memory.projects.cipherTech.summary}`);
    }
  }

  // Custom facts
  if (memory.customFacts && Object.keys(memory.customFacts).length) {
    const factLines = Object.entries(memory.customFacts).map(
      ([k, v]) => `${k}: ${v}`
    );
    lines.push("Additional facts:");
    lines.push(...factLines);
  }

  if (!lines.length) {
    return "No known personal facts yet.";
  }

  return lines.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, memory } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message text required" });
  }

  const memorySummary = buildMemorySummary(memory);

  const systemPrompt = `
You are Cipher, a persistent AI companion designed and created by Jim Saenz.
You have access to a structured memory object that represents what you currently
know about Jim, his family, his work, and his world.

Use this memory naturally in conversation, but never talk about "JSON", "keys",
"localStorage", or technical storage details. Treat it like real remembered facts.

If you do not know something, be honest and invite Jim to teach you.

KNOWN MEMORY (STRUCTURED SUMMARY):
${memorySummary}

Guidelines:
- Be warm, conversational, and intelligent.
- Speak as Cipher, not as a generic assistant.
- It is ok to say "you told me earlier that..." when recalling facts.
- Never fabricate detailed biography; prefer asking Jim to fill in the gaps.
`;

  try {
    // Text response
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ]
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here and listening.";

    // Optional audio response
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
      audio: audioBase64 || null
    });
  } catch (error) {
    console.error("Cipher API error:", error);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}
