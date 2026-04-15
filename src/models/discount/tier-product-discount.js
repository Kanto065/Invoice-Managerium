const mongoose = require("mongoose");

const tierProductDiscountSchema = new mongoose.Schema({
  discountId: {
    type: mongoose.Types.ObjectId,
    ref: "Discount",
    required: true,
  },
  productId: {
    type: mongoose.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  tierId: {
    type: mongoose.Types.ObjectId,
    ref: "TierDiscount",
    required: true,
  },
});

const TierProductDiscount =
  mongoose.models.tierproductdiscounts ??
  mongoose.model("tierproductdiscounts", tierProductDiscountSchema);

module.exports = TierProductDiscount;
