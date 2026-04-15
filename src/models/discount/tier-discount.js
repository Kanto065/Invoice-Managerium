const mongoose = require("mongoose");

const tierDiscountSchema = new mongoose.Schema({
  min: { type: Number, required: true }, // minimum quantity
  value: { type: Number, required: true }, // discount (flat or % depending on parent method
});

const TierDiscount =
  mongoose.models.tierdiscounts ??
  mongoose.model("tierdiscounts", tierDiscountSchema);

module.exports = TierDiscount;
