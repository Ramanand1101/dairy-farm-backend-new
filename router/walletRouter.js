const express = require("express");
const { Wallet } = require("../model/walletModel");
const walletRouter = express.Router();
require("dotenv").config();
const stripe = require("stripe")(process.env.stripekey);

// API routes
walletRouter.get("/", (req, res) => {
  res.send("Wallet backend running");
});

walletRouter.post("/api/add-money", async (req, res) => {
  const { amount } = req.body;

  try {
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // converting to cents
      currency: "inr", // change currency as per your requirement
    });

    // Update MongoDB wallet balance
    let wallet = await Wallet.findOne();

    if (!wallet) {
      wallet = new Wallet({ balance: 0 });
      await wallet.save();
    }

    wallet.balance += amount;
    await wallet.save();

    res.status(200).json({
      client_secret: paymentIntent.client_secret,
      balance: wallet.balance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add money to wallet" });
  }
});

walletRouter.post("/api/purchase", async (req, res) => {
  const { amount } = req.body;

  try {
    // Find the wallet object
    let wallet = await Wallet.findOne();

    // If wallet is not found, create a new one
    if (!wallet) {
      wallet = new Wallet({ balance: 0 });
      await wallet.save();
    }

    // Check if wallet balance is sufficient for purchase
    if (wallet.balance < amount) {
      return res
        .status(400)
        .json({ error: "Insufficient balance for purchase" });
    }

    // Subtract purchase amount
    wallet.balance -= amount;

    // Add 4% bonus
    const bonus = Math.floor(amount * 0.04);
    wallet.balance += bonus;
    await wallet.save();

    console.log(wallet.balance);
    res
      .status(200)
      .json({ message: "Purchase successful", balance: wallet.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process purchase" });
  }
});

// API route to get total wallet balance
walletRouter.get("/api/wallet-balance", async (req, res) => {
  try {
    // Find the wallet object
    const wallet = await Wallet.findOne();

    if (!wallet) {
      // If wallet not found, return 0 balance
      return res.status(200).json({ balance: 0 });
    }

    // Return the current balance
    res.status(200).json({ balance: wallet.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve wallet balance" });
  }
});
module.exports = {
  walletRouter,
};
