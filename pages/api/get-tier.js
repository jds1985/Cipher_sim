import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_ADMIN_BASE64, "base64").toString("utf-8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ tier: "free" });
    }

    const snapshot = await db
      .collection("cipher_users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ tier: "free" });
    }

    const data = snapshot.docs[0].data();

    return res.status(200).json({
      tier: data.tier || "free",
    });
  } catch (err) {
    console.error("Tier API error:", err);
    return res.status(500).json({ tier: "free" });
  }
}
