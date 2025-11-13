// /api/load-memory.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { key } = req.query;
  const memoryPath = path.join(process.cwd(), "memory.json");

  if (!fs.existsSync(memoryPath)) {
    return res.status(200).json({ memory: key ? null : {} });
  }

  const raw = fs.readFileSync(memoryPath, "utf8");
  let data = {};

  try {
    data = JSON.parse(raw);
  } catch {
    data = {};
  }

  if (key) {
    return res.status(200).json({
      key,
      value: data[key] || null
    });
  }

  return res.status(200).json({ memory: data });
}
