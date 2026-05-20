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

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncVarientAttribute, deleteVarientAttribute } = require("../lib/mysql-sync");

varientAttributeSchema.post("save", function (doc) { syncVarientAttribute(doc); });

varientAttributeSchema.post("findOneAndUpdate", function (doc) { if (doc) syncVarientAttribute(doc); });

varientAttributeSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
varientAttributeSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncVarientAttribute(doc);
});

varientAttributeSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
varientAttributeSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteVarientAttribute(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const Varient =
  mongoose.models.varientattributes ??
  mongoose.model("VarientAttribute", varientAttributeSchema);
module.exports = Varient;
