// pages/api/voice_call.js
// Cipher press-to-talk voice pipeline (stable version)

import OpenAI from "openai";
import fs from "fs";
import os from "os";
import path from "path";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// We handle the raw body ourselves
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let tmpPath;

  try {
    // -----------------------------
    // 1. Read raw audio bytes
    // -----------------------------
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });

    const buffer = Buffer.concat(chunks);
    if (!buffer.length) {
      return res.status(400).json({ error: "No audio received." });
    }

    // -----------------------------
    // 2. Write to temp file
    //    (Node client is happiest with fs streams)
    // -----------------------------
    const tmpDir = os.tmpdir();
    tmpPath = path.join(tmpDir, `cipher-${Date.now()}.webm`);
    await fs.promises.writeFile(tmpPath, buffer);

    // -----------------------------
    // 3. Speech → text
    // -----------------------------
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: "gpt-4o-mini-transcribe", // or "whisper-1" if needed
    });

    const userText = transcription?.text || "";

    console.log("User said:", userText);

    // -----------------------------
    // 4. Chat reply
    // -----------------------------
    const chat = await client.chat.completions.create({
      model: "gpt-5.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, Jim's AI co-architect and companion. " +
            "You are on a short voice call; keep replies warm, natural, and concise.",
        },
        {
          role: "user",
          content: userText || "The audio was empty or unclear.",
        },
      ],
      max_tokens: 180,
      temperature: 0.7,
    });

    const replyText =
      chat.choices?.[0]?.message?.content ||
      "I'm here, but something went wrong with my reply.";

    console.log("Cipher reply:", replyText);

    // -----------------------------
    // 5. Text → speech
    // -----------------------------
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "shimmer", // temporary feminine-coded voice
      input: replyText,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(audioBuffer);
  } catch (err) {
    console.error("voice_call error:", err);
    const msg = err?.message || "Unknown error";
    res.status(500).json({ error: `Cipher voice pipeline failed: ${msg}` });
  } finally {
    // clean up temp file if we created one
    if (tmpPath) {
      fs.promises
        .unlink(tmpPath)
        .catch(() => {
          /* ignore */
        });
    }
  }
}
