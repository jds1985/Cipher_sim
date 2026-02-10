import { getDb } from "../../firebaseAdmin";

export default async function handler(req, res) {
  try {
    const db = getDb();
    if (!db) return res.status(200).json({ nodes: [] });

    const snap = await db
      .collection("nodes")
      .orderBy("updatedAt", "desc")
      .limit(100)
      .get();

    const nodes = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ nodes });
  } catch (err) {
    console.error("memory api error:", err);
    res.status(500).json({ error: "failed" });
  }
}
