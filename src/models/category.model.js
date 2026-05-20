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

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncCategory, deleteCategory } = require("../lib/mysql-sync");

categorySchema.post("save", function (doc) { syncCategory(doc); });

categorySchema.post("findOneAndUpdate", function (doc) { if (doc) syncCategory(doc); });

categorySchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
categorySchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncCategory(doc);
});

categorySchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
categorySchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteCategory(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const Category =
  mongoose.models.categories ?? mongoose.model("categories", categorySchema);
module.exports = Category;
