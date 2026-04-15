const mongoose = require("mongoose");

const categoryDiscountSchema = new mongoose.Schema({
  discountId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Discount",
  },
  categoryId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "Category",
  },
  method: { type: String, enum: ["flat", "percentage"], required: true },
  value: { type: Number, required: true },
});

const CategoryDiscount =
  mongoose.models.categorydiscounts ??
  mongoose.model("categorydiscounts", categoryDiscountSchema);

module.exports = CategoryDiscount;
