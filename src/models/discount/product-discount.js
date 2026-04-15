const mongoose = require("mongoose");

const productDiscountSchema = new mongoose.Schema({
  discountId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Discount",
  },
  productId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Product",
  },
  method: {
    type: String,
    enum: ["flat", "percentage", "bogo"],
    required: true,
  },
  value: { type: Number, required: true },
});

const ProductDiscount =
  mongoose.models.productdiscounts ??
  mongoose.model("productdiscounts", productDiscountSchema);

module.exports = ProductDiscount;
