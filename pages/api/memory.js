// /pages/api/memory.js
import { db } from "../../firebaseConfig";
import {
  collection,
  getDocs,
  orderBy,
  limit,
  query,
} from "firebase/firestore";

// This endpoint reads saved chat memory from Firestore.
// You can call it from your frontend with:  fetch("/api/memory")

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // 🔍 Build query to get the latest 100 chat entries, ordered by time
      const q = query(
        collection(db, "cipher_memory"),
        orderBy("timestamp", "asc"),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ messages });
    } catch (error) {
      console.error("🔥 Memory fetch error:", error);
      return res.status(500).json({
        error: "Failed to fetch memory",
        diagnostics: { message: error.message },
      });
    }
  }

  // Only allow GET requests
  return res.status(405).json({ message: "Method not allowed" });
}
