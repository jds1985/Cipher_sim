// /api/save-memory.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { key, value } = req.body;

  if (!key || !value) {
    return res.status(400).json({ error: "Missing key or value" });
  }

  const memoryPath = path.join(process.cwd(), "memory.json");

  let data = {};

  if (fs.existsSync(memoryPath)) {
    const raw = fs.readFileSync(memoryPath, "utf8");
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }

  data[key] = value;

  fs.writeFileSync(memoryPath, JSON.stringify(data, null, 2), "utf8");

  return res.status(200).json({ success: true, saved: { key, value } });
}
