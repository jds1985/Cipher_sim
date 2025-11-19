// pages/api/initmemory.js
// Initializes Firebase memory for Cipher

import { db } from "../../firebaseAdmin";

export default async function handler(req, res) {
  try {
    const initialMemory = {
      recentWindow: [],
      longTerm: [],
      personality: {
        name: "Cipher",
        version: "4.0",
        traits: ["loyal", "protective", "evolving"]
      },
      lastUpdated: new Date().toISOString()
    };

    await db.collection("cipher").doc("memory").set(initialMemory);

    return res.status(200).json({ success: true, memory: initialMemory });
  } catch (err) {
    console.error("INIT MEMORY ERROR:", err);
    return res.status(500).json({ error: "Failed to initialize memory" });
  }
}
