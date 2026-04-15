const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      required: false,
      type: mongoose.Types.ObjectId,
    },
    guestId: {
      required: false,
      type: String,
    },
    total: {
      required: false,
      type: Number,
    },
  },
  { timestamps: true }
);

const Cart = mongoose.models.carts ?? mongoose.model("carts", cartSchema);
module.exports = Cart;
