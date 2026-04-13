// pages/api/memory.js

import { loadMemoryNodes } from "../../cipher_os/memory/memoryGraph.js";

export default async function handler(req, res) {
  try {
    // 🧠 Allow query params
    const userId = String(req.query.user || "guest");
    const limit = Number(req.query.limit || 200);

    // 🔒 Basic method guard (optional but good practice)
    if (req.method !== "GET") {
      return res.status(405).json({
        ok: false,
        error: "method_not_allowed",
      });
    }

    // 📦 Load memory safely (limit applied)
    const nodes = await loadMemoryNodes(userId, limit);

    // 🧹 Normalize response (defensive shaping)
    const safeNodes = Array.isArray(nodes) ? nodes : [];

    return res.status(200).json({
      ok: true,
      count: safeNodes.length,
      nodes: safeNodes,
    });
  } catch (err) {
    console.error("memory api error:", err);

    return res.status(500).json({
      ok: false,
      error: "failed_to_load_memory",
    });
  }
}
