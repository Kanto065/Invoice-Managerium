const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    shutdown: {
      required: true,
      type: String,
      enum: ["up", "down"],
      default: "up",
    },
  },
  { timestamps: true }
);

const Setting =
  mongoose.models.settings ?? mongoose.model("settings", settingSchema);
module.exports = Setting;
