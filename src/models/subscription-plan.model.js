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

const SubscriptionPlan =
    mongoose.models.subscription_plans ??
    mongoose.model("subscription_plans", subscriptionPlanSchema);
module.exports = SubscriptionPlan;
