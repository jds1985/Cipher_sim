// pages/api/upload.js
import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileData, fileName } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Convert base64 back to binary
    const buffer = Buffer.from(fileData, "base64");

    // Upload to Vercel Blob
    const uploaded = await put(`cipher/${fileName}`, buffer, {
      access: "public",
    });

    return res.status(200).json({
      success: true,
      url: uploaded.url,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ error: "Upload failed", details: err.message });
  }
}
