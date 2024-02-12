const mongoose = require("mongoose");
const walletSchema = new mongoose.Schema({
  balance: Number,
});
const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = {
  Wallet,
};
