// server.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY is not set");
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
  })
);

app.use(express.json());

// Map of your Stripe prices (matches your products)
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

// health check
app.get("/", (req, res) => {
  res.send("Solen backend is running ✅");
});

// Create Stripe checkout session for cart
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items to checkout" });
    }

    const line_items = items.map((item) => {
      const priceId = PRICE_MAP[item.id]?.[item.size];
      if (!priceId) {
        throw new Error(`Unknown item: ${item.id} size ${item.size}`);
      }

      return {
        price: priceId,
        quantity: item.quantity || 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Error creating checkout session:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
