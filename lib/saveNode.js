import { db } from "../lib/firebaseClient";
import { collection, addDoc } from "firebase/firestore";

export async function saveNode(node) {
  try {
    const ref = await addDoc(collection(db, "cipher_nodes"), node);
    return ref.id;
  } catch (err) {
    console.error("Save node error:", err);
    return null;
  }
}
