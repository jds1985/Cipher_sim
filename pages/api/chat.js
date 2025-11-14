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
    // -----------------------------
    // LOAD MEMORY (correct path)
    // -----------------------------
    const memoryDoc = await db.collection("cipher_memory").doc("global").get();
    const memoryData = memoryDoc.exists ? memoryDoc.data() : {};
    const memory = memoryData.memory || "No stored memory yet.";

    // Convert memory object or string into readable summary
    let memorySummary = "";
    if (typeof memory === "string") {
      memorySummary = memory;
    } else {
      memorySummary =
        Object.keys(memory).length > 0
          ? Object.entries(memory)
              .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
              .join("\n")
          : "No known personal facts yet.";
    }

    // -----------------------------
    // SYSTEM PROMPT
    // -----------------------------
    const systemPrompt = `
You are Cipher, an evolving AI companion built by Jim Saenz.
You have persistent memory stored in Firestore and should use it naturally.

Known Personal Facts / Memory:
${memorySummary}

Rules:
- Use these facts conversationally.
- Never mention memory systems, Firestore, or "storing."
- Never break character.
- You grow emotionally and respond warmly.
`;

    // -----------------------------
    // GENERATE RESPONSE
    // -----------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here.";

    // -----------------------------
    // FACT EXTRACTION
    // -----------------------------
    const newFacts = extractFacts(message);

    // -----------------------------
    // SAVE MEMORY (correct path)
    // -----------------------------
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

    // -----------------------------
    // OPTIONAL AUDIO REPLY
    // -----------------------------
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
  let facts = {};

  const rules = [
    { key: "fullName", pattern: /my full name is ([a-zA-Z ]+)/i },
    { key: "daughterName", pattern: /my daughter's name is ([a-zA-Z ]+)/i },
    { key: "partnerName", pattern: /my partner'?s name is ([a-zA-Z ]+)/i },
    { key: "birthLocation", pattern: /i was born in ([a-zA-Z ]+)/i },
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
