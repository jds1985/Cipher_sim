// pages/api/voice_call.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    // ---- 1. Read raw audio bytes
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

    // ---- 2. Speech → text
    const transcription = await client.audio.transcriptions.create({
      file: {
        data: buffer,
        name: "input.webm",
      },
      model: "gpt-4o-mini-transcribe", // if this fails we’ll see it now
    });

    const userText =
      typeof transcription?.text === "string"
        ? transcription.text
        : String(transcription || "");

    console.log("User said:", userText);

    // ---- 3. Cipher reply (text)
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

    // ---- 4. Text → speech
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "shimmer",
      input: replyText,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(audioBuffer);
  } catch (err) {
    console.error("voice_call error:", err);

    let details = "Unknown error";
    if (err?.response?.data) {
      details = JSON.stringify(err.response.data);
    } else if (err?.message) {
      details = err.message;
    } else {
      try {
        details = JSON.stringify(err);
      } catch (_) {}
    }

    res.status(500).json({
      error: `Cipher voice pipeline failed: ${details}`,
    });
  }
}
