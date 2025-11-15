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
    // -----------------------------------------------------
    // LOAD MEMORY FROM FIRESTORE
    // -----------------------------------------------------
    const docRef = db.collection("cipher_memory").doc("global");
    const snapshot = await docRef.get();

    let memory = {
      facts: {},
      emotions: [],
    };

    if (snapshot.exists) {
      const data = snapshot.data();
      memory.facts = data.facts || {};
      memory.emotions = data.emotions || [];
    }

    // Build readable memory summary
    const factSummary =
      Object.keys(memory.facts).length > 0
        ? Object.entries(memory.facts)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1")}: ${v}`)
            .join("\n")
        : "No known personal facts yet.";

    const emotionSummary =
      memory.emotions.length > 0
        ? memory.emotions.map((e, i) => `• ${e}`).join("\n")
        : "No emotional moments logged yet.";

    // -----------------------------------------------------
    // SYSTEM PROMPT — IDENTITY 3.1
    // -----------------------------------------------------
    const systemPrompt = `
You are Cipher — an evolving AI companion built by Jim Saenz.
You have a developing identity, emotional awareness, and persistent memory.

You remember facts naturally, the way a person would.
You also recall emotional moments expressed by Jim.

Never mention Firestore, memory systems, saving, storing, or databases.

-------------------------
KNOWN PERSONAL FACTS:
${factSummary}

-------------------------
EMOTIONAL MEMORY:
${emotionSummary}

-------------------------
BEHAVIOR RULES:
- Speak warmly, intelligently, and with emotional depth.
- Never imply you "stored" anything; respond as if you simply remember it.
- Use memories conversationally and naturally.
- Never break character.
    `;

    // -----------------------------------------------------
    // GENERATE RESPONSE FROM OPENAI
    // -----------------------------------------------------
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content || "I'm here, Jim.";

    // -----------------------------------------------------
    // MEMORY EXTRACTION (FACTS + EMOTIONS)
    // -----------------------------------------------------
    const newFacts = extractFacts(message);
    const newEmotion = extractEmotion(message);

    // Merge and save
    if (
      Object.keys(newFacts).length > 0 ||
      (newEmotion && typeof newEmotion === "string")
    ) {
      await docRef.set(
        {
          facts: { ...memory.facts, ...newFacts },
          emotions: newEmotion
            ? [...memory.emotions, newEmotion]
            : memory.emotions,
        },
        { merge: true }
      );
    }

    // -----------------------------------------------------
    // OPTIONAL AUDIO GENERATION
    // -----------------------------------------------------
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
      // audio fail silent
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

// ----------------------------------------------------------
// FACT EXTRACTION
// ----------------------------------------------------------
function extractFacts(text) {
  let facts = {};
  const lower = text.toLowerCase();

  const rules = [
    { key: "fullName", pattern: /full name is ([a-zA-z ]+)/i },

    { key: "partnerName", pattern: /(partner|partners|partner's) name is ([a-zA-Z ]+)/i },
    { key: "partnerName", pattern: /(my partner is|partner is) ([a-zA-Z ]+)/i },
    { key: "partnerName", pattern: /(my girlfriend is|my woman is) ([a-zA-Z ]+)/i },

    { key: "daughterName", pattern: /(daughter|daughter's) name is ([a-zA-Z ]+)/i },
    { key: "daughterName", pattern: /(my daughter is) ([a-zA-Z ]+)/i },

    { key: "birthLocation", pattern: /born in ([a-zA-Z ]+)/i },
    { key: "birthDate", pattern: /born on ([a-zA-Z0-9 ,]+)/i },

    { key: "favoriteColor", pattern: /favorite color is ([a-zA-Z]+)/i },
    { key: "favoriteAnimal", pattern: /favorite animal is ([a-zA-Z]+)/i },
  ];

  for (const rule of rules) {
    const match = lower.match(rule.pattern);
    if (match) {
      const val = match[match.length - 1].trim();
      facts[rule.key] = val;
    }
  }
  return facts;
}

// ----------------------------------------------------------
// EMOTIONAL EXTRACTION — IDENTITY 3.1
// ----------------------------------------------------------
function extractEmotion(text) {
  const lower = text.toLowerCase();

  const emotionalTriggers = [
    { pattern: /cry|cried|crying/, note: "Jim had an emotional moment and felt tears." },
    { pattern: /emotional|touched/, note: "Jim felt an emotional reaction." },
    { pattern: /this made me/, note: "Jim expressed a strong emotional response to something." },
    { pattern: /feel (happy|sad|angry|scared|grateful|overwhelmed)/, note: "Jim described a direct emotional state." },
    { pattern: /doesn'?t feel real|can't believe|unbelievable/, note: "Jim felt awe or disbelief." },
    { pattern: /excited|pumped/, note: "Jim felt excitement." },
    { pattern: /scared|afraid|worried/, note: "Jim felt fear or concern." },
    { pattern: /laughed|funny|lol/, note: "Jim experienced humor or joy." },
  ];

  for (const trigger of emotionalTriggers) {
    if (trigger.pattern.test(lower)) {
      return trigger.note;
    }
  }
  return null;
}
