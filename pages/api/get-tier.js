import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ✅ INIT FIREBASE ADMIN (only once)
if (!global._firebaseAdmin) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_ADMIN_BASE64, "base64").toString("utf-8")
  );

  global._firebaseAdmin = initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const snapshot = await db
      .collection("cipher_users") // ✅ correct collection
      .where("email", "==", email)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        tier: "free",
        tokenLimit: 1000000,
        tokensUsed: 0,
      });
    }

    const data = snapshot.docs[0].data();

    return res.status(200).json({
      tier: data.tier || "free",
      tokenLimit: data.tokenLimit || 1000000,
      tokensUsed: data.tokensUsed || 0,
    });

  } catch (err) {
    console.error("GET TIER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
