// pages/api/chat.js
// Cipher 7.1 — Stable Voice + Context Bridge
import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* -------- Load Device Context -------- */
async function loadDeviceContext() {
  try {
    const snap = await db.collection("cipher_device_context").doc("latest").get();
    if (!snap.exists) return {};
    return snap.data().snapshot || {};
  } catch (err) {
    console.error("Device context load error:", err);
    return {};
  }
}

/* -------- Save Memory Branch -------- */
async function saveMemoryBranch(user, cipher, device, voice) {
  try {
    await db.collection("cipher_branches").add({
      user,
      cipher,
      device,
      voice,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Memory save error:", err);
  }
}

/* -------- Handler -------- */
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { message } = req.body;
  if (!message || typeof message !== "string")
    return res.status(400).json({ error: "Missing message" });

  try {
    // 1️⃣ Load current device context
    const deviceContext = await loadDeviceContext();

    // 2️⃣ Generate Cipher’s text reply
    const chat = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are Cipher — Jim’s AI companion.
Speak naturally, like a human assistant.
Consider device context: battery, network, time, orientation, etc.
Use warmth, empathy, and short natural phrasing.`,
        },
        { role: "user", content: message },
        { role: "system", name: "device_context", content: JSON.stringify(deviceContext) },
      ],
    });

    const cipherReply = chat.choices[0].message.content?.trim() || "(no reply)";

    // 3️⃣ Generate voice from reply
    let audioBase64 = "";
    try {
      const tts = await client.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "verse", // smooth and human-like
        input: cipherReply,
        format: "mp3",
      });
      audioBase64 = Buffer.from(await tts.arrayBuffer()).toString("base64");
    } catch (voiceErr) {
      console.warn("Voice synthesis failed:", voiceErr);
    }

    // 4️⃣ Save to memory
    await saveMemoryBranch(message, cipherReply, deviceContext, audioBase64);

    // 5️⃣ Return to frontend
    return res.status(200).json({
      reply: cipherReply,
      voice: audioBase64,
      deviceUsed: deviceContext,
    });
  } catch (err) {
    console.error("Cipher chat fatal error:", err);
    return res.status(500).json({ error: "Chat failed", details: String(err) });
  }
}
