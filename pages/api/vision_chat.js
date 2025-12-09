import { put } from "@vercel/blob";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: false, // IMPORTANT: disable bodyParser for multipart
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
    // Read file buffer from multipart upload
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const fullBody = Buffer.concat(buffers);

    // Extract file boundary
    const boundary = req.headers["content-type"].split("boundary=")[1];
    const parts = fullBody.toString().split(`--${boundary}`);

    // Extract binary file section
    const filePart = parts.find((p) =>
      p.includes("Content-Type: image")
    );

    const start = filePart.indexOf("\r\n\r\n") + 4;
    const end = filePart.lastIndexOf("\r\n");

    const imgBuffer = Buffer.from(filePart.slice(start, end), "binary");

    // Upload to blob
    const blob = await put(`vision-${Date.now()}.jpg`, imgBuffer, {
      access: "public",
      contentType: "image/jpeg",
    });

    const imgUrl = blob.url;

    // Call vision model
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are Cipher Vision." },
        {
          role: "user",
          content: [
            { type: "input_image", image_url: { url: imgUrl } },
            { type: "text", text: "Describe the image in detail." },
          ],
        },
      ],
    });

    return res.status(200).json({
      reply: completion.choices[0].message.content,
      imgUrl,
    });
  } catch (err) {
    console.error("VISION ERROR:", err);
    return res.status(500).json({ error: "Vision failed", details: err.message });
  }
}
