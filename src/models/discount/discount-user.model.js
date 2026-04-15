const mongoose = require("mongoose");

const discountUserSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

const DiscountUser =
  mongoose.models.discountusers ??
  mongoose.model("discountusers", discountUserSchema);
module.exports = DiscountUser;
