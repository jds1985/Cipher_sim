// pages/api/voice_call.js
// Press-to-talk voice pipeline for Cipher
//
// 1) Accepts raw audio/webm from the client
// 2) Transcribes with gpt-4o-mini-transcribe
// 3) Generates a reply with gpt-5.1-mini
// 4) Speaks the reply with gpt-4o-mini-tts in "shimmer" voice
// 5) Returns MP3 audio

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// We need raw body, not JSON
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ---- 1. Read raw audio bytes from the request
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

    // ---- 2. Speech → text using gpt-4o-mini-transcribe
    const transcription = await client.audio.transcriptions.create({
      file: {
        data: buffer,
        name: "input.webm", // hint for the API about the format
      },
      model: "gpt-4o-mini-transcribe",
    });

    const userText =
      typeof transcription?.text === "string"
        ? transcription.text
        : String(transcription || "");

    console.log("User said:", userText);

    // ---- 3. Cipher reply with gpt-5.1-mini
    const chat = await client.chat.completions.create({
      model: "gpt-5.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, Jim's AI co-architect and companion. " +
            "You are speaking on a short voice call. " +
            "Keep your replies natural, warm, and brief.",
        },
        {
          role: "user",
          content: userText || "The audio was empty or unclear.",
        },
      ],
      temperature: 0.7,
      max_tokens: 180,
    });

    const replyText =
      chat.choices?.[0]?.message?.content ||
      "I'm here, but something went wrong with my reply text.";

    console.log("Cipher reply:", replyText);

    // ---- 4. Text → speech with gpt-4o-mini-tts
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "shimmer", // feminine-coded temporary voice
      input: replyText,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    // ---- 5. Return MP3 audio
    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(audioBuffer);
  } catch (err) {
    console.error("voice_call error:", err);
    res
      .status(500)
      .json({
        error: "Cipher voice pipeline failed.",
        details: err.message || "Unknown error",
      });
  }
}
