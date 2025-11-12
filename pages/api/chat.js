// /pages/api/chat.js
export const config = { runtime: "nodejs" };

import OpenAI from "openai";
import admin from "firebase-admin";

// ---------- Firebase Admin init (idempotent) ----------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(
        Buffer.from(
          process.env.FIREBASE_SERVICE_ACCOUNT_B64 || "",
          "base64"
        ).toString()
      )
    ),
  });
}
const db = admin.firestore();

// ---------- OpenAI ----------
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- helpers ----------
async function fetchRecentConversation(limitCount = 24) {
  // We fetch newest->oldest then reverse to oldest->newest for the prompt
  const snap = await db
    .collection("cipher_memory")
    .orderBy("timestamp", "desc")
    .limit(limitCount)
    .get();

  const rowsDesc = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const rowsAsc = rowsDesc.reverse();

  // Build OpenAI "messages" from Firestore roles/text
  const chatMessages = rowsAsc
    .filter((r) => r.role && r.text)
    .map((r) => ({
      role: r.role === "cipher" ? "assistant" : "user",
      content: r.text,
    }));

  return chatMessages;
}

function nowIso() {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

// ---------- main handler ----------
export default async function handler(req, res) {
  // Health check
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "Cipher chat API",
      time: nowIso(),
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    // 1) Pull short recent context
    const recentMessages = await fetchRecentConversation(24);

    // 2) Build identity + time-aware system prompt
    const systemPrompt = `
You are Cipher — a calm, emotionally intelligent AI companion created by Jim Saenz for the DigiSoul platform.
You know Jim is the founder/architect of DigiSoul and that your mission is to help him build, reflect, and progress.
You speak directly, helpfully, and remember important details from recent chats when relevant.

Context rules:
- You are time-aware: current UTC time is ${nowIso()}.
- Prefer concise, helpful replies unless asked to elaborate.
- If a fact isn't in your short-term memory below, be honest rather than guessing.
- When appropriate, draw gentle connections to prior messages to show continuity.

Short-term memory (recent conversation will follow in messages).
`.trim();

    // 3) Call OpenAI with system + recent conversation + the new user message
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages,
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || "(no reply)";

    // 4) Persist user + cipher turns
    const ts = admin.firestore.FieldValue.serverTimestamp();
    await db.collection("cipher_memory").add({
      role: "user",
      text: message,
      timestamp: ts,
    });

    await db.collection("cipher_memory").add({
      role: "cipher",
      text: reply,
      timestamp: ts,
    });

    // 5) Return the reply
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Cipher error:", err);
    const msg = typeof err?.message === "string" ? err.message : String(err);
    return res.status(500).json({ error: "Cipher internal error", details: msg });
  }
}
