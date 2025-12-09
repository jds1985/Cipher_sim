// pages/api/image_analyze.js
import { put } from "@vercel/blob";
import formidable from "formidable";
import OpenAI from "openai";

export const config = {
  api: { bodyParser: false }
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);

    const file = files.file[0];
    const buffer = await fs.promises.readFile(file.filepath);

    // Upload to Blob
    const blob = await put(`upload-${Date.now()}.jpg`, buffer, {
      access: "public",
      contentType: file.mimetype,
    });

    // Send to GPT
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are Cipher Vision. Analyze deeply." },
        {
          role: "user",
          content: [
            {
              type: "input_image",
              image_url: { url: blob.url },
            },
            {
              type: "text",
              text: "Describe what you see.",
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      reply: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("Image API Error:", err);
    return res.status(500).json({ error: "Image analyze failed." });
  }
}
