// cipher_core/soulLoader.js
// Unified Memory Loader for Soul Hash Tree + Profile + Runtime Context

import { db } from "../firebaseAdmin";
import { loadOrCreateProfile } from "./profile";

/* -------------------------------------------------------
   LOAD SOUL HASH TREE NODES
------------------------------------------------------- */
export async function loadSoulHashNodes() {
  try {
    const ref = db.collection("cipher_branches").doc("main");
    const snap = await ref.get();

    if (!snap.exists) {
      return { nodes: [], summary: "No soul identity records yet." };
    }

    const data = snap.data() || {};
    const nodes = data.nodes || [];

    // Build a brief summary (short, clean)
    let summary = "Soul Hash Tree (Identity Nodes):\n";

    nodes.slice(-15).forEach((n, i) => {
      summary += `\nNode #${i + 1}:\n`;
      summary += `  value: ${JSON.stringify(n.value).slice(0, 120)}\n`;
      summary += `  timestamp: ${n.timestamp}\n`;
    });

    return { nodes, summary };
  } catch (err) {
    console.error("Soul Hash Loader Error:", err);
    return { nodes: [], summary: "Error loading Soul Hash Tree." };
  }
}

/* -------------------------------------------------------
   UNIFIED LOADER — PROFILE + SOUL TREE + CONTEXT
------------------------------------------------------- */
export async function loadUnifiedSoulContext(userId = "guest_default") {
  try {
    // Load profile
    const profile = await loadOrCreateProfile(userId);

    // Load Soul Hash data
    const soul = await loadSoulHashNodes();

    // Build final context object
    return {
      profile,
      soulNodes: soul.nodes,
      soulSummary: soul.summary,
    };
  } catch (err) {
    console.error("Unified Soul Loader Error:", err);
    return {
      profile: null,
      soulNodes: [],
      soulSummary: "Loader Failure",
    };
  }
}
