import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
    const { userId, tokens } = req.body;

    if (!userId || !tokens) {
      return res.status(400).json({ error: "Missing data" });
    }

    const ref = db.collection("cipher_users").doc(userId);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    let data = doc.data();

    // ✅ MONTHLY RESET LOGIC (ADDED)
    const now = new Date();
    const lastReset = data.lastReset?.toDate?.() || new Date(0);

    if (
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear()
    ) {
      await ref.update({
        tokensUsed: 0,
        lastReset: new Date(),
      });

      data.tokensUsed = 0; // keep local state in sync
    }

    const newTotal = (data.tokensUsed || 0) + tokens;

    if (newTotal > data.tokenLimit) {
      return res.status(403).json({ error: "Token limit exceeded" });
    }

    await ref.update({
      tokensUsed: newTotal,
    });

    return res.status(200).json({
      success: true,
      tokensUsed: newTotal,
      tokenLimit: data.tokenLimit,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
