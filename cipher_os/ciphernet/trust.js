// cipher_os/ciphernet/trust.js

import { getDb } from "../../firebaseAdmin.js";

export async function updateNodeTrustFromRun({
  nodeId,
  score,
  success,
}) {
  const db = getDb();
  if (!db) return;

  const ref = db.collection("ciphernet_nodes").doc(nodeId);
  const snap = await ref.get();

  if (!snap.exists) return;

  const node = snap.data();

  const totalRuns = Number(node.totalRuns || 0) + 1;
  const prevAvg = Number(node.avgScore || 0);
  const prevSuccessRate = Number(node.successRate || 0);

  const avgScore = ((prevAvg * (totalRuns - 1)) + score) / totalRuns;
  const successRate =
    ((prevSuccessRate * (totalRuns - 1)) + (success ? 1 : 0)) / totalRuns;

  await ref.update({
    totalRuns,
    avgScore: Number(avgScore.toFixed(4)),
    successRate: Number(successRate.toFixed(4)),
    updatedAt: Date.now(),
  });
}
