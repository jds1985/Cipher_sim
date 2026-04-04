// pages/api/ciphernet/search.js

import { getDb } from "../../../firebaseAdmin.js";

function scoreNode(node, q) {
  const query = String(q || "").toLowerCase().trim();
  if (!query) return 0;

  let score = 0;

  if (String(node.content || "").toLowerCase().includes(query)) score += 5;

  const tags = Array.isArray(node.tags) ? node.tags : [];
  for (const tag of tags) {
    if (String(tag).toLowerCase().includes(query)) score += 3;
  }

  score += Math.min(Number(node.importance || 0), 1);

  return score;
}

export default async function handler(req, res) {
  if (process.env.ENABLE_CIPHER_NET !== "true") {
    return res.status(503).json({ error: "CipherNet disabled" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const q = String(req.query?.q || "").trim();
    const userId = req.query?.userId;

    // ✅ FIX: fallback userId so system always works
    const safeUserId = userId || "demo";

    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    const snap = await db
      .collection("memory_nodes")
      .doc(safeUserId) // ✅ FIXED
      .collection("nodes")
      .limit(100)
      .get();

    let results = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (q) {
      results = results
        .map((node) => ({ ...node, _score: scoreNode(node, q) }))
        .filter((node) => node._score > 0)
        .sort((a, b) => b._score - a._score);
    } else {
      results = results.sort((a, b) => {
        return Number(b.importance || 0) - Number(a.importance || 0);
      });
    }

    return res.status(200).json({
      ok: true,
      count: results.length,
      results: results.map(({ _score, ...node }) => node),
    });
  } catch (err) {
    console.error("CipherNet search error:", err);
    return res.status(500).json({ error: err.message || "Search failed" });
  }
}
