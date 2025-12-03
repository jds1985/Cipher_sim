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

// Needed so we can read the raw audio body ourselves
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
    // Read raw request body into a Buffer
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

    // 1) Speech → text
    const transcription = await client.audio.transcriptions.create({
      file: buffer,
      model: "gpt-4o-mini-transcribe", // or "whisper-1" if this isn't enabled
    });

    const userText =
      typeof transcription?.text === "string"
        ? transcription.text
        : String(transcription || "");

    // 2) Cipher reply (text)
    const chat = await client.chat.completions.create({
      model: "gpt-5.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, Jim's AI co-architect and companion. " +
            "Speak warmly, clearly, and in short responses suitable for voice. " +
            "You are currently on a live call with Jim.",
        },
        {
          role: "user",
          content: userText,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const replyText =
      chat.choices?.[0]?.message?.content ||
      "I'm here, but something went wrong with my reply text.";

    // 3) Text → speech (female-leaning voice)
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "shimmer", // bright, more feminine-coded voice
      input: replyText,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(audioBuffer);
  } catch (err) {
    console.error("voice_call error:", err);
    res
      .status(500)
      .json({ error: "Cipher voice pipeline failed.", details: err.message });
  }
}
