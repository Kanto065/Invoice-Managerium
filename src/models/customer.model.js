const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        shopId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "shops",
        },
        ownerId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "users",
        },
        createdBy: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "users",
        },
        name: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            default: "",
        },
        address: {
            type: String,
            default: "",
        },
        // For future CRM features
        totalInvoices: {
            type: Number,
            default: 0,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// We don't enforce unique phone across the whole DB, but rather unique per shop, 
// though we handle that logic in the controller to avoid strict DB errors for walk-in (no phone) customers.

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncCustomer, deleteCustomer } = require("../lib/mysql-sync");

customerSchema.post("save", function (doc) { syncCustomer(doc); });

customerSchema.post("findOneAndUpdate", function (doc) { if (doc) syncCustomer(doc); });

customerSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
customerSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncCustomer(doc);
});

customerSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
customerSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteCustomer(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const Customer = mongoose.model("customers", customerSchema);
module.exports = Customer;
