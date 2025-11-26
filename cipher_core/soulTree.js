import { db } from "../firebaseAdmin";
import { doc, getDoc } from "firebase-admin/firestore";

export async function loadCipherPrime() {
  const rootRef = db.collection("cipher_prime").doc("cipher_soul_trees").doc("root");
  const snapshot = await rootRef.get();

  if (!snapshot.exists) {
    throw new Error("Cipher Prime SoulTree not found");
  }

  return snapshot.data();
}
