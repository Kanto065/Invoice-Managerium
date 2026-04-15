const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      required: true,
      type: String,
    },
    slug: {
      required: true,
      type: String,
      unique: true,
    },
    image: {
      required: true,
      type: String,
    },
    parentId: {
      required: false,
      type: mongoose.Types.ObjectId,
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

const Category =
  mongoose.models.categories ?? mongoose.model("categories", categorySchema);
module.exports = Category;
