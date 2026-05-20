const mongoose = require("mongoose");

const billingCycleSchema = new mongoose.Schema(
    {
        name: {
            required: true,
            type: String, // e.g., "Monthly", "Quarterly", "Yearly"
        },
        durationInMonths: {
            required: true,
            type: Number, // e.g., 1, 3, 6, 12. Use for expiration calculation
            min: 1,
        },
        discountAmount: {
            required: true,
            type: Number,
            default: 0, // Flat currency discount to be subtracted from Total (BasePrice * durationInMonths)
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        deactivatedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncBillingCycle, deleteBillingCycle } = require("../lib/mysql-sync");

billingCycleSchema.post("save", function (doc) { syncBillingCycle(doc); });

billingCycleSchema.post("findOneAndUpdate", function (doc) { if (doc) syncBillingCycle(doc); });

billingCycleSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
billingCycleSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncBillingCycle(doc);
});

billingCycleSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
billingCycleSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteBillingCycle(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const BillingCycle =
    mongoose.models.billing_cycles ??
    mongoose.model("billing_cycles", billingCycleSchema);
module.exports = BillingCycle;
