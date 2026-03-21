import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  try {
    console.log("🔥 API HIT");

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }

    let priceId;

    if (req.body.plan === "pro") {
      priceId = process.env.STRIPE_PRO_PRICE_ID;
    } else if (req.body.plan === "builder") {
      priceId = process.env.STRIPE_BUILDER_PRICE_ID;
    } else {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId, // ✅ FIXED (use correct price)
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
    });

    console.log("✅ Session created:", session.url);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("🔥 FULL ERROR:", err);

    return res.status(500).json({
      error: err.message,
      details: err,
    });
  }
}
