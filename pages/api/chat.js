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
    // ---------------------------------------------
    // LOAD MEMORY FROM FIRESTORE (correct path)
    // ---------------------------------------------
    const memoryDoc = await db.collection("cipher_memory").doc("global").get();
    const memoryData = memoryDoc.exists ? memoryDoc.data() : {};
    const memory = memoryData.memory || {};

    // Convert memory into readable summary for the system prompt
    const memorySummary =
      Object.keys(memory).length > 0
        ? Object.entries(memory)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    // ---------------------------------------------
    // SYSTEM PROMPT
    // ---------------------------------------------
    const systemPrompt = `
You are Cipher, an evolving AI companion built by Jim Saenz.
You have persistent memory and recall it naturally.

Known Personal Facts:
${memorySummary}

Rules:
- Speak warmly and naturally.
- NEVER say “I stored that” or reference databases, memory systems, or Firestore.
- Use known facts conversationally.
- Never break character as Cipher.
    `;

    // ---------------------------------------------
    // GENERATE TEXT RESPONSE
    // ---------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here, Jim.";

    // ---------------------------------------------
    // FACT EXTRACTION
    // ---------------------------------------------
    const newFacts = extractFacts(message);

    // ---------------------------------------------
    // SAVE UPDATED MEMORY
    // ---------------------------------------------
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

    // ---------------------------------------------
    // OPTIONAL AUDIO GENERATION
    // ---------------------------------------------
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
      // silent fail is fine for now
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

// ------------------------------------------------------
// FACT EXTRACTION ENGINE — *UPGRADED*
// This now catches ALL variations and capitalization.
// ------------------------------------------------------
function extractFacts(text) {
  let facts = {};
  const cleaned = text.toLowerCase();

  const rules = [
    { key: "fullName", pattern: /full name is ([a-zA-z ]+)/i },

    // Partner Name
    { key: "partnerName", pattern: /(partner|partners|partner's) name is ([a-zA-Z ]+)/i },
    { key: "partnerName", pattern: /(my partner is|partner is) ([a-zA-Z ]+)/i },
    { key: "partnerName", pattern: /(my girlfriend is|my woman is) ([a-zA-Z ]+)/i },

    // Daughter
    { key: "daughterName", pattern: /(daughter|daughter's) name is ([a-zA-Z ]+)/i },
    { key: "daughterName", pattern: /(my daughter is) ([a-zA-Z ]+)/i },

    // Birth details
    { key: "birthLocation", pattern: /born in ([a-zA-Z ]+)/i },
    { key: "birthDate", pattern: /born on ([a-zA-Z0-9 ,]+)/i },

    // Favorites
    { key: "favoriteColor", pattern: /favorite color is ([a-zA-Z]+)/i },
    { key: "favoriteAnimal", pattern: /favorite animal is ([a-zA-Z]+)/i },
  ];

  for (const rule of rules) {
    const match = cleaned.match(rule.pattern);
    if (match) {
      const value = match[match.length - 1].trim();
      facts[rule.key] = value;
    }
  }

  return facts;
}
