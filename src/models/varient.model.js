const mongoose = require("mongoose");

const varientSchema = new mongoose.Schema(
  {
    productId: { required: true, type: mongoose.Types.ObjectId },
    sku: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

const Varient =
  mongoose.models.varients ?? mongoose.model("varients", varientSchema);
module.exports = Varient;
