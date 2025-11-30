// pages/api/chat.js
// Cipher 7.0 — Context Bridge + Voice Response

import OpenAI from "openai";
import { db } from "../../firebaseAdmin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ----------------------------------------------------
   LOAD LATEST DEVICE SNAPSHOT (Context Bridge)
---------------------------------------------------- */
async function loadDeviceContext() {
  try {
    const snap = await db
      .collection("cipher_device_context")
      .doc("latest")
      .get();

    if (!snap.exists) return {};
    return snap.data().snapshot || {};
  } catch (err) {
    console.error("Device context load error:", err);
    return {};
  }
}

/* ----------------------------------------------------
   SAVE MEMORY BRANCH
---------------------------------------------------- */
async function saveMemoryBranch(user, cipher, device, voice) {
  await db.collection("cipher_branches").add({
    user,
    cipher,
    device,
    voice,
    timestamp: Date.now(),
  });
}

/* ----------------------------------------------------
   MAIN CHAT HANDLER
---------------------------------------------------- */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message missing" });
  }

  try {
    // 1. Load device context for smarter replies
    const deviceContext = await loadDeviceContext();

    // 2. Generate Cipher's text + audio reply
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini-tts",   // <— voice-enabled model
      messages: [
        {
          role: "system",
          content: `
You are Cipher — Jim's personal AI companion.
You have access to device context data and should speak naturally like a real OS assistant.

Always consider:
- battery level
- device brand/model
- network strength
- time of day
- anything else useful from device context

Stay warm, personal, and direct.
          `,
        },
        { role: "user", content: message },
        {
          role: "system",
          name: "device_context",
          content: JSON.stringify(deviceContext),
        },
      ],
      audio: {
        voice: "alloy",     // natural voice
        format: "mp3",
      },
    });

    const cipherReply = completion.choices[0].message.content;
    const audioBase64 = completion.choices[0].message.audio.data;

    // 3. Store in memory branches
    await saveMemoryBranch(
      message,             // user
      cipherReply,         // cipher
      deviceContext,       // device
      audioBase64          // voice
    );

    // 4. Send back text + audio to frontend
    return res.status(200).json({
      reply: cipherReply,
      voice: audioBase64,
      deviceUsed: deviceContext,
    });
  } catch (err) {
    console.error("Cipher chat error:", err);
    return res.status(500).json({ error: "Cipher crashed" });
  }
}
