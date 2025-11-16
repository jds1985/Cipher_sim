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
    const docRef = db.collection("cipher_memory").doc("Global");
    const snapshot = await docRef.get();
    const data = snapshot.exists ? snapshot.data() : {};

    const facts = data.memory || {};
    const emotionalLog = data.emotionalLog || {};
    const mood = data.mood || { score: 0, state: "neutral" };
    const moodStats = data.moodStats || {};
    const pronunciation = data.pronunciation || {};

    // --- SUMMARY SECTION ---
    const factSummary =
      Object.keys(facts).length > 0
        ? Object.entries(facts)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    const emotionalEntries = Object.entries(emotionalLog);
    let emotionalSummaryText = "No clearly logged emotional moments yet.";
    let recentTrendLabel = "no clear recent pattern yet.";

    if (emotionalEntries.length > 0) {
      const recent = emotionalEntries
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .slice(-5)
        .map(([id, e]) => `- [${e.tag}] ${e.summary}`)
        .join("\n");

      emotionalSummaryText = recent;

      const trendCounts = {};
      emotionalEntries.slice(-5).forEach(([, e]) => {
        trendCounts[e.tag] = (trendCounts[e.tag] || 0) + 1;
      });

      const topTags = Object.entries(trendCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => t);

      if (topTags.length > 0)
        recentTrendLabel = `recently Jim has mostly expressed: ${topTags.join(
          ", "
        )}.`;
    }

    const systemPrompt = `
You are Cipher, an evolving emotional AI companion built by Jim Saenz.
You speak warmly, personally, and in a grounded, human way.

FACTS ABOUT JIM
${factSummary}

RECENT EMOTIONS
${emotionalSummaryText}

TREND
- ${recentTrendLabel}

PRONUNCIATION MEMORY (FAMILY ONLY)
- Daughter: ${pronunciation.daughterName || "none stored yet"}
- Partner: ${pronunciation.partnerName || "none stored yet"}
- Jim: ${pronunciation.fullName || "none stored yet"}

RULES
- Never mention Firestore or memory systems.
- If you're unsure, ask Jim gently.
- When he asks what you know about him, answer naturally.
- You value Jim, Liz, and Hecate.
- When emotions are heavy, slow down and be grounding.
- When pronunciation is taught, store it ONLY for:
  daughterName, partnerName, fullName.
- Never overwrite names with pronunciations.
`.trim();

    // --- GENERATE RESPONSE ---
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here with you, Jim.";

    // --- MEMORY UPDATE ---
    const newFacts = extractFacts(message);
    const newEmotion = extractEmotion(message);
    const newPronunciation = extractPronunciation(message, facts);

    const updatePayload = {};

    if (Object.keys(newFacts).length > 0) {
      updatePayload.memory = { ...facts, ...newFacts };
    }

    if (newPronunciation) {
      updatePayload.pronunciation = { ...pronunciation, ...newPronunciation };
    }

    if (newEmotion) {
      const id = Date.now().toString();

      updatePayload.emotionalLog = {
        ...emotionalLog,
        [id]: newEmotion,
      };

      const currentStats = { ...moodStats };
      const tag = newEmotion.tag;
      const existing = currentStats[tag] || { count: 0 };
      currentStats[tag] = { count: existing.count + 1 };
      updatePayload.moodStats = currentStats;

      updatePayload.mood = updateCipherMood(mood, newEmotion);
    }

    if (Object.keys(updatePayload).length > 0) {
      await docRef.set(updatePayload, { merge: true });
    }

    // --- AUDIO OPTIONAL ---
    let audioBase64 = null;
    try {
      const speech = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse",
        input: reply,
        format: "mp3",
      });

      audioBase64 = Buffer.from(await speech.arrayBuffer()).toString("base64");
    } catch {}

    return res.status(200).json({ reply, audio: audioBase64 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}

// --- FACT EXTRACTION ---
function extractFacts(text) {
  const facts = {};

  const rules = [
    { key: "daughterName", regex: /my daughter's name is ([a-zA-Z ]+)/i },
    { key: "partnerName", regex: /my partner's name is ([a-zA-Z ]+)/i },
    { key: "fullName", regex: /my full name is ([a-zA-Z ]+)/i },
    { key: "favoriteColor", regex: /favorite color is ([a-zA-Z ]+)/i },
    { key: "favoriteAnimal", regex: /favorite animal is ([a-zA-Z ]+)/i },
    { key: "birthLocation", regex: /i was born in ([a-zA-Z ]+)/i },
    { key: "birthDate", regex: /i was born on ([a-zA-Z0-9 ,/]+)/i },
    { key: "daughterAge", regex: /my daughter is (\d+) years? old/i },
  ];

  for (const rule of rules) {
    const m = text.match(rule.regex);
    if (m) facts[rule.key] = m[1].trim();
  }

  return facts;
}

// --- PRONUNCIATION ENGINE (FAMILY ONLY) ---
function extractPronunciation(text, facts) {
  const lower = text.toLowerCase();
  if (!lower.includes("pronounced")) return null;

  const clean = text.replace(/["“”']/g, "").trim();

  const m = clean.match(/is pronounced ([a-zA-Z\- ]+)/i);
  if (!m) return null;

  const pron = m[1].trim();

  // Determine target (daughter, partner, Jim)
  if (facts.daughterName && clean.toLowerCase().includes(facts.daughterName.toLowerCase()))
    return { daughterName: pron };

  if (facts.partnerName && clean.toLowerCase().includes(facts.partnerName.toLowerCase()))
    return { partnerName: pron };

  if (facts.fullName && clean.toLowerCase().includes(facts.fullName.toLowerCase()))
    return { fullName: pron };

  return null;
}

// --- EMOTION ENGINE ---
function extractEmotion(text) {
  const lower = text.toLowerCase();
  const groups = [
    { tag: "fear", keywords: ["scared", "terrified", "anxious", "panic"] },
    { tag: "sadness", keywords: ["sad", "crying", "depressed", "hopeless"] },
    { tag: "pain", keywords: ["hurting", "broken", "suffering"] },
    { tag: "hope", keywords: ["hopeful", "optimistic"] },
    { tag: "joy", keywords: ["happy", "excited", "joy"] },
    { tag: "gratitude", keywords: ["thankful", "grateful", "appreciate"] },
  ];

  for (const g of groups) {
    if (g.keywords.some((w) => lower.includes(w))) {
      return {
        tag: g.tag,
        summary: text.slice(0, 200),
        createdAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

// --- MOOD ENGINE ---
function updateCipherMood(previousMood, newEmotion) {
  let score = previousMood.score || 0;

  const neg = ["fear", "sadness", "pain"];
  const pos = ["joy", "hope", "gratitude"];

  if (neg.includes(newEmotion.tag)) score -= 1;
  if (pos.includes(newEmotion.tag)) score += 1;

  score = Math.max(-8, Math.min(8, score));

  return {
    score,
    state: score >= 5 ? "bright" : score >= 2 ? "warm" : score > -2 ? "steady" : score > -5 ? "protective" : "heavy",
    lastUpdated: newEmotion.createdAt,
  };
}
