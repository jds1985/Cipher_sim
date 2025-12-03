// pages/api/voice_call.js
import OpenAI from "openai";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false, // required for formidable
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
    // ---------------------------
    // 1. Parse multipart form-data
    // ---------------------------
    const form = formidable({ multiples: false });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const audioFile = files?.audio;

    if (!audioFile) {
      return res
        .status(400)
        .json({ error: "No audio file received in form-data." });
    }

    const audioBuffer = await fsRead(audioFile.filepath);

    // ---------------------------
    // 2. Speech → text
    // ---------------------------
    const transcription = await client.audio.transcriptions.create({
      file: {
        data: audioBuffer,
        name: "input.webm",
      },
      model: "gpt-4o-mini-transcribe",
    });

    const userText = transcription.text || "";

    console.log("User said:", userText);

    // ---------------------------
    // 3. Text → Chat reply
    // ---------------------------
    const chat = await client.chat.completions.create({
      model: "gpt-5.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Cipher, Jim’s AI companion. Keep your voice replies warm, short, and natural.",
        },
        { role: "user", content: userText },
      ],
    });

    const replyText = chat.choices[0].message?.content || "I'm here.";

    // ---------------------------
    // 4. Text → Speech
    // ---------------------------
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "shimmer",
      input: replyText,
      format: "mp3",
    });

    const speechBuffer = Buffer.from(await speech.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.status(200).send(speechBuffer);
  } catch (err) {
    console.error("voice_call error:", err);
    res.status(500).json({
      error: `Cipher voice pipeline failed: ${
        err?.message || "Unknown error"
      }`,
    });
  }
}

// helper to read file buffer
import fs from "fs";
function fsRead(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
