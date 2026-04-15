const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema(
  {
    division: {
      required: true,
      type: String,
      unique: true,
      enum: [
        "Barishal",
        "Chattogram",
        "Dhaka",
        "Khulna",
        "Rajshahi",
        "Rangpur",
        "Mymensingh",
        "Sylhet",
      ],
    },
    cost: {
      required: true,
      type: Number,
    },
  },
  { timestamps: true }
);

const Shipping =
  mongoose.models.shippings ?? mongoose.model("shippings", shippingSchema);
module.exports = Shipping;
