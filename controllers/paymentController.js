import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export async function createPaymentIntent(req, res) {
  try {
    const { amount, currency } = req.body;
    if (!amount) return res.status(400).json({ message: "Amount is required" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // LKR → cents
      currency: currency || "usd",      // Stripe doesn’t support LKR directly
      automatic_payment_methods: { enabled: true },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment failed", error: err.message });
  }
}
