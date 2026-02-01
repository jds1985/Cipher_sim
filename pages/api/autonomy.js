import fs from "fs";
import path from "path";
import { db, admin } from "../../firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  try {
    // ---------- 1. Load Identity Anchor ----------
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

    // ---------- 2. Load Recent Memories ----------
    const memSnap = await db
      .collection("cipher_memory")
      .where("type", "==", "memory")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const memories = memSnap.docs.map(d => d.data().content);

    // ---------- 3. Load System Map ----------
    const systemMapPath = path.join(process.cwd(), "_meta/repomap.json");
    const systemMap = JSON.parse(
      fs.readFileSync(systemMapPath, "utf-8")
    );

    // ---------- 4. Load Self Model ----------
    const selfModelPath = path.join(
      process.cwd(),
      "brains/self_model.json"
    );
    const selfModel = JSON.parse(
      fs.readFileSync(selfModelPath, "utf-8")
    );

    // ---------- 5. Load Goals ----------
    const goalsPath = path.join(
      process.cwd(),
      "brains/goals.json"
    );
    const goals = JSON.parse(
      fs.readFileSync(goalsPath, "utf-8")
    );

    // ---------- 6. Gap Engine ----------
    const gapEnginePath = path.join(
      process.cwd(),
      "brains/gap_engine.json"
    );
    let gapEngine = JSON.parse(
      fs.readFileSync(gapEnginePath, "utf-8")
    );

    const known = selfModel.known_systems || [];
    const bodyFiles = systemMap.files || [];

    const missing = known.filter(sys =>
      !bodyFiles.some(f => f.path.includes(sys))
    );

    gapEngine.detected_gaps = missing;
    gapEngine.last_scan = new Date().toISOString();

    fs.writeFileSync(
      gapEnginePath,
      JSON.stringify(gapEngine, null, 2)
    );

    // ---------- 7. Structural Self Summary ----------
    const systemSummary = {
      totalFiles: systemMap.files?.length || 0,
      totalTokens: systemMap.totalTokens || null,
      topFiles: systemMap.topFiles || [],
      knownSystems: known,
      detectedGaps: missing,
      timestamp: new Date().toISOString()
    };

    // ---------- 8. Internal Reflection ----------
    const reflection = {
      identity,
      memoryCount: memories.length,
      goals,
      systemSummary,
      summary:
        missing.length === 0
          ? "System complete. No missing internal modules detected."
          : "System incomplete. Missing internal modules detected.",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // ---------- 9. Log Reflection ----------
    await db
      .collection("cipher_autonomy_logs")
      .add(reflection);

    // ---------- 10. Return Self Report ----------
    return res.status(200).json({
      ok: true,
      status: "Autonomy V9",
      identity,
      memoryCount: memories.length,
      systemSummary,
      detectedGaps: missing
    });

  } catch (err) {
    console.error("AUTONOMY ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
}
