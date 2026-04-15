const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      required: true,
      type: mongoose.Types.ObjectId,
    },
    productId: {
      required: true,
      type: mongoose.Types.ObjectId,
    },
    varientId: {
      required: false,
      type: mongoose.Types.ObjectId,
    },
    name: {
      required: true,
      type: String,
    },
    image: {
      required: false,
      type: String,
    },
    price: {
      required: true,
      type: Number,
    },
    quantity: {
      required: true,
      type: Number,
    },
    total: {
      required: true,
      type: Number,
    },
  },
  { timestamps: true }
);

const OrderItem =
  mongoose.models.orderitems ?? mongoose.model("orderitems", orderItemSchema);
module.exports = OrderItem;
