// server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Safety check – if key is missing, crash with a clear error
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY is not set");
  process.exit(1);
}

const app = express();

// Allow your frontend to call this backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
  })
);

app.use(express.json());

// Map of your Stripe prices
const PRICE_MAP = {
  "white-sweatpants": {
    S: "price_1SSTdD6VqDaMUiptLNJ61G1p",
    M: "price_1SSTfr6VqDaMUiptfHrrKGM9",
    L: "price_1SSTiC6VqDaMUiptdlnIXEnm",
  },
  "black-sweatpants": {
    S: "price_1SSRfT6VqDaMUiptecql1O1w",
    M: "price_1SSTRj6VqDaMUiptfVyDtfZD",
    L: "price_1SSTVy6VqDaMUipt5Me5cnpB",
  },
};

// Health check
app.get("/", (req, res) => {
  res.send("Solen backend is running ✅");
});

/**
 * Expected body from frontend:
 * {
 *   "product": "white-sweatpants" | "black-sweatpants",
 *   "size": "S" | "M" | "L",
 *   "quantity": 1
 * }
 */
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { product, size, quantity } = req.body;

    if (!PRICE_MAP[product]) {
      return res.status(400).json({ error: "Invalid product" });
    }
    const priceId = PRICE_MAP[product][size];
    if (!priceId) {
      return res.status(400).json({ error: "Invalid size" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: quantity || 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Error creating checkout session:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// IMPORTANT: Render sets process.env.PORT
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
