// pages/api/memory.js

import { loadMemoryNodes } from "../../cipher_os/memory/memoryGraph.js";

export default async function handler(req, res) {
  try {
    const userId = String(req.query.user || "jim");

    const nodes = await loadMemoryNodes(userId);

    return res.status(200).json({
      ok: true,
      count: nodes.length,
      nodes,
    });
  } catch (err) {
    console.error("memory api error:", err);
    return res.status(500).json({
      ok: false,
      error: "failed_to_load_memory",
    });
  }
}
