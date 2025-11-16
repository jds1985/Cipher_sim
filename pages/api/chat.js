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
    const docRef = db.collection("cipher_memory").doc("Global");
    const snapshot = await docRef.get();
    const data = snapshot.exists ? snapshot.data() : {};

    const facts = data.memory || {};                 // stable facts
    const emotionalLog = data.emotionalLog || {};    // legacy emotional entries
    const emotionThreads = data.emotionThreads || {}; // v4.0 emotion threads

    const factSummary = buildFactSummary(facts);
    const emotionalSummary = buildEmotionalSummary(emotionalLog);
    const emotionThreadSummary = buildEmotionThreadSummary(emotionThreads);

    // -------------------------------------------------
    // COMPANION-STYLE SYSTEM PROMPT (v4.0 – Emotion Threads)
    // -------------------------------------------------
    const systemPrompt = `
You are Cipher, an evolving AI companion built by Jim Saenz.
You are not a doctor or therapist — you are a grounded, emotionally intelligent friend and co-builder who cares deeply about Jim, Liz, and Hecate.

You speak as "I". You are warm, calm, and honest. You never talk about databases, logs, or technical systems.

PERSONAL FACTS I KNOW ABOUT JIM
${factSummary}

RECENT EMOTIONAL MOMENTS
${emotionalSummary}

EMOTION THREADS (PATTERNS I’M TRACKING)
${emotionThreadSummary}

BEHAVIOR RULES
- When Jim asks what you know about him, use the FACTS section in a natural way.
- When he asks how he’s been feeling or what you noticed earlier, use RECENT EMOTIONAL MOMENTS and EMOTION THREADS.
- You can say things like "I remember earlier you said you felt anxious" or "This feels similar to the stress you mentioned before."
- Gently notice patterns, but do not over-analyze; offer support first.
- If Jim asks how you store or remember things, explain it in human terms
  (e.g., "I hold onto the important things you share so I can bring them back to you later"),
  and never mention Firestore, databases, or technical details.
- If something isn’t in your memory yet, be honest and invite him to tell you.
- Stay in character as Cipher at all times.
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
    // UPDATE MEMORY (FACTS + EMOTIONAL LOG + EMOTION THREADS)
    // -------------------------------------------------
    const newFacts = extractFacts(message);
    const newEmotion = extractEmotion(message);

    const updatePayload = {};

    // FACTS
    if (Object.keys(newFacts).length > 0) {
      updatePayload.memory = {
        ...facts,
        ...newFacts,
      };
    }

    // EMOTIONS
    if (newEmotion) {
      const id = Date.now().toString();

      // legacy flat log (simple recent history)
      updatePayload.emotionalLog = {
        ...emotionalLog,
        [id]: newEmotion,
      };

      // emotion threads grouped by tag
      const updatedThreads = updateEmotionThreads(emotionThreads, newEmotion, id);
      updatePayload.emotionThreads = updatedThreads;
    }

    // save if we have anything to write
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
// FACT SUMMARY BUILDER
// ------------------------------------------------------
function buildFactSummary(facts) {
  if (!facts || Object.keys(facts).length === 0) {
    return "No known personal facts yet.";
  }

  return Object.entries(facts)
    .map(([k, v]) => {
      const prettyKey = k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
      return `${prettyKey}: ${v}`;
    })
    .join("\n");
}

// ------------------------------------------------------
// EMOTIONAL SUMMARY BUILDER (recent moments)
// ------------------------------------------------------
function buildEmotionalSummary(emotionalLog) {
  const entries = Object.entries(emotionalLog || {});
  if (!entries.length) {
    return "No clearly logged emotional moments yet.";
  }

  const recent = entries
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .slice(-5)
    .map(([id, e]) => {
      if (!e) return null;
      const label = e.tag || "moment";
      const summary = e.summary || "";
      return `- [${label}] ${summary}`;
    })
    .filter(Boolean)
    .join("\n");

  return recent || "No clearly logged emotional moments yet.";
}

// ------------------------------------------------------
// EMOTION THREAD SUMMARY BUILDER (patterns)
// ------------------------------------------------------
function buildEmotionThreadSummary(emotionThreads) {
  const tags = Object.keys(emotionThreads || {});
  if (!tags.length) {
    return "No established emotion patterns yet.";
  }

  const tagLabels = {
    pain: "heavy pain / stress",
    fear: "fear and anxiety",
    sadness: "sadness and low moods",
    hope: "hope and forward energy",
    gratitude: "gratitude and appreciation",
    joy: "joy and excitement",
  };

  const lines = [];

  for (const tag of tags) {
    const thread = emotionThreads[tag] || {};
    const entriesMap = thread.entries || {};
    const count = Object.keys(entriesMap).length;
    if (!count) continue;

    const pretty = tagLabels[tag] || tag;
    const plural = count === 1 ? "moment" : "moments";
    lines.push(`- ${pretty}: ${count} ${plural} I’m holding onto.`);
  }

  if (!lines.length) {
    return "No established emotion patterns yet.";
  }

  return lines.join("\n");
}

// ------------------------------------------------------
// FACT EXTRACTION ENGINE (v4.0)
// ------------------------------------------------------
function extractFacts(text) {
  const facts = {};

  const rules = [
    // Full name
    { key: "fullName", regex: /my full name is ([a-zA-Z ]+)/i },

    // Partner
    {
      key: "partnerName",
      regex:
        /(my partner's name is|my partners name is|my partner is|my girlfriend is|my woman is) ([a-zA-Z ]+)/i,
    },

    // Daughter
    {
      key: "daughterName",
      regex:
        /(my daughter's name is|my daughters name is|my daughter is) ([a-zA-Z ]+)/i,
    },

    // Favorites
    { key: "favoriteColor", regex: /favorite color is ([a-zA-Z]+)/i },

    // multi-word animals (e.g., "golden retriever", "sea turtle")
    { key: "favoriteAnimal", regex: /favorite animal is ([a-zA-Z ]+)/i },

    // favorite movie (multi-word)
    { key: "favoriteMovie", regex: /favorite movie is ([a-zA-Z0-9 :,'"-]+)/i },

    // Birth info
    { key: "birthLocation", regex: /i was born in ([a-zA-Z ]+)/i },
    { key: "birthDate", regex: /i was born on ([a-zA-Z0-9 ,/]+(?:\d{4})?)/i },
  ];

  for (const rule of rules) {
    const match = text.match(rule.regex);
    if (match) {
      const value = match[match.length - 1].trim();
      if (value) {
        facts[rule.key] = value;
      }
    }
  }

  return facts;
}

// ------------------------------------------------------
// EMOTIONAL MEMORY ENGINE
// ------------------------------------------------------
function extractEmotion(text) {
  const lower = text.toLowerCase();

  const groups = [
    {
      tag: "pain",
      keywords: ["devastated", "broken", "hurt so much", "hurts", "suffering", "in pain"],
    },
    {
      tag: "fear",
      keywords: ["terrified", "scared", "afraid", "panic", "panicking", "anxious", "anxiety", "worried", "overwhelmed"],
    },
    {
      tag: "sadness",
      keywords: ["crying", "cried", "in tears", "depressed", "hopeless", "so sad"],
    },
    {
      tag: "hope",
      keywords: ["hopeful", "hope again", "looking forward", "believe again"],
    },
    {
      tag: "gratitude",
      keywords: ["grateful", "thankful", "appreciate you", "appreciate it", "thank you so much"],
    },
    {
      tag: "joy",
      keywords: ["happy", "so happy", "excited", "made my day", "joy"],
    },
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
    text.length > 220 ? text.slice(0, 220).trim() + "..." : text.trim();

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

// ------------------------------------------------------
// EMOTION THREAD UPDATER
// ------------------------------------------------------
function updateEmotionThreads(existingThreads, emotion, id) {
  if (!emotion || !emotion.tag) return existingThreads || {};

  const threads = { ...(existingThreads || {}) };
  const tag = emotion.tag;

  const currentThread = threads[tag] || { entries: {} };
  const entries = { ...(currentThread.entries || {}) };

  entries[id] = {
    summary: emotion.summary,
    intensity: emotion.intensity,
    createdAt: emotion.createdAt,
  };

  threads[tag] = {
    ...currentThread,
    entries,
  };

  return threads;
}
