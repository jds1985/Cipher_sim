// pages/api/ciphernet/execute.js

import { getDb } from "../../../firebaseAdmin.js";
import { executeCipherNetNode } from "../../../cipher_os/ciphernet/executor.js";
import { updateNodeTrustFromRun } from "../../../cipher_os/ciphernet/trust.js";

export default async function handler(req, res) {
  if (process.env.ENABLE_CIPHER_NET !== "true") {
    return res.status(503).json({ error: "CipherNet disabled" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { nodeId, input, userId = "guest" } = req.body || {};

    if (!nodeId) {
      return res.status(400).json({ error: "Missing nodeId" });
    }

    const db = getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    const nodeRef = db.collection("ciphernet_nodes").doc(nodeId);
    const snap = await nodeRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Node not found" });
    }

    const node = { id: snap.id, ...snap.data() };

    if (!node.active) {
      return res.status(403).json({ error: "Node inactive" });
    }

    const exec = await executeCipherNetNode(node, { input, userId });

    const priceCharged = Number(node.pricePerCall || 0);
    const platformCut = Number((priceCharged * 0.2).toFixed(2));
    const nodePayout = Number((priceCharged - platformCut).toFixed(2));

    const runDoc = await db.collection("ciphernet_runs").add({
      nodeId: node.id,
      userId,
      requestDomain: node.domain || "general",
      inputPreview: JSON.stringify(input || {}).slice(0, 180),
      status: "success",
      latencyMs: exec.latencyMs,
      score: 0.8,
      priceCharged,
      platformCut,
      nodePayout,
      createdAt: Date.now(),
    });

    await updateNodeTrustFromRun({
      nodeId: node.id,
      score: 0.8,
      success: true,
    });

    return res.status(200).json({
      ok: true,
      nodeId: node.id,
      runId: runDoc.id,
      result: exec.result,
      latencyMs: exec.latencyMs,
    });
  } catch (err) {
    console.error("CipherNet execute error:", err);
    return res.status(500).json({ error: err.message || "Execution failed" });
  }
}
