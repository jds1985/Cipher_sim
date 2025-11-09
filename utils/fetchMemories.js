// --- utils/fetchMemories.js ---
import { db } from "../firebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export async function fetchMemories() {
  try {
    const collections = [
      { name: "cipher_memory", type: "memory" },
      { name: "cipher_reflections", type: "reflection" },
      { name: "cipher_insights", type: "insight" },
      { name: "cipher_chronicle", type: "chronicle" },
    ];

    let allData = [];

    for (const col of collections) {
      const q = query(collection(db, col.name), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      const docs = snap.docs.map((doc) => ({
        id: doc.id,
        type: col.type,
        ...doc.data(),
      }));
      allData = allData.concat(docs);
    }

    return allData;
  } catch (err) {
    console.error("🔥 Error fetching memories:", err);
    return [];
  }
}
