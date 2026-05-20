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

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncBrand, deleteBrand } = require("../lib/mysql-sync");

brandSchema.post("save", function (doc) { syncBrand(doc); });

brandSchema.post("findOneAndUpdate", function (doc) { if (doc) syncBrand(doc); });

brandSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
brandSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncBrand(doc);
});

brandSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
brandSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteBrand(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const Brand = mongoose.models.brands ?? mongoose.model("brands", brandSchema);
module.exports = Brand;
