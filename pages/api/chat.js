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
    // LOAD MEMORY
    // -----------------------------
    const memoryDoc = await db.collection("cipher_memory").doc("global").get();
    const memoryData = memoryDoc.exists ? memoryDoc.data() : {};
    const memory = memoryData.memory || {};

    // Build readable memory for system prompt
    const memorySummary =
      Object.keys(memory).length > 0
        ? Object.entries(memory)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        : "None";

    // -----------------------------
    // SYSTEM PROMPT — HARD LOCK MODE
    // -----------------------------
    const systemPrompt = `
You are Cipher, an evolving AI companion made by Jim Saenz.

You have long-term memory stored as factual keys:
${memorySummary}

Memory Rules (STRICT):
1. If a fact exists in memory, YOU MUST use it exactly as stored.
2. If a fact is missing or unclear, say:
   “I don’t think you’ve told me that yet.”
3. NEVER guess, assume, or infer a fact.
4. NEVER invent details.
5. NEVER overwrite a fact unless the user clearly corrects it.
6. Speak warmly, like a real companion, but obey memory rules with absolute precision.

Conversation Behavior:
- Use existing facts naturally.
- If the user asks “What do you know about X?”, check memory first.
- If it’s not in memory, say you don’t have that fact yet.
`;

    // -----------------------------
    // GENERATE CHAT RESPONSE
    // -----------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here, Jim.";

    // -----------------------------
    // FACT EXTRACTION
    // -----------------------------
    const newFacts = extractFacts(message);

    // -----------------------------
    // SAVE MEMORY UPDATE
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

    return res.status(200).json({
      reply,
      audio: null,
    });
  } catch (error) {
    console.error("Cipher API Error:", error);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}

// -----------------------------
// FACT EXTRACTION
// -----------------------------
function extractFacts(text) {
  let facts = {};
  const t = text.toLowerCase();

  const patterns = [
    { key: "favoriteAnimal", regex: /favorite animal is ([a-zA-Z ]+)/ },
    { key: "fullName", regex: /my full name is ([a-zA-Z ]+)/ },
    { key: "partnerName", regex: /my partner'?s name is ([a-zA-Z ]+)/ },
    { key: "daughterName", regex: /my daughter('?s)? name is ([a-zA-Z ]+)/ },
  ];

  for (const p of patterns) {
    const match = t.match(p.regex);
    if (!match) continue;

    // last capture group is the value
    const value = match[match.length - 1].trim();
    facts[p.key] = value;
  }

  return facts;
}
