// pages/api/soul_tree.js
// Returns Cipher’s Soul Hash Identity Tree for debugging/visualization

import { db } from "../../firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const doc = await db.collection("cipher_branches").doc("main").get();

    if (!doc.exists) {
      return res.status(200).json({
        nodes: [],
        message: "No soul identity records found.",
      });
    }

    const data = doc.data();
    const nodes = data.nodes || [];

    return res.status(200).json({
      total: nodes.length,
      nodes: nodes,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to load soul tree",
      details: err.message,
    });
  }
}
