import { getStripe } from "../../../lib/stripe";
import { getAdminAuth, getDb, admin } from "../../../firebaseAdmin";

const PLAN_TO_PRICE = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
  builder: process.env.STRIPE_PRICE_ID_BUILDER,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 🔐 Verify user
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const adminAuth = getAdminAuth();
    const db = getDb();

    if (!adminAuth || !db) {
      return res.status(500).json({ error: "Server not ready" });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email || null;

    // 📦 Plan selection
    const plan = String(req.body?.plan || "").toLowerCase();
    const priceId = PLAN_TO_PRICE[plan];

    if (!priceId) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const userRef = db.collection("cipher_users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};

    const stripe = getStripe();

    // 👤 Create or reuse Stripe customer
    let customerId = userData?.stripeCustomerId || null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: {
          firebaseUid: uid,
        },
      });

      customerId = customer.id;

      await userRef.set(
        {
          email: email || null,
          stripeCustomerId: customerId,
          tier: userData?.tier || "free",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // 🌐 App URL
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 💳 Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/store?checkout=success`,
      cancel_url: `${appUrl}/store?checkout=cancelled`,
      allow_promotion_codes: true,

      metadata: {
        firebaseUid: uid,
        plan,
      },

      subscription_data: {
        metadata: {
          firebaseUid: uid,
          plan,
        },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: err.message });
  }
}
