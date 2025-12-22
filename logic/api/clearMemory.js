// /api/clear-memory.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const memoryPath = path.join(process.cwd(), "memory.json");

  if (fs.existsSync(memoryPath)) {
    fs.unlinkSync(memoryPath);
  }

  return res.status(200).json({ success: true, cleared: true });
}