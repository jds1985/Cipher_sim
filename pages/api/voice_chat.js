// pages/api/voice_chat.js
import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // -------------------------------
    // 1. PARSE AUDIO FILE
    // -------------------------------
    const form = formidable({ multiples: false });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const audioFile = files.audio;
    if (!audioFile) {
      return res.status(400).json({ error: "No audio uploaded" });
    }

    // -------------------------------
    // 2. TRANSCRIBE WITH WHISPER
    // -------------------------------
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: "whisper-1",
    });

    const userMessage = transcription.text || "";

    // -------------------------------
    // 3. RUN NORMAL CHAT PIPELINE
    // (send text to your /api/chat logic)
    // -------------------------------
    const chatRes = await fetch(`${req.headers.origin}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userMessage,
        memory: {}, // memory handled in chat.js
      }),
    });

    const chatData = await chatRes.json();
    if (!chatData.reply) {
      throw new Error("Chat response missing");
    }

    const replyText = chatData.reply;

    // -------------------------------
    // 4. TEXT → SPEECH (TTS)
    // -------------------------------
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "verse",
      input: replyText,
      format: "mp3",
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());
    const base64Audio = audioBuffer.toString("base64");

    // -------------------------------
    // 5. RETURN EVERYTHING
    // -------------------------------
    return res.status(200).json({
      transcript: userMessage,
      reply: replyText,
      voice: base64Audio,
    });

  } catch (err) {
    console.error("Cipher voice API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
