// pages/api/omni_search.js
// CIPHER OmniSearch API — memory + web search

import { runOmniSearch } from "../../cipher_core/omniSearch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, meta } = req.body || {};
  const userId = meta?.userId || "guest_default";

  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "No query provided" });
  }

  try {
    const result = await runOmniSearch({ query, userId });

    return res.status(200).json(result);
  } catch (err) {
    console.error("OMNISEARCH ERROR:", err);
    return res.status(500).json({
      error: "OmniSearch failed",
      details: err.message,
    });
  }
}
