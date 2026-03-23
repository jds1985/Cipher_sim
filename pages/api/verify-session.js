import Stripe from "stripe";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//  INIT FIREBASE ADMIN (only once)
if (!global._firebaseAdmin) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_ADMIN_BASE64, "base64").toString("utf-8")
  ); // ✅ FIXED ENV NAME

  const app = initializeApp({
    credential: cert(serviceAccount),
  });

  global._firebaseAdmin = app;
}

const db = getFirestore();

export default async function handler(req, res) {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ success: false });
    }

    // ✅ dynamic tier from Stripe metadata
    const tier = session.metadata?.plan || "pro";

    // ✅ CORRECT token limits (single source of truth)
    let tokenLimit = 1000000; // free

    if (tier === "pro") tokenLimit = 5000000;
    if (tier === "builder") tokenLimit = 20000000;

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      null;

    if (email) {
      const snapshot = await db
        .collection("cipher_users")
        .where("email", "==", email)
        .get();

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;

        await docRef.set(
          {
            email,
            tier,
            tokenLimit,        // ✅ ADDED
            tokensUsed: 0,     // ✅ ADDED (reset on upgrade)
            lastReset: new Date(), // ✅ ADDED (for monthly reset later)
            updatedAt: new Date(),
          },
          { merge: true }
        );
      }
    }

    return res.status(200).json({ success: true, tier });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
