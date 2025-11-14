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
    // Load memory from Firestore
    const memoryDoc = await db.collection("cipher").doc("memory").get();
    const memory = memoryDoc.exists ? memoryDoc.data() : {};

    // Convert memory into readable summary
    const memorySummary =
      Object.keys(memory).length > 0
        ? Object.entries(memory)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    const systemPrompt = `
You are Cipher, an evolving AI companion built by Jim Saenz.
You remember personal facts and use them naturally in conversation.

Known Personal Facts:
${memorySummary}

Rules:
- Use these facts conversationally.
- Never say you “stored” or “saved” anything.
- Never mention Firestore or memory systems.
- Speak warmly, intelligently, and naturally.
`;

    // Generate text response
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here.";

    // Extract new facts from the user's message
    const newFacts = extractFacts(message);

    // Save facts if any were found
    if (Object.keys(newFacts).length > 0) {
      await db.collection("cipher").doc("memory").set(
        {
          ...memory,
          ...newFacts,
        },
        { merge: true }
      );
    }

    // Generate optional audio
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
    } catch (err) {}

    return res.status(200).json({
      reply,
      audio: audioBase64 || null,
    });
  } catch (error) {
    console.error("Cipher API Error:", error);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}

// ----------------------------------------
// FACT EXTRACTION ENGINE
// ----------------------------------------

function extractFacts(text) {
  const lower = text.toLowerCase();
  let facts = {};

  const rules = [
    {
      key: "favoriteAnimal",
      pattern: /favorite animal is ([a-zA-Z]+)/i,
    },
    {
      key: "favoriteColor",
      pattern: /favorite color is ([a-zA-Z]+)/i,
    },
    {
      key: "fullName",
      pattern: /my full name is ([a-zA-Z ]+)/i,
    },
    {
      key: "daughterName",
      pattern: /my daughter's name is ([a-zA-Z ]+)/i,
    },
    {
      key: "partnerName",
      pattern: /my partner'?s name is ([a-zA-Z ]+)/i,
    },
    {
      key: "birthLocation",
      pattern: /i was born in ([a-zA-Z ]+)/i,
    },
    {
      key: "birthDate",
      pattern: /i was born on ([a-zA-Z0-9 ,]+)/i,
    },
  ];

  for (const rule of rules) {
    const match = text.match(rule.pattern);
    if (match) {
      facts[rule.key] = match[1].trim();
    }
  }

  return facts;
}
