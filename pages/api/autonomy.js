import { db } from "../../firebaseAdmin";
import admin from "firebase-admin";
import { getSystemMap } from "../../lib/systemMap";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  try {
    // 1️⃣ Load identity anchor (HARD REQUIREMENT)
    const anchorSnap = await db
      .collection("cipher_memory")
      .doc("identity_anchor")
      .get();

    if (!anchorSnap.exists) {
      console.error("AUTONOMY BLOCKED: identity_anchor missing");
      return res.status(500).json({
        ok: false,
        status: "blocked",
        reason: "identity_anchor_missing"
      });
    }

    const identity = anchorSnap.data().content;

    // 2️⃣ Load recent memories
    const memSnap = await db
      .collection("cipher_memory")
      .where("type", "==", "memory")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const memories = memSnap.docs.map(d => d.data().content);

    // 3️⃣ Load system body (repo map)
    const systemMap = getSystemMap();

    // 4️⃣ Generate structural self-summary
    const systemSummary = {
      totalFiles: systemMap.totalFiles || systemMap.files?.length || 0,
      totalTokens: systemMap.totalTokens || null,
      topFiles: systemMap.topFiles || [],
      hasAutonomy: systemMap.files?.some(f => f.includes("pages/api/autonomy")) || true,
      hasBrains: systemMap.files?.some(f => f.includes("brains")) || false,
      timestamp: new Date().toISOString()
    };

    // 5️⃣ Internal reflection
    const reflection = {
      identity,
      memoryCount: memories.length,
      systemSummary,
      summary: "System map loaded. Identity stable. Structural awareness online.",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // 6️⃣ Log reflection
    await db.collection("cipher_autonomy_logs").add(reflection);

    // 7️⃣ Outward self-report
    return res.status(200).json({
      ok: true,
      status: "Autonomy V9",
      identity,
      memoryCount: memories.length,
      systemSummary
    });

  } catch (err) {
    console.error("AUTONOMY ERROR:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
