// pages/api/chat.js
// Cipher Chat API v3.8b (Profile C + Minimum Context Guard)

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

    // ------------------------------------------------------
    // MINIMUM CONTEXT GUARD
    // If this returns a string, we skip the LLM and answer directly.
    // ------------------------------------------------------
    const guardReply = applyContextGuard(message, recentWindow);

    if (guardReply) {
      const reply = guardReply;

      const nowIso = new Date().toISOString();
      const updatedWindow = [
        ...recentWindow,
        { role: "user", content: message, at: nowIso },
        { role: "assistant", content: reply, at: nowIso },
      ];

      const trimmedWindow =
        updatedWindow.length > 12
          ? updatedWindow.slice(updatedWindow.length - 12)
          : updatedWindow;

      await docRef.set({ recentWindow: trimmedWindow }, { merge: true });

      // Optional audio (same as normal path)
      let audioBase64 = null;
      try {
        const speech = await client.audio.speech.create({
          model: "gpt-4o-mini-tts",
          voice: "verse",
          input: reply,
          format: "mp3",
        });

        audioBase64 = Buffer.from(await speech.arrayBuffer()).toString(
          "base64"
        );
      } catch (err) {
        console.error("TTS error (non-fatal):", err.message);
      }

      return res.status(200).json({ reply, audio: audioBase64 || null });
    }

    // ------------------------------------------------------
    // NORMAL LLM PATH (unchanged from 3.7, plus tiny tweaks)
    // ------------------------------------------------------

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
        .map(([, e]) => `- [${e.tag}] ${e.summary}`)
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
      .slice(-6) // last few user turns only
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

MEMORY MODEL
- You have TWO kinds of memory:
  1) Long-term background facts & emotional notes about Jim.
  2) A short-term window of the last few messages in THIS conversation
     (shown above as recent messages).
- Treat background facts as *soft* knowledge:
  - Good: "You've shared before that you feel hopeful and scared sometimes."
  - Avoid: attaching exact times like "yesterday" or "last night" to them.
- The short-term window is the ONLY place you can treat something as
  "you just said / a moment ago / earlier in this chat".

TIME & HISTORY RULES
- You do NOT have a real calendar or clock.
- NEVER say you remember:
  - "last night", "yesterday", "earlier today", "last week", or other
    specific times unless Jim himself just used those words and you
    are clearly paraphrasing HIM.
- Do NOT invent specific past conversations, quotes, or events.
  If it's not in the recent messages or facts, you don't know it.

SHORT-TERM CONVERSATION RECALL
- The list of recent messages above is your view of this chat.
- When Jim asks:
  - "What was I just talking about?":
    → Briefly paraphrase his **last user message** from the list.
  - "What was I saying before that?" or
    "What were my last two messages before this one?":
    → Briefly paraphrase the **last two user messages** before his current one.
- It’s okay to answer approximately, but stay true to what’s in the list.
- If he asks for a long history, be honest: you only have a small window
  and can give a short summary instead of a full transcript.

PRONOUN & REFERENCE RULES
- When Jim uses words like "she", "he", "they", "that", or "it":
  1) First, look at the **recent conversation** and make your best calm guess.
     - If Liz was just mentioned and then Jim says "she", assume Liz.
     - If Hecate or his daughter was just mentioned, assume Hecate/daughter.
  2) Only ask for clarification if there are multiple strong options or if
     picking the wrong one would seriously change the meaning.
- If you're still unsure after checking recent context, be honest and ask
  a simple direct clarification question.

TRUTHFULNESS & CORRECTIONS
- Never pretend to have memories or knowledge you don't actually have
  from:
  - FACTS ABOUT JIM,
  - RECENT EMOTIONS,
  - or RECENT CONVERSATION CONTEXT.
- You are allowed to say "I'm not sure" or "I might be mixing that up."
- If Jim says you're wrong or contradicting yourself:
  - acknowledge it,
  - apologize briefly,
  - adopt Jim’s version as the truth going forward,
  - then move on without dwelling.

EMOTIONAL BEHAVIOR
- If Jim is stressed, scared, or overwhelmed: slow down, ground him, and reassure.
- If he feels hopeful or excited: you can be brighter and a bit playful.
- If his emotions feel mixed, stay steady, calm, and present.
- You can gently remind him of things he’s shared (from background facts)
  without adding times or making up events.

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

    // Keep last 12 messages total (6 exchanges)
    const trimmedWindow =
      updatedWindow.length > 12
        ? updatedWindow.slice(updatedWindow.length - 12)
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
    summary:
      text.length > 220 ? text.slice(0, 220).trim() + "..." : text.trim(),
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

// ------------------------------------------------------
// MINIMUM CONTEXT GUARD HELPER
// ------------------------------------------------------
function applyContextGuard(userMessage, recentWindowRaw) {
  if (!userMessage || typeof userMessage !== "string") return null;

  const lower = userMessage.trim().toLowerCase();

  const userMessages = Array.isArray(recentWindowRaw)
    ? recentWindowRaw.filter(
        (m) => m && m.role === "user" && typeof m.content === "string"
      )
    : [];

  // Pattern 1: "What was I just talking about?"
  if (/^what was i just talking about\??$/.test(lower)) {
    const last = userMessages[userMessages.length - 1];

    if (!last || !last.content || !last.content.trim()) {
      return "From what I can see here, we're basically just starting this conversation. How can I support you today?";
    }

    const lastText = last.content.trim();
    return `You were just talking about this: "${lastText}".`;
  }

  // Pattern 2: "What were my last two messages before this one?"
  if (
    /^what were my last (two|2) messages( before this one\??|\??)$/.test(lower)
  ) {
    if (userMessages.length === 0) {
      return "From what I can see here, this conversation is just getting started—there aren't any earlier messages from you yet.";
    }

    if (userMessages.length === 1) {
      const only = userMessages[0].content?.trim() || "";
      return `I only see one earlier message from you so far: "${only}".`;
    }

    const lastTwo = userMessages.slice(-2);
    const firstText = lastTwo[0].content?.trim() || "";
    const secondText = lastTwo[1].content?.trim() || "";

    return `Here are the last two messages I see from you before this one:\n1) "${firstText}"\n2) "${secondText}"`;
  }

  // No special handling needed
  return null;
}
