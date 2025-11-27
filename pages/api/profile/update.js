import { db } from "../../../firebaseAdmin";

export default async function handler(req, res) {
  const { userId, updates } = req.body;

  await db.collection("cipher_profiles")
    .doc(userId)
    .set(updates, { merge: true });

  res.json({ updated: true });
}
