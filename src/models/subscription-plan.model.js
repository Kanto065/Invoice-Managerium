const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema(
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
        description: {
            type: String,
            default: "",
        },
        price: {
            required: true,
            type: Number,
            default: 0,
        },

        // ── Limits ──
        maxShops: {
            type: Number,
            default: 1,
        },
        maxModeratorsPerShop: {
            type: Number,
            default: 0,
        },
        maxProductsPerShop: {
            type: Number,
            default: 10,
        },
        maxInvoicesPerMonth: {
            type: Number,
            default: 20, // -1 = unlimited
        },

        // ── Feature flags ──
        features: {
            receiptCustomization: { type: Boolean, default: false },
            exportPdf: { type: Boolean, default: false },
            analytics: { type: Boolean, default: false },
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
const { syncSubscriptionPlan, deleteSubscriptionPlan } = require("../lib/mysql-sync");

subscriptionPlanSchema.post("save", function (doc) { syncSubscriptionPlan(doc); });

subscriptionPlanSchema.post("findOneAndUpdate", function (doc) { if (doc) syncSubscriptionPlan(doc); });

subscriptionPlanSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
subscriptionPlanSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncSubscriptionPlan(doc);
});

subscriptionPlanSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
subscriptionPlanSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteSubscriptionPlan(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const SubscriptionPlan =
    mongoose.models.subscription_plans ??
    mongoose.model("subscription_plans", subscriptionPlanSchema);
module.exports = SubscriptionPlan;
