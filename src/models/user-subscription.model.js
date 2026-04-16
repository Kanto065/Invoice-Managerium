const mongoose = require("mongoose");

const userSubscriptionSchema = new mongoose.Schema(
    {
        userId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "users",
        },
        planId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "subscription_plans",
        },

        status: {
            required: true,
            type: String,
            enum: ["pending", "active", "expired", "cancelled"],
            default: "pending",
        },

        // ── Payment info ──
        paymentMethod: {
            type: String,
            enum: ["bkash", "nagad", "card", "bank", "free"],
            default: "free",
        },
        paymentReference: {
            type: String,
            default: "",
        },
        paymentAmount: {
            type: Number,
            default: 0,
        },

        // ── Dates ──
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },

        // ── Admin approval ──
        approvedBy: {
            type: mongoose.Types.ObjectId,
            ref: "users",
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// Index for quick lookup of active subscription per user
userSubscriptionSchema.index({ userId: 1, status: 1 });

const UserSubscription =
    mongoose.models.user_subscriptions ??
    mongoose.model("user_subscriptions", userSubscriptionSchema);
module.exports = UserSubscription;
