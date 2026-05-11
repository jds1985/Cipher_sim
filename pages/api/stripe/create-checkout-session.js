import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  try {

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],

      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/launch.html`,
    });

    res.status(200).json({
      url: session.url
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }
}
