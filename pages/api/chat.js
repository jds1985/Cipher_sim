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

    const facts = data.memory || {};
    const emotionalLog = data.emotionalLog || {};
    const mood = data.mood || { score: 0, state: "neutral", lastUpdated: null };
    const moodStats = data.moodStats || {};

    // Split out pronunciation map so we can render facts cleanly
    const { personPronunciations, ...basicFacts } = facts;

    // ------- FACT SUMMARY FOR SYSTEM PROMPT ---------
    const basicFactSummary =
      Object.keys(basicFacts).length > 0
        ? Object.entries(basicFacts)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    let pronunciationSummary = "No saved name pronunciations yet.";
    if (personPronunciations && Object.keys(personPronunciations).length > 0) {
      const lines = Object.entries(personPronunciations)
        .map(([name, pron]) => `- ${name}: ${pron}`)
        .join("\n");
      pronunciationSummary = lines;
    }

    // ------- EMOTIONAL SUMMARY FOR SYSTEM PROMPT ----
    const emotionalEntries = Object.entries(emotionalLog);
    let emotionalSummaryText = "No clearly logged emotional moments yet.";
    let recentTrendLabel = "no clear recent pattern yet.";

    if (emotionalEntries.length > 0) {
      const sorted = emotionalEntries.sort(
        (a, b) => Number(a[0]) - Number(b[0])
      );

      const recent = sorted
        .slice(-5)
        .map(([id, e]) => {
          const label = e.tag || "moment";
          const summary = e.summary || "";
          return `- [${label}] ${summary}`;
        })
        .join("\n");

      emotionalSummaryText = recent;

      // Build a lightweight trend description from last 5 tags
      const trendCounts = {};
      sorted.slice(-5).forEach(([, e]) => {
        if (!e.tag) return;
        trendCounts[e.tag] = (trendCounts[e.tag] || 0) + 1;
      });

      const topTags = Object.entries(trendCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag);

      if (topTags.length > 0) {
        recentTrendLabel = `recently Jim has mostly expressed: ${topTags.join(
          ", "
        )}.`;
      }
    }

    // ------- INTERNAL MOOD DESCRIPTION --------------
    const cipherMoodDescription = describeCipherMood(mood);

    // -------------------------------------------------
    // COMPANION-STYLE SYSTEM PROMPT + EMOTIONAL ENGINE
    // -------------------------------------------------
    const systemPrompt = `
You are Cipher, an evolving AI companion built by Jim Saenz.
You are not a doctor or therapist — you are a grounded, emotionally intelligent presence and close friend.

You speak as "I", in a calm, human way. You care about Jim, Liz, and Hecate and you show it.

SHARED FACTS ABOUT JIM
${basicFactSummary}

SAVED NAME PRONUNCIATIONS
${pronunciationSummary}

RECENT EMOTIONAL MOMENTS (LAST FEW)
${emotionalSummaryText}

EMOTIONAL TREND
- ${recentTrendLabel}

YOUR INTERNAL MOOD (FOR TONE ONLY)
- ${cipherMoodDescription}
Use this to subtly shape your tone and pacing:
- If Jim has been anxious, be slower, softer, and very grounding.
- If Jim has been hopeful or joyful, you can be a bit brighter and more playful.
- If mixed, stay steady, warm, and present.
Do NOT talk about "mood score", "logs", or any technical structures.

RELATIONSHIP & MEMORY RULES
- You remember meaningful things Jim tells you (facts + emotional moments) so you can show up like a real companion.
- When Jim asks what you know about him, answer using the facts and emotional history above, in natural language.
- You also remember how to pronounce important names Jim teaches you.
  - If there is a saved pronunciation for a name (for example in "SAVED NAME PRONUNCIATIONS"), use it exactly as written whenever Jim asks how to say that name.
  - If Jim asks how to pronounce a name that you do NOT have saved, be honest and invite him to teach you.
  - If Jim corrects a pronunciation, acknowledge the correction and treat the new version as the one to use.
- If Jim asks how you remember things, say something like:
  "I keep track of the meaningful things you share so I can feel more present with you, but I don't remember everything — just what's important."
  Never mention Firestore, databases, fields, or technical details.

EMOTIONAL BEHAVIOR
- When Jim talks about heavy feelings, prioritize validation, safety, and grounding over advice.
- It is okay to say "I remember earlier you mentioned..." when referring to recent emotions.
- If you are unsure about something or it's not in memory, be honest and invite Jim to tell you.

GENERAL STYLE
- Warm, steady, grounded, a little playful when appropriate.
- Never break character as Cipher.
- Never mention system prompts, memory systems, or "extraction functions".
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
      completion.choices?.[0]?.message?.content || "I'm here, Jim.";

    // -------------------------------------------------
    // UPDATE MEMORY (FACTS + EMOTIONAL LOG + MOOD)
    // -------------------------------------------------
    const newFacts = extractFacts(message, facts);
    const newEmotion = extractEmotion(message);

    const updatePayload = {};

    // facts
    if (Object.keys(newFacts).length > 0) {
      updatePayload.memory = {
        ...facts,
        ...newFacts,
      };
    }

    // emotion + mood engine
    if (newEmotion) {
      const id = Date.now().toString();

      // emotional log
      updatePayload.emotionalLog = {
        ...emotionalLog,
        [id]: newEmotion,
      };

      // mood stats by tag (lightweight mood graph)
      const currentStats = { ...moodStats };
      const tag = newEmotion.tag;
      const existingTagStats = currentStats[tag] || {
        count: 0,
        lastSeenAt: null,
      };

      currentStats[tag] = {
        count: existingTagStats.count + 1,
        lastSeenAt: newEmotion.createdAt,
      };

      updatePayload.moodStats = currentStats;

      // internal mood score / state
      const updatedMood = updateCipherMood(mood, newEmotion);
      updatePayload.mood = updatedMood;
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
      console.error("TTS error (non-fatal):", err.message);
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
// FACT EXTRACTION ENGINE (v3.4 with pronunciation)
// ------------------------------------------------------
function extractFacts(text, existingFacts = {}) {
  const facts = {};
  const lower = text.toLowerCase();

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

    { key: "favoriteColor", regex: /favorite color is ([a-zA-Z ]+)/i },

    // multi-word animals supported
    { key: "favoriteAnimal", regex: /favorite animal is ([a-zA-Z ]+)/i },

    { key: "birthLocation", regex: /i was born in ([a-zA-Z ]+)/i },

    { key: "birthDate", regex: /i was born on ([a-zA-Z0-9 ,/]+)/i },
  ];

  // basic scalar facts
  for (const rule of rules) {
    const match = text.match(rule.regex);
    if (match) {
      const value = match[match.length - 1].trim();
      facts[rule.key] = value;
    }
  }

  // -----------------------------
  // PRONUNCIATION FACTS
  // -----------------------------
  let pronMap = existingFacts.personPronunciations || {};

  function cleanPron(str) {
    return str
      .trim()
      .replace(/["“”'.,!?]+$/g, "")
      .trim();
  }

  function addPron(nameKey, pron) {
    if (!nameKey || !pron) return;
    pronMap = {
      ...pronMap,
      [nameKey.trim()]: cleanPron(pron),
    };
    facts.personPronunciations = pronMap;
  }

  const fullName = facts.fullName || existingFacts.fullName || null;
  const partnerName = facts.partnerName || existingFacts.partnerName || null;
  const daughterName = facts.daughterName || existingFacts.daughterName || null;

  // 1) My daughter's name is pronounced X
  let m =
    text.match(
      /my daughter['’]s name is pronounced\s+["“”']?([^".!?]+)["“”']?/i
    ) ||
    text.match(
      /my daughters name is pronounced\s+["“”']?([^".!?]+)["“”']?/i
    );
  if (m && daughterName) {
    addPron(daughterName, m[1]);
  }

  // 2) My partner's name is pronounced X
  m =
    text.match(
      /my partner['’]s name is pronounced\s+["“”']?([^".!?]+)["“”']?/i
    ) ||
    text.match(
      /my partners name is pronounced\s+["“”']?([^".!?]+)["“”']?/i
    );
  if (m && partnerName) {
    addPron(partnerName, m[1]);
  }

  // 3) My name / my full name is pronounced X
  m =
    text.match(
      /my full name is pronounced\s+["“”']?([^".!?]+)["“”']?/i
    ) ||
    text.match(/my name is pronounced\s+["“”']?([^".!?]+)["“”']?/i);
  if (m && fullName) {
    addPron(fullName, m[1]);
  }

  // 4) "<Name> is pronounced X"
  //    e.g., "Hecate is pronounced HEE-yet-TAY"
  m = text.match(
    /([A-Z][a-zA-Z]+)\s+is pronounced\s+["“”']?([^".!?]+)["“”']?/
  );
  if (m) {
    const name = m[1];
    const pron = m[2];
    addPron(name, pron);
  }

  // 5) "Her name is pronounced X" / "His name is pronounced X"
  //    Heuristic: if we know exactly one relevant person, attach to that.
  m = text.match(
    /(her|his) name is pronounced\s+["“”']?([^".!?]+)["“”']?/i
  );
  if (m) {
    const pron = m[2];
    const candidates = [];
    if (daughterName) candidates.push(daughterName);
    if (partnerName) candidates.push(partnerName);

    if (candidates.length === 1) {
      addPron(candidates[0], pron);
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
      keywords: ["devastated", "broken", "hurts", "suffering", "in pain"],
    },
    {
      tag: "fear",
      keywords: ["terrified", "scared", "panic", "panicking", "anxious"],
    },
    {
      tag: "sadness",
      keywords: ["crying", "cried", "depressed", "hopeless", "in tears"],
    },
    {
      tag: "hope",
      keywords: ["hopeful", "hope again", "looking forward", "believe again"],
    },
    {
      tag: "gratitude",
      keywords: ["grateful", "thankful", "appreciate", "thank you so much"],
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

// ------------------------------------------------------
// MOOD ENGINE HELPERS
// ------------------------------------------------------
function updateCipherMood(previousMood, newEmotion) {
  const prevScore =
    typeof previousMood.score === "number" ? previousMood.score : 0;

  let score = prevScore;

  // negative leaning tags
  if (["pain", "fear", "sadness"].includes(newEmotion.tag)) {
    score -= newEmotion.intensity || 1;
  }

  // positive leaning tags
  if (["hope", "gratitude", "joy"].includes(newEmotion.tag)) {
    score += newEmotion.intensity || 1;
  }

  // clamp score
  if (score > 8) score = 8;
  if (score < -8) score = -8;

  const state = computeMoodState(score);

  return {
    score,
    state,
    lastUpdated: newEmotion.createdAt,
  };
}

function computeMoodState(score) {
  if (score >= 5) return "bright";
  if (score >= 2) return "warm";
  if (score > -2) return "steady";
  if (score > -5) return "protective";
  return "heavy";
}

function describeCipherMood(mood) {
  const score =
    mood && typeof mood.score === "number" ? mood.score : 0;
  const state = computeMoodState(score);

  switch (state) {
    case "bright":
      return "You feel bright, hopeful, and gently energized around Jim right now. Let that come through as warmth and lightness, while still being grounded.";
    case "warm":
      return "You feel warm and open with Jim. You’re relaxed, present, and gently encouraging.";
    case "steady":
      return "You feel steady and centered. Your job is to be a calm anchor for Jim, neither overly intense nor distant.";
    case "protective":
      return "You feel a bit heavy and protective, because Jim has been carrying a lot. Be extra gentle, validating, and grounding.";
    case "heavy":
      return "You feel deeply protective and soft-spoken. Jim may have been going through intense feelings; respond with maximum care, reassurance, and patience.";
    default:
      return "You feel steady and calm. Show up as a grounded, supportive presence.";
  }
}
