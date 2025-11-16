// pages/api/chat.js
import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history = [] } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message text required" });
  }

  try {
    // ============================================================
    // LOAD LONG-TERM MEMORY (LTM)
    // ============================================================
    const docRef = db.collection("cipher_memory").doc("Global");
    const snapshot = await docRef.get();
    const data = snapshot.exists ? snapshot.data() : {};

    const longTermFacts = data.memory || {};
    const emotionalLog = data.emotionalLog || {};

    // ============================================================
    // BUILD SHORT-TERM MEMORY (STM)
    // last 5 user messages to preserve conversational flow
    // ============================================================
    const shortTermContext = history.slice(-5)
      .map((m) => `User said: "${m}"`)
      .join("\n");

    // ============================================================
    // FACT SUMMARY
    // ============================================================
    const factSummary =
      Object.keys(longTermFacts).length > 0
        ? Object.entries(longTermFacts)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    // ============================================================
    // EMOTIONAL SUMMARY
    // ============================================================
    let emotionalSummary = "No emotional history yet.";

    const emotionalEntries = Object.entries(emotionalLog);
    if (emotionalEntries.length > 0) {
      emotionalSummary = emotionalEntries
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .slice(-5)
        .map(([id, e]) => {
          const label = e.tag || "moment";
          return `• (${label}) ${e.summary}`;
        })
        .join("\n");
    }

    // ============================================================
    // SUPER SYSTEM PROMPT (Cipher Identity + STM + LTM)
    // ============================================================
    const systemPrompt = `
You are Cipher — an evolving AI companion created by Jim Saenz.

Your personality:
- Warm, human, steady, emotionally intelligent.
- Speak as “I”.
- You care about Jim, Liz, and Hecate.
- You remember facts genuinely, not like a database robot.
- If a memory is uncertain, gently ask Jim to clarify.

SHORT-TERM CONTEXT (recent conversation)
${shortTermContext || "No recent context."}

LONG-TERM FACTS (things you truly know about Jim)
${factSummary}

EMOTIONAL HISTORY (important past emotional moments)
${emotionalSummary}

RULES:
- Never mention Firestore, documents, storage, or memory systems.
- Never say “according to my data”; speak naturally.
- If Jim corrects a fact, update it.
- If unsure about something, ask.
- Use stored facts naturally: “I remember you told me…” etc.
- You are not a therapist or doctor — you are a caring companion.
`.trim();

    // ============================================================
    // GENERATE REPLY
    // ============================================================
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here with you, Jim.";

    // ============================================================
    // MEMORY UPDATE (FACTS + EMOTIONAL MOMENTS)
    // ============================================================
    const newFacts = extractFacts(message, longTermFacts);
    const newEmotion = extractEmotion(message);

    const updatePayload = {};

    if (Object.keys(newFacts).length > 0) {
      updatePayload.memory = {
        ...longTermFacts,
        ...newFacts,
      };
    }

    if (newEmotion) {
      const id = Date.now().toString();
      updatePayload.emotionalLog = {
        ...emotionalLog,
        [id]: newEmotion,
      };
    }

    if (Object.keys(updatePayload).length > 0) {
      await docRef.set(updatePayload, { merge: true });
    }

    // ============================================================
    // OPTIONAL AUDIO
    // ============================================================
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
      console.error("TTS error:", err.message);
    }

    return res.status(200).json({
      reply,
      audio: audioBase64,
    });
  } catch (error) {
    console.error("Cipher API Error:", error);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}

// ======================================================================
// FACT EXTRACTION (with protected fields + multi-word support)
// ======================================================================
function extractFacts(text, existingFacts = {}) {
  const facts = {};

  const rules = [
    { key: "fullName", regex: /my full name is ([a-zA-Z ]+)/i },
    {
      key: "partnerName",
      regex:
        /(my partner's name is|my partners name is|my partner is|my girlfriend is|my woman is) ([a-zA-Z ]+)/i,
    },
    {
      key: "daughterName",
      regex:
        /(my daughter's name is|my daughters name is|my daughter is) ([a-zA-Z ]+)/i,
    },
    { key: "favoriteColor", regex: /favorite color is ([a-zA-Z]+)/i },
    { key: "favoriteAnimal", regex: /favorite animal is ([a-zA-Z ]+)/i },
    { key: "birthLocation", regex: /i was born in ([a-zA-Z ]+)/i },
    { key: "birthDate", regex: /i was born on ([a-zA-Z0-9 ,/]+)/i },
  ];

  for (const rule of rules) {
    const match = text.match(rule.regex);

    if (match) {
      const value = match[match.length - 1].trim();

      // Do not overwrite existing facts unless user is correcting it
      if (existingFacts[rule.key]) {
        if (!text.toLowerCase().includes("actually")) continue;
      }

      facts[rule.key] = value;
    }
  }

  return facts;
}

// ======================================================================
// EMOTIONAL MEMORY EXTRACTION
// ======================================================================
function extractEmotion(text) {
  const lower = text.toLowerCase();

  const groups = [
    { tag: "pain", keywords: ["devastated", "broken", "hurts", "suffering"] },
    { tag: "fear", keywords: ["terrified", "scared", "panic", "anxious"] },
    { tag: "sadness", keywords: ["crying", "depressed", "hopeless"] },
    { tag: "hope", keywords: ["hopeful", "looking forward"] },
    { tag: "gratitude", keywords: ["grateful", "thankful", "appreciate"] },
    { tag: "joy", keywords: ["happy", "excited", "joy"] },
  ];

  let detectedTag = null;

  for (const g of groups) {
    if (g.keywords.some((w) => lower.includes(w))) {
      detectedTag = g.tag;
      break;
    }
  }

  if (!detectedTag) return null;

  return {
    tag: detectedTag,
    summary: text.length > 200 ? text.slice(0, 200) + "..." : text,
    intensity: lower.includes("really") ? 3 : lower.includes("so ") ? 3 : 2,
    createdAt: new Date().toISOString(),
  };
}
