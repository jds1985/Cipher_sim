// pages/api/omni_search.js
// Cipher Core 10.0 — OmniSearch API (Memory Only)

import { omniSearch } from "../../cipher_core/omniSearch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { query, userId = "jim_default" } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing or invalid query" });
    }

    // Run the search
    const results = await omniSearch(query, userId);

    return res.status(200).json({
      query: results.query,
      count: results.count,
      hits: results.hits,
      summary: results.summary,
    });

  } catch (err) {
    console.error("🔥 OmniSearch API Error:", err.message);
    return res.status(500).json({
      error: "OmniSearch failed",
      details: err.message,
    });
  }
}
