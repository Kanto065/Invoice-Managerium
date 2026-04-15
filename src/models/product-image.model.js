const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    productId: {
      required: true,
      type: mongoose.Types.ObjectId,
    },
    image: {
      required: true,
      type: String,
    },
  },
  { timestamps: true }
);

const ProductImages =
  mongoose.models.productimages ??
  mongoose.model("productimages", productImageSchema);
module.exports = ProductImages;
