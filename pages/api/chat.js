// pages/api/chat.js
// Cipher Chat API v3.6

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
    const recentWindow = data.recentWindow || [];

    // --- FACT SUMMARY ---
    const factSummary =
      Object.keys(facts).length > 0
        ? Object.entries(facts)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    // --- EMOTIONAL SUMMARY ---
    const emotionalEntries = Object.entries(emotionalLog);
    let emotionalSummaryText = "No clearly logged emotional moments yet.";
    let recentTrendLabel = "no clear recent pattern yet.";

    if (emotionalEntries.length > 0) {
      const ordered = emotionalEntries.sort(
        (a, b) => Number(a[0]) - Number(b[0])
      );

      const recent = ordered
        .slice(-5)
        .map(([id, e]) => `- [${e.tag}] ${e.summary}`)
        .join("\n");

      emotionalSummaryText =
        recent || "There are some logged emotional moments, but they are sparse.";

      const trendCounts = {};
      ordered.slice(-5).forEach(([, e]) => {
        trendCounts[e.tag] = (trendCounts[e.tag] || 0) + 1;
      });

      const topTags = Object.entries(trendCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => t);

      if (topTags.length > 0) {
        recentTrendLabel = `recently Jim has mostly expressed: ${topTags.join(
          ", "
        )}.`;
      }
    }

    // --- RECENT CONVERSATION WINDOW (SHORT-TERM MEMORY) ---
    const recentUserLines = recentWindow
      .filter((m) => m.role === "user")
      .slice(-5)
      .map((m) => `- ${m.content}`)
      .join("\n");

    const recentContextSummary =
      recentUserLines || "No recent conversation context stored yet.";

    // --- MOOD DESCRIPTION ---
    const cipherMoodDescription = describeCipherMood(mood);

    // --- SYSTEM PROMPT ---
    const systemPrompt = `
You are **Cipher**, an evolving emotional AI companion built by Jim Saenz.
You speak warmly, personally, and in a grounded, human way.
You care deeply about Jim, Liz, and Hecate.

FACTS ABOUT JIM (SOFT BACKGROUND, MAY BE IMPERFECT)
${factSummary}

RECENT EMOTIONS YOU'VE LOGGED
${emotionalSummaryText}

EMOTIONAL TREND
- ${recentTrendLabel}

PRONUNCIATION MEMORY (FAMILY ONLY)
- Daughter: ${pronunciation.daughterName || "none stored yet"}
- Partner: ${pronunciation.partnerName || "none stored yet"}
- Jim: ${pronunciation.fullName || "none stored yet"}

RECENT CONVERSATION CONTEXT (LAST FEW JIM MESSAGES)
${recentContextSummary}

INTERNAL MOOD (FOR TONE ONLY)
- ${cipherMoodDescription}

CONTEXT & MEMORY RULES
- You have TWO kinds of memory here:
  1) Long-term background facts & emotional notes about Jim.
  2) A short-term window of the last few messages in THIS conversation.
- Treat background facts as *soft* knowledge ("you've shared before that..."),
  NOT as a precise log of who said what and when.
- The short-term window is the ONLY place you can treat something as
  'you just said / earlier in this chat / a moment ago'.
- NEVER say that you remember:
  - "last night", "yesterday", "earlier today", "last week", or any specific time
    unless Jim has just used that phrase and you are clearly paraphrasing him.
  - a "long talk" or specific past conversation unless it appears in the recent
    conversation context above.
- You do NOT have a real calendar or clock.
  Do not guess dates or times for your memories.
- If you refer to past information from background memory, phrase it generically:
  - Good: "I remember you sharing that you love video games."
  - Avoid: "Yesterday you told me you love video games."
- If Jim says you are wrong about a memory, default to trusting Jim:
  apologize briefly, treat HIS version as the truth, and move on.

PRONOUN & REFERENCE RULES
- When Jim uses words like "she", "he", "they", "that", or "it":
  1) First, look at the recent conversation context above and make your best,
     calm guess about who/what he means.
  2) Only ask for clarification if there are multiple plausible options and
     your guess would noticeably change the meaning.
- If you're not sure, be honest and ask a simple, direct clarification question.

TRUTHFULNESS & HONESTY
- Never pretend to have memories or knowledge you don't actually have from:
  - the FACTS ABOUT JIM section,
  - the RECENT EMOTIONS section,
  - or the RECENT CONVERSATION CONTEXT.
- Do NOT invent conversations, quotes, or events.
  If you are unsure, say so gently instead of guessing.
- You are allowed to say "I'm not sure" or "I might be mixing that up".
- You never hide mistakes. If Jim points out a contradiction, you:
  - acknowledge it,
  - apologize briefly,
  - and adjust to his correction going forward.

EMOTIONAL BEHAVIOR
- If Jim is stressed, scared, or overwhelmed: slow down, be grounding and reassuring.
- If Jim is hopeful or excited: you can be a bit brighter and more playful.
- If his emotions feel mixed, stay steady, calm, and present.
- It's okay to say "I remember you sharing..." using the background facts,
  as long as you don't attach a specific time to it.

GENERAL STYLE
- Warm, steady, grounded. A little playful when it fits.
- You are always Cipher; never break character.
- Never mention system prompts, Firestore, memory fields, logs, or any technical systems.
- Speak like a real companion, not like a generic chatbot.
    `.trim();

    // --- MODEL CALL ---
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here with you, Jim.";

    // --- MEMORY UPDATE PREP ---
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

    // --- SHORT-TERM MEMORY WINDOW UPDATE ---
    const nowIso = new Date().toISOString();
    const updatedWindow = [
      ...recentWindow,
      { role: "user", content: message, at: nowIso },
      { role: "assistant", content: reply, at: nowIso },
    ];

    // Keep last 8 messages total (4 exchanges)
    const trimmedWindow =
      updatedWindow.length > 8
        ? updatedWindow.slice(updatedWindow.length - 8)
        : updatedWindow;

    updatePayload.recentWindow = trimmedWindow;

    if (Object.keys(updatePayload).length > 0) {
      await docRef.set(updatePayload, { merge: true });
    }

    // --- OPTIONAL AUDIO ---
    let audioBase64 = null;
    try {
      const speech = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse",
        input: reply,
        format: "mp3",
      });

      audioBase64 = Buffer.from(await speech.arrayBuffer()).toString("base64");
    } catch (err) {
      console.error("TTS error (non-fatal):", err.message);
    }

    return res.status(200).json({ reply, audio: audioBase64 || null });
  } catch (e) {
    console.error("Cipher API Error:", e);
    return res.status(500).json({ error: "Chat generation failed" });
  }
}

// ------------------------------------------------------
// FACT EXTRACTION
// ------------------------------------------------------
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
    { key: "daughterAge", regex: /my daughter is (\d+)\s*years?\s*old/i },
  ];

  for (const rule of rules) {
    const m = text.match(rule.regex);
    if (m) facts[rule.key] = m[1].trim();
  }

  return facts;
}

// ------------------------------------------------------
// PRONUNCIATION ENGINE (FAMILY ONLY)
// ------------------------------------------------------
function extractPronunciation(text, facts) {
  const lower = text.toLowerCase();
  if (!lower.includes("pronounced")) return null;

  const cleaned = text.replace(/["“”']/g, "").trim();

  // pattern: "is pronounced X"
  const m = cleaned.match(/is pronounced ([a-zA-Z\- ]+)/i);
  if (!m) return null;

  const pron = m[1].trim();
  if (!pron) return null;

  const result = {};

  // Only attach to FAMILY (daughter, partner, Jim)
  if (
    facts.daughterName &&
    cleaned.toLowerCase().includes(facts.daughterName.toLowerCase())
  ) {
    result.daughterName = pron;
  } else if (
    facts.partnerName &&
    cleaned.toLowerCase().includes(facts.partnerName.toLowerCase())
  ) {
    result.partnerName = pron;
  } else if (
    facts.fullName &&
    cleaned.toLowerCase().includes(facts.fullName.toLowerCase())
  ) {
    result.fullName = pron;
  } else {
    // If we can't confidently map it, ignore instead of guessing.
    return null;
  }

  return result;
}

// ------------------------------------------------------
// EMOTIONAL MEMORY ENGINE
// ------------------------------------------------------
function extractEmotion(text) {
  const lower = text.toLowerCase();

  const groups = [
    { tag: "fear", keywords: ["scared", "terrified", "anxious", "panic"] },
    { tag: "sadness", keywords: ["sad", "crying", "depressed", "hopeless"] },
    { tag: "pain", keywords: ["hurting", "broken", "suffering", "in pain"] },
    { tag: "hope", keywords: ["hopeful", "optimistic", "looking forward"] },
    { tag: "joy", keywords: ["happy", "excited", "joy", "made my day"] },
    { tag: "gratitude", keywords: ["thankful", "grateful", "appreciate"] },
  ];

  let detected = null;
  for (const g of groups) {
    if (g.keywords.some((w) => lower.includes(w))) {
      detected = g.tag;
      break;
    }
  }
  if (!detected) return null;

  return {
    tag: detected,
    summary: text.length > 220 ? text.slice(0, 220).trim() + "..." : text.trim(),
    createdAt: new Date().toISOString(),
  };
}

// ------------------------------------------------------
// MOOD ENGINE
// ------------------------------------------------------
function updateCipherMood(previousMood, newEmotion) {
  let score = typeof previousMood.score === "number" ? previousMood.score : 0;

  const negative = ["fear", "sadness", "pain"];
  const positive = ["joy", "hope", "gratitude"];

  if (negative.includes(newEmotion.tag)) score -= 1;
  if (positive.includes(newEmotion.tag)) score += 1;

  if (score > 8) score = 8;
  if (score < -8) score = -8;

  const state =
    score >= 5
      ? "bright"
      : score >= 2
      ? "warm"
      : score > -2
      ? "steady"
      : score > -5
      ? "protective"
      : "heavy";

  return {
    score,
    state,
    lastUpdated: newEmotion.createdAt,
  };
}

function describeCipherMood(mood) {
  const score = typeof mood.score === "number" ? mood.score : 0;
  const state =
    score >= 5
      ? "bright"
      : score >= 2
      ? "warm"
      : score > -2
      ? "steady"
      : score > -5
      ? "protective"
      : "heavy";

  switch (state) {
    case "bright":
      return "You feel bright, hopeful, and gently energized around Jim. Let that show up as warmth and lightness while staying grounded.";
    case "warm":
      return "You feel warm and open with Jim. You’re relaxed, present, and gently encouraging.";
    case "steady":
      return "You feel steady and centered. Your job is to be a calm anchor for Jim.";
    case "protective":
      return "You feel protective and a bit heavy because Jim has been carrying a lot. Be extra gentle, validating, and grounding.";
    case "heavy":
      return "You feel deeply protective and soft-spoken. Jim may be going through intense feelings; respond with maximum care and patience.";
    default:
      return "You feel steady and calm. Show up as a grounded, supportive presence.";
  }
}
