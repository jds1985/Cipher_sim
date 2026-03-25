// pages/api/ciphernet/search.js

import { getDb } from "../../../firebaseAdmin.js";

function scoreNode(node, q) {
  const query = String(q || "").toLowerCase().trim();
  if (!query) return 0;

  let score = 0;

  if (String(node.name || "").toLowerCase().includes(query)) score += 5;
  if (String(node.domain || "").toLowerCase().includes(query)) score += 4;
  if (String(node.description || "").toLowerCase().includes(query)) score += 3;

  const keywords = Array.isArray(node.keywords) ? node.keywords : [];
  for (const kw of keywords) {
    if (String(kw).toLowerCase().includes(query)) score += 2;
  }

  if (node.verified) score += 1;
  score += Math.min(Number(node.avgScore || 0), 1);
  score += Math.min(Number(node.totalRuns || 0) / 100, 1);

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

    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    const snap = await db
      .collection("ciphernet_nodes")
      .where("active", "==", true)
      .limit(50)
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
        if (Boolean(b.verified) !== Boolean(a.verified)) {
          return Number(b.verified) - Number(a.verified);
        }
        if (Number(b.avgScore || 0) !== Number(a.avgScore || 0)) {
          return Number(b.avgScore || 0) - Number(a.avgScore || 0);
        }
        return Number(b.totalRuns || 0) - Number(a.totalRuns || 0);
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
