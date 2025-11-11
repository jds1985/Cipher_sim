import { db } from "../../firebaseAdmin.js";
import { collection, getDocs, orderBy, limit, query } from "firebase-admin/firestore";

export default async function handler(req, res) {
  try {
    const memoryRef = collection(db, "cipher_memory");
    const q = query(memoryRef, orderBy("timestamp", "asc"), limit(100));
    const snapshot = await getDocs(q);

    const messages = snapshot.docs.map(doc => doc.data());
    res.status(200).json({ messages });
  } catch (error) {
    console.error("🔥 Memory load failed:", error);
    res.status(500).json({ error: "Failed to load memory" });
  }
}
