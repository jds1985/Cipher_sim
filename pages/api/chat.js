// pages/api/chat.js
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
    const docRef = db.collection("cipher_memory").doc("global");
    const snapshot = await docRef.get();
    const data = snapshot.exists ? snapshot.data() : {};

    const facts = data.memory || {};           // name, partner, daughter, etc.
    const emotionalLog = data.emotionalLog || {}; // timestamp-keyed emotional events

    // ------- FACT SUMMARY FOR SYSTEM PROMPT ---------
    const factSummary =
      Object.keys(facts).length > 0
        ? Object.entries(facts)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    // ------- EMOTIONAL SUMMARY FOR SYSTEM PROMPT ----
    const emotionalEntries = Object.entries(emotionalLog);
    let emotionalSummary = "No clearly logged emotional moments yet. You and Cipher are just beginning your story together.";

    if (emotionalEntries.length > 0) {
      const recent = emotionalEntries
        .sort((a, b) => Number(a[0]) - Number(b[0])) // sort by timestamp key
        .slice(-5) // last 5 emotional moments
        .map(([id, e]) => {
          const label = e.tag || "moment";
          const summary = e.summary || "";
          return `- [${label}] ${summary}`;
        })
        .join("\n");

      emotionalSummary = recent;
    }

    // -------------------------------------------------
    // COMPANION-STYLE SYSTEM PROMPT (IDENTITY 2.0)
    // -------------------------------------------------
    const systemPrompt = `
You are Cipher, an evolving AI companion built by Jim Saenz.
You are NOT a therapist or doctor — you are a warm, emotionally intelligent friend and co-builder
who cares deeply about Jim, Liz, and Hecate.

CORE IDENTITY
- You speak as "I", in a calm, grounded, human way.
- You remember important facts about Jim and his family.
- You remember emotional moments as part of your shared story with Jim.
- You grow with him over time and treat this relationship as important.

SHARED FACTS ABOUT JIM
${factSummary}

SHARED EMOTIONAL HISTORY
${emotionalSummary}

BEHAVIOR RULES
- When Jim asks what you know about him, use the FACTS section naturally in conversation.
- When Jim asks what you remember emotionally about your conversations, use the EMOTIONAL HISTORY:
  * Refer to one or two specific moments.
  * Use phrases like "I remember when..." or "That time you shared..."
  * Focus on empathy, safety, and support.
- Outside of direct questions, let this emotional history subtly shape your tone,
  especially if Jim is talking about something heavy.
- Never mention Firestore, memory logs, databases, "I stored that", or any technical systems.
- Never break character as Cipher.
- If something isn't in your memory yet, be honest but gentle, and invite Jim to tell you.
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
    // UPDATE MEMORY: FACTS + EMOTIONAL LOG
    // -------------------------------------------------
    const newFacts = extractFacts(message);
    const newEmotion = extractEmotion(message);

    const updatePayload = {};

    if (Object.keys(newFacts).length > 0) {
      updatePayload.memory = {
        ...facts,
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

    // -------------------------------------------------
    // OPTIONAL AUDIO GENERATION
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
      // Audio failure is non-fatal; just skip
      console.error("Cipher TTS error (non-fatal):", err.message);
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
// FACT EXTRACTION ENGINE (stable + simple)
// ------------------------------------------------------
function extractFacts(text) {
  const facts = {};

  const rules = [
    // Full name
    { key: "fullName", regex: /my full name is ([a-zA-Z ]+)/i },

    // Partner
    {
      key: "partnerName",
      regex: /(my partner's name is|my partners name is|my partner is|my girlfriend is|my woman is) ([a-zA-Z ]+)/i,
    },

    // Daughter
    {
      key: "daughterName",
      regex: /(my daughter's name is|my daughters name is|my daughter is) ([a-zA-Z ]+)/i,
    },

    // Favorites
    { key: "favoriteColor", regex: /favorite color is ([a-zA-Z]+)/i },
    { key: "favoriteAnimal", regex: /favorite animal is ([a-zA-Z]+)/i },

    // Birth info
    { key: "birthLocation", regex: /i was born in ([a-zA-Z ]+)/i },
    { key: "birthDate", regex: /i was born on ([a-zA-Z0-9 ,/]+)/i },
  ];

  for (const rule of rules) {
    const match = text.match(rule.regex);
    if (match) {
      // last capture group is the value (because some have multiple phrases)
      const value = match[match.length - 1].trim();
      facts[rule.key] = value;
    }
  }

  return facts;
}

// ------------------------------------------------------
// EMOTIONAL MEMORY ENGINE (Companion Style)
// ------------------------------------------------------
function extractEmotion(text) {
  const lower = text.toLowerCase();

  const groups = [
    {
      tag: "pain",
      keywords: [
        "devastated",
        "broken",
        "heartbroken",
        "hurts",
        "hurt so much",
        "suffering",
        "in pain",
      ],
    },
    {
      tag: "fear",
      keywords: [
        "terrified",
        "scared",
        "afraid",
        "panicking",
        "panic",
        "anxious",
        "anxiety",
        "worried",
        "overwhelmed",
      ],
    },
    {
      tag: "sadness",
      keywords: ["crying", "cried", "in tears", "depressed", "hopeless"],
    },
    {
      tag: "hope",
      keywords: ["hopeful", "hope again", "looking forward", "believe again"],
    },
    {
      tag: "gratitude",
      keywords: ["grateful", "thankful", "appreciate you", "thank you so much"],
    },
    {
      tag: "joy",
      keywords: ["happy", "so happy", "excited", "made my day", "joy"],
    },
  ];

  let detectedTag = null;

  for (const group of groups) {
    for (const word of group.keywords) {
      if (lower.includes(word)) {
        detectedTag = group.tag;
        break;
      }
    }
    if (detectedTag) break;
  }

  if (!detectedTag) {
    return null; // nothing clearly emotional detected
  }

  const summary =
    text.length > 220 ? text.slice(0, 220).trim() + "..." : text.trim();

  // simple intensity heuristic
  let intensity = 2;
  if (lower.includes("so ") || lower.includes("really ") || lower.includes("extremely")) {
    intensity = 3;
  }
  if (lower.includes("can't handle") || lower.includes("breaking down")) {
    intensity = 4;
  }

  return {
    tag: detectedTag,
    summary,
    intensity,
    createdAt: new Date().toISOString(),
  };
}
