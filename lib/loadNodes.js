import { db } from "../lib/firebaseClient";
import { collection, getDocs } from "firebase/firestore";

export async function loadNodes() {
  try {
    const snapshot = await getDocs(collection(db, "cipher_nodes"));

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (err) {
    console.error("Load nodes error:", err);
    return [];
  }
}
