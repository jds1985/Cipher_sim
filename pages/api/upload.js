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

    const buffer = Buffer.from(fileData, "base64");

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
