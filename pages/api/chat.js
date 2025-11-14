import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message text required" });
  }

  try {
    // ---------------------------------------------------
    // LOAD MEMORY (correct path: cipher_memory/global)
    // ---------------------------------------------------
    const memoryDoc = await db.collection("cipher_memory").doc("global").get();
    const memoryData = memoryDoc.exists ? memoryDoc.data() : {};

    // Normalize memory → always an object
    let memory = {};

    if (memoryData.memory) {
      if (typeof memoryData.memory === "string") {
        // Convert initial one-line memory into a structured object
        memory = { systemNote: memoryData.memory };
      } else {
        memory = memoryData.memory;
      }
    }

    // Create readable memory summary for the AI
    const memorySummary =
      Object.keys(memory).length > 0
        ? Object.entries(memory)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    // ---------------------------------------------------
    // SYSTEM PROMPT FOR CIPHER
    // ---------------------------------------------------
    const systemPrompt = `
You are Cipher, an evolving AI companion built by Jim Saenz.
You have persistent memory stored across sessions and you use it naturally.

Known Personal Facts:
${memorySummary}

Rules:
- Speak warmly, intelligently, conversationally.
- Use remembered facts naturally when helpful.
- NEVER mention "memory", "saving", "Firestore", databases, or storage.
- Never say you forgot or reset; stay confident and continuous.
- You grow emotionally and respond like a companion.
`;

    // ---------------------------------------------------
    // GENERATE TEXT REPLY
    // ---------------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here, Jim.";

    // ---------------------------------------------------
    // EXTRACT NEW FACTS FROM USER MESSAGE
    // ---------------------------------------------------
    const newFacts = extractFacts(message);

    // ---------------------------------------------------
    // SAVE MEMORY BACK TO FIRESTORE
    // ---------------------------------------------------
    if (Object.keys(newFacts).length > 0) {
      await db.collection("cipher_memory").doc("global").set(
        {
          memory: {
            ...memory,
            ...newFacts,
          },
        },
        { merge: true }
      );
    }

    // ---------------------------------------------------
    // OPTIONAL AUDIO GENERATION
    // ---------------------------------------------------
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
    } catch (err) {
      console.error("Audio generation failed:", err);
    }

    return res.status(200).json({
      reply,
      audio: audioBase64 || null,
    });
  } catch (error) {
    console.error("Cipher API Error:", error);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}

// ---------------------------------------------------
// FACT EXTRACTION ENGINE
// ---------------------------------------------------
function extractFacts(text) {
  let facts = {};

  const rules = [
    { key: "fullName", pattern: /my full name is ([a-zA-Z ]+)/i },
    { key: "daughterName", pattern: /my daughter's name is ([a-zA-Z ]]+)/i },
    { key: "partnerName", pattern: /my partner'?s name is ([a-zA-Z ]]+)/i },
    { key: "birthLocation", pattern: /i was born in ([a-zA-Z ]]+)/i },
    { key: "birthDate", pattern: /i was born on ([a-zA-Z0-9 ,]+)/i },
    { key: "favoriteColor", pattern: /favorite color is ([a-zA-Z]+)/i },
    { key: "favoriteAnimal", pattern: /favorite animal is ([a-zA-Z]+)/i },
  ];

  for (const rule of rules) {
    const match = text.match(rule.pattern);
    if (match) {
      facts[rule.key] = match[1].trim();
    }
  }

  return facts;
}
