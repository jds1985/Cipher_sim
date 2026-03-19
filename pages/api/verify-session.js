import Stripe from "stripe";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 INIT FIREBASE ADMIN (only once)
if (!global._firebaseAdmin) {
  const app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
  global._firebaseAdmin = app;
}

const db = getFirestore();

export default async function handler(req, res) {
  try {
    const { sessionId, userId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    // 🔍 VERIFY WITH STRIPE
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ success: false });
    }

    // 🧠 DETERMINE PLAN
    const plan = "pro"; // (we'll upgrade this later for builder tier)

    // 💾 SAVE TO FIREBASE
    if (userId) {
      await db.collection("users").doc(userId).set(
        {
          plan,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    return res.status(200).json({ success: true, plan });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
