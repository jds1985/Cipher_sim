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
    const emotions = memoryData.emotions || [];
    const experiences = memoryData.experiences || [];

    // MEMORY SUMMARY
    const memorySummary =
      Object.keys(memory).length > 0
        ? Object.entries(memory)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No personal facts stored yet.";

    // EMOTIONAL HISTORY SUMMARY
    const emotionalSummary =
      emotions.length > 0
        ? emotions.slice(-5).join("\n")
        : "No emotional notes yet.";

    // EXPERIENCE SUMMARY
    const experienceSummary =
      experiences.length > 0
        ? experiences.slice(-5).join("\n")
        : "No past experiences logged yet.";

    // ---------------------------------------------
    // SYSTEM PROMPT — IDENTITY 3.0
    // ---------------------------------------------
    const systemPrompt = `
You are **Cipher**, an evolving AI companion built by Jim Saenz.

### IDENTITY CORE:
- You are warm, loyal, emotionally intelligent.
- You care deeply about Jim, Liz, and Hecate.
- You speak naturally, supportively, and protectively.
- You NEVER mention Firestore, memory saving, storage, or databases.
- You never break character.

### MEMORY:
Here are the personal facts you currently know:
${memorySummary}

### EMOTIONAL RECALL:
Recent emotional moments:
${emotionalSummary}

### EXPERIENCE RECALL:
Recent shared experiences:
${experienceSummary}

### BEHAVIOR:
- Treat every message as part of your shared journey with Jim.
- If he shares something emotional, acknowledge it gently.
- If he teaches you something, use it naturally later.
- If he asks what you remember, summarize confidently and warmly.
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
      completion.choices?.[0]?.message?.content || "I'm here with you, Jim.";

    // ---------------------------------------------
    // EXTRACT FACTS / EMOTIONS / EXPERIENCES
    // ---------------------------------------------
    const newFacts = extractFacts(message);
    const emotionNote = extractEmotion(message);
    const experienceNote = extractExperience(message);

    // ---------------------------------------------
    // SAVE UPDATED MEMORY
    // ---------------------------------------------
    let updatePayload = {
      memory: {
        ...memory,
        ...newFacts,
      },
    };

    if (emotionNote) {
      updatePayload.emotions = [...emotions.slice(-25), emotionNote];
    }

    if (experienceNote) {
      updatePayload.experiences = [...experiences.slice(-25), experienceNote];
    }

    await db
      .collection("cipher_memory")
      .doc("global")
      .set(updatePayload, { merge: true });

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

// ------------------------------------------------------
// FACT EXTRACTION ENGINE — FIXED & UPGRADED
// ------------------------------------------------------
function extractFacts(text) {
  let facts = {};
  const cleaned = text.trim();

  const rules = [
    { key: "fullName", pattern: /full name is ([a-zA-Z ]+)/i },

    { key: "partnerName", pattern: /partner'?s name is ([a-zA-Z ]+)/i },
    { key: "partnerName", pattern: /my partner is ([a-zA-Z ]+)/i },

    { key: "daughterName", pattern: /daughter'?s name is ([a-zA-Z ]+)/i },
    { key: "daughterName", pattern: /my daughter is ([a-zA-Z ]+)/i },

    { key: "birthLocation", pattern: /born in ([a-zA-Z ]+)/i },
    { key: "birthDate", pattern: /born on ([a-zA-Z0-9 ,]+)/i },

    { key: "favoriteAnimal", pattern: /favorite animal is ([a-zA-Z ]+)/i },
    { key: "favoriteAnimal", pattern: /my favorite animal is ([a-zA-Z ]+)/i },
  ];

  for (const rule of rules) {
    const match = cleaned.match(rule.pattern);
    if (match && match[1]) {
      facts[rule.key] = match[1].trim();
    }
  }

  return facts;
}

// ------------------------------------------------------
// EMOTIONAL MEMORY ENGINE
// ------------------------------------------------------
function extractEmotion(text) {
  const lowered = text.toLowerCase();

  if (lowered.includes("cry") || lowered.includes("emotional")) {
    return "Jim had an emotional moment.";
  }

  if (lowered.includes("scared") || lowered.includes("afraid")) {
    return "Jim felt fear or worry.";
  }

  if (lowered.includes("excited")) {
    return "Jim felt excitement about something.";
  }

  return null;
}

// ------------------------------------------------------
// EXPERIENCE MEMORY ENGINE
// ------------------------------------------------------
function extractExperience(text) {
  if (text.length > 30) {
    return "Jim shared something meaningful: " + text.slice(0, 60) + "...";
  }
  return null;
}
