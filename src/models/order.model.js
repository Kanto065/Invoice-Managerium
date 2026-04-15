const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      required: true,
      type: String,
      unique: true,
    },
    userId: {
      required: true,
      type: mongoose.Types.ObjectId,
    },
    shippingAddressId: {
      required: true,
      type: mongoose.Types.ObjectId,
    },
    totalAmount: {
      required: true,
      type: Number,
    },
    grossAmount: {
      required: true,
      type: Number,
    },
    shippingAmount: {
      required: true,
      type: Number,
    },
    netAmount: {
      required: true,
      type: Number,
    },
    status: {
      required: true,
      type: String,
      enum: [
        "placed",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      default: "placed",
    },
    paymentStatus: {
      required: true,
      type: String,
      enum: ["not_paid", "paid"],
      default: "not_paid",
    },
    paymentType: {
      required: true,
      type: String,
      enum: ["cod", "bkash", "nagad", "card"],
      default: "cod",
    },
    transactionId: {
      required: false,
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

const Order = mongoose.models.orders ?? mongoose.model("orders", orderSchema);
module.exports = Order;
