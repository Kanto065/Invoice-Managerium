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

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncVarient, deleteVarient } = require("../lib/mysql-sync");

varientSchema.post("save", function (doc) { syncVarient(doc); });

varientSchema.post("findOneAndUpdate", function (doc) { if (doc) syncVarient(doc); });

varientSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
varientSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncVarient(doc);
});

varientSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
varientSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteVarient(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const Varient =
  mongoose.models.varients ?? mongoose.model("varients", varientSchema);
module.exports = Varient;
