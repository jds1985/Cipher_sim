export const runtime = "nodejs";

import { loadMemoryNodes } from "../../../cipher_os/memory/memoryGraph.js";

export default async function handler(req, res) {
  try {
    const userId = "jim";

    const nodes = await loadMemoryNodes(userId, 50);

    return res.status(200).json({
      ok: true,
      count: nodes.length,
      nodes,
    });
  } catch (err) {
    console.error("❌ memory/top:", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "failed",
    });
  }
}
