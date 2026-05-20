const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      required: true,
      type: String,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "shops",
      required: function() { return !this.isDemo; },
    },
    slug: {
      required: true,
      type: String,
    },
    varientId: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    brandId: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    description: {
      required: true,
      type: String,
    },
    price: {
      required: true,
      type: Number,
    },
    previousPrice: {
      type: Number,
      default: null,
    },
    extraPrice: {
      type: Number,
      default: null,
    },
    buyingPrice: {
      type: Number,
      default: null,
    },
    stock: {
      required: true,
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    location: {
      type: String,
      enum: [
        "Barishal",
        "Chattogram",
        "Dhaka",
        "Khulna",
        "Mymensingh",
        "Rajshahi",
        "Rangpur",
        "Sylhet",
      ],
      default: "Dhaka",
    },
    featured: {
      type: Boolean,
      required: false,
      default: false,
    },
    freeDelivery: {
      type: Boolean,
      required: false,
      default: false,
    },
    isDemo: {
      type: Boolean,
      default: false,
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

productSchema.index({ shopId: 1, slug: 1 }, { unique: true });

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncProduct, deleteProduct } = require("../lib/mysql-sync");

productSchema.post("save", function (doc) { syncProduct(doc); });

productSchema.post("findOneAndUpdate", function (doc) { if (doc) syncProduct(doc); });

productSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
productSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncProduct(doc);
});

productSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
productSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteProduct(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const Product =
  mongoose.models.products ?? mongoose.model("products", productSchema);
module.exports = Product;
