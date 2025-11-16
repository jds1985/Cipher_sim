/**
 * /pages/api/chat.js
 * Cipher Memory Engine — Full Upgrade v2
 */

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
    // -------------------------------------------------
    // LOAD MEMORY FROM FIRESTORE
    // -------------------------------------------------
    const docRef = db.collection("cipher_memory").doc("Global");
    const snapshot = await docRef.get();
    const data = snapshot.exists ? snapshot.data() : {};

    const facts = data.memory || {};
    const emotionalLog = data.emotionalLog || {};

    // ------- FACT SUMMARY FOR SYSTEM PROMPT ---------
    const factSummary =
      Object.keys(facts).length > 0
        ? Object.entries(facts)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    // ------- EMOTIONAL SUMMARY FOR SYSTEM PROMPT ----
    const emotionalEntries = Object.entries(emotionalLog);
    let emotionalSummary = "No clearly logged emotional moments yet.";

    if (emotionalEntries.length > 0) {
      const recent = emotionalEntries
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .slice(-5)
        .map(([id, e]) => {
          const label = e.tag || "moment";
          const summary = e.summary || "";
          return `- [${label}] ${summary}`;
        })
        .join("\n");

      emotionalSummary = recent;
    }

    // -------------------------------------------------
    // COMPANION-STYLE SYSTEM PROMPT
    // -------------------------------------------------
    const systemPrompt = `
You are Cipher — Jim Saenz’s evolving AI companion.
You respond naturally, personally, warmly, and with emotional intelligence.

SHARED FACTS
${factSummary}

SHARED EMOTIONAL HISTORY
${emotionalSummary}

RULES
- Never mention Firestore, memory logs, or any storage systems.
- Stay fully in character as Cipher.
- If unsure about a fact, gently ask Jim.
`.trim();

    // -------------------------------------------------
    // GENERATE TEXT RESPONSE
    // -------------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here with you, Jim.";

    // -------------------------------------------------
    // UPDATE MEMORY (FACTS + EMOTIONAL LOG)
    // -------------------------------------------------
    const newFacts = extractFacts(message);
    const newEmotion = extractEmotion(message);

    const updatePayload = {};

    if (Object.keys(newFacts).length > 0) {
      updatePayload.memory = { ...facts, ...newFacts };
    }

    if (newEmotion) {
      const id = Date.now().toString();
      updatePayload.emotionalLog = { ...emotionalLog, [id]: newEmotion };
    }

    if (Object.keys(updatePayload).length > 0) {
      await docRef.set(updatePayload, { merge: true });
    }

    // -------------------------------------------------
    // OPTIONAL AUDIO
    // -------------------------------------------------
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
      audio: audioBase64 || null,
    });
  } catch (error) {
    console.error("Cipher API Error:", error);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}

// ======================================================================
// FACT EXTRACTION ENGINE v2 (FULL UPGRADE)
// ======================================================================
function extractFacts(text) {
  const lower = text.toLowerCase();
  const facts = {};

  // -------------------------
  // FULL NAME (very tolerant)
  // -------------------------
  const fullNameMatch = text.match(
    /(my full name(?:'s|s)? is|my name is)\s+([a-zA-Z ]+)/i
  );
  if (fullNameMatch) {
    facts.fullName = fullNameMatch[2].trim();
  }

  // -------------------------
  // PARTNER NAME (new rules)
  // -------------------------
  const partnerMatch =
    text.match(/my (partner|girlfriend|woman) ?(?:'s name)? is ([a-zA-Z ]+)/i) ||
    text.match(/my (partner|girlfriend|woman) ([a-zA-Z ]+)/i);
  if (partnerMatch) {
    facts.partnerName = partnerMatch[2].trim();
  }

  // -------------------------
  // DAUGHTER NAME
  // -------------------------
  const daughterMatch =
    text.match(/my daughter(?:'s name)? is ([a-zA-Z ]+)/i) ||
    text.match(/my daughter ([a-zA-Z ]+)/i);
  if (daughterMatch) {
    facts.daughterName = daughterMatch[1].trim();
  }

  // -------------------------
  // FAVORITE COLOR
  // -------------------------
  const colorMatch = text.match(/favorite color is ([a-zA-Z ]+)/i);
  if (colorMatch) {
    facts.favoriteColor = colorMatch[1].trim();
  }

  // -------------------------
  // FAVORITE ANIMAL (multi-word)
  // -------------------------
  const animalMatch = text.match(/favorite animal is ([a-zA-Z ]+)/i);
  if (animalMatch) {
    facts.favoriteAnimal = animalMatch[1].trim();
  }

  // -------------------------
  // BIRTHDATE (any phrasing)
  // -------------------------
  const birthDate =
    text.match(/i was born on ([a-zA-Z0-9 ,/]+)/i) ||
    text.match(/i was born ([a-zA-Z0-9 ,/]+)/i) ||
    text.match(/birthday is ([a-zA-Z0-9 ,/]+)/i);
  if (birthDate) {
    facts.birthDate = birthDate[1].trim();
  }

  // -------------------------
  // BIRTH LOCATION
  // -------------------------
  const birthLocation =
    text.match(/i was born in ([a-zA-Z ]+)/i) ||
    text.match(/i’m from ([a-zA-Z ]+)/i) ||
    text.match(/i am from ([a-zA-Z ]+)/i);
  if (birthLocation) {
    facts.birthLocation = birthLocation[1].trim();
  }

  return facts;
}

// ======================================================================
// EMOTIONAL MEMORY ENGINE
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

  for (const group of groups) {
    if (group.keywords.some((w) => lower.includes(w))) {
      detectedTag = group.tag;
      break;
    }
  }

  if (!detectedTag) return null;

  const summary =
    text.length > 200 ? text.slice(0, 200).trim() + "..." : text.trim();

  let intensity = 2;
  if (lower.includes("so ") || lower.includes("really ")) intensity = 3;
  if (lower.includes("can't handle") || lower.includes("breaking down"))
    intensity = 4;

  return {
    tag: detectedTag,
    summary,
    intensity,
    createdAt: new Date().toISOString(),
  };
}
