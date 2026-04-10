import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",

      line_items: [
        {
          price: process.env.STRIPE_SHOPSTREAM_PRICE_ID, // 🔥 using your env var
          quantity: 1,
        },
      ],

      success_url: `${req.headers.origin}/shopstream?success=true`,
      cancel_url: `${req.headers.origin}/shopstream/signup`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stripe error" });
  }
}
