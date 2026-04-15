const mongoose = require("mongoose");

const discountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // "Summer Sale", "10OFF"
    type: {
      type: String,
      enum: ["product", "category", "coupon", "quantity"],
      required: true,
    }, // "product", "category", "coupon", "quantity"
    method: {
      type: String,
      enum: ["flat", "percentage", "bogo", "tier"],
      required: true,
    }, // "flat" | "percentage" | "bogo" | "tier"
    value: {
      type: Number,
      required: false,
    }, // discount amount/percentage
    minQty: {
      type: Number,
      required: false,
    }, // for quantity/tier discounts

    minCartValue: Number, // for coupon applicability
    code: { type: String, unique: true, sparse: true }, // coupon code (if type = coupon)
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Discount =
  mongoose.models.discounts ?? mongoose.model("discounts", discountSchema);

module.exports = Discount;
