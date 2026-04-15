const mongoose = require("mongoose");

const varientAttributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Varient =
  mongoose.models.varientattributes ??
  mongoose.model("VarientAttribute", varientAttributeSchema);
module.exports = Varient;
