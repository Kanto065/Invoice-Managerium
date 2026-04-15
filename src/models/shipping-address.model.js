const mongoose = require("mongoose");

const shippingAddressSchema = new mongoose.Schema(
  {
    userId: {
      required: true,
      type: mongoose.Types.ObjectId,
    },
    street: {
      required: true,
      type: String,
    },
    city: {
      required: true,
      type: String,
    },
    postCode: {
      required: true,
      type: Number,
    },
    country: {
      required: true,
      type: String,
    },
  },
  { timestamps: true }
);

const ShippingAddress =
  mongoose.models.shippingaddresses ??
  mongoose.model("shippingaddresses", shippingAddressSchema);
module.exports = ShippingAddress;
