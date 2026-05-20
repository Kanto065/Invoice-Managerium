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

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncProductImage, deleteProductImage } = require("../lib/mysql-sync");

productImageSchema.post("save", function (doc) { syncProductImage(doc); });

productImageSchema.post("findOneAndUpdate", function (doc) { if (doc) syncProductImage(doc); });

productImageSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
productImageSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncProductImage(doc);
});

productImageSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
productImageSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteProductImage(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const ProductImages =
  mongoose.models.productimages ??
  mongoose.model("productimages", productImageSchema);
module.exports = ProductImages;
