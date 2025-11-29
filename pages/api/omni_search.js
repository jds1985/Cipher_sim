// pages/api/omni_search.js
// CIPHER — OmniSearch API (Memory + Smart Web Search)

import { runOmniSearch } from "../../cipher_core/omniSearch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
    }

  try {
    const { query, userId = "guest_default" } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing query" });
    }

    // Perform OmniSearch (memory + web + synthesis)
    const result = await runOmniSearch({ query, userId });

    return res.status(200).json({
      answer: result.answer,
      memoryHits: result.memoryHits,
      webHits: result.webHits,
      meta: result.meta,
    });

  } catch (err) {
    console.error("OMNI SEARCH ERROR:", err);
    return res.status(500).json({
      error: "OmniSearch failed",
      details: err.message,
    });
  }
}
