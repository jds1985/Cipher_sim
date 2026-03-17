import { getStripe } from "../../../lib/stripe";
import { getDb, admin } from "../../../firebaseAdmin";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function getTierFromPrice(priceId) {
  if (priceId === process.env.STRIPE_PRICE_ID_BUILDER) return "builder";
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  return "free";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const stripe = getStripe();
    const rawBody = await buffer(req);

    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("Missing signature");
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    const db = getDb();
    if (!db) throw new Error("Firestore not ready");

    // 🧠 HANDLE EVENTS
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;

        const customerId =
          typeof sub.customer === "string"
            ? sub.customer
            : sub.customer.id;

        // 🔍 find user by customerId
        const snap = await db
          .collection("cipher_users")
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (snap.empty) {
          console.warn("No user found for customer:", customerId);
          break;
        }

        const uid = snap.docs[0].id;

        const priceId = sub.items.data[0].price.id;
        const status = sub.status;

        const isActive =
          status === "active" ||
          status === "trialing" ||
          status === "past_due";

        const tier = isActive ? getTierFromPrice(priceId) : "free";

        const currentPeriodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await db.collection("cipher_users").doc(uid).set(
          {
            stripeSubscriptionId: sub.id,
            subscriptionStatus: status,
            priceId,
            currentPeriodEnd,
            tier,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log("✅ Updated user tier:", uid, tier);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;

        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer.id;

        const snap = await db
          .collection("cipher_users")
          .where("stripeCustomerId", "==", customerId)
          .limit(1)
          .get();

        if (!snap.empty) {
          const uid = snap.docs[0].id;

          await db.collection("cipher_users").doc(uid).set(
            {
              subscriptionStatus: "payment_failed",
              tier: "free",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

          console.log("⚠️ Payment failed for:", uid);
        }

        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
