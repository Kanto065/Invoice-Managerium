const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: {
      required: true,
      type: String,
    },
    image: {
      required: false,
      type: String,
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

const Brand = mongoose.models.brands ?? mongoose.model("brands", brandSchema);
module.exports = Brand;
