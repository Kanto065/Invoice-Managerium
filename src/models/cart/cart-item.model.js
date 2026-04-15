const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    productId: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    varientId: {
      type: mongoose.Types.ObjectId,
      required: false,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    extraPrice: {
      type: Number,
      required: false,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const CartItem =
  mongoose.models.cartitems ?? mongoose.model("cartitems", cartItemSchema);
module.exports = CartItem;
