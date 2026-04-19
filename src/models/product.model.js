const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      required: true,
      type: String,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shops",
      required: function() { return !this.isDemo; },
    },
    slug: {
      required: true,
      type: String,
      unique: true,
    },
    varientId: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    brandId: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    description: {
      required: true,
      type: String,
    },
    price: {
      required: true,
      type: Number,
    },
    previousPrice: {
      type: Number,
      default: null,
    },
    extraPrice: {
      type: Number,
      default: null,
    },
    buyingPrice: {
      type: Number,
      default: null,
    },
    stock: {
      required: true,
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    location: {
      type: String,
      enum: [
        "Barishal",
        "Chattogram",
        "Dhaka",
        "Khulna",
        "Mymensingh",
        "Rajshahi",
        "Rangpur",
        "Sylhet",
      ],
      default: "Dhaka",
    },
    featured: {
      type: Boolean,
      required: false,
      default: false,
    },
    freeDelivery: {
      type: Boolean,
      required: false,
      default: false,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
    status: {
      required: true,
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.products ?? mongoose.model("products", productSchema);
module.exports = Product;
