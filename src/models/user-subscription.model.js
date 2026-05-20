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
        billingCycleId: {
            required: true,
            type: mongoose.Types.ObjectId,
            ref: "billing_cycles",
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

// ── MySQL dual-write hooks ────────────────────────────────────────────────────
const { syncUserSubscription, deleteUserSubscription } = require("../lib/mysql-sync");

userSubscriptionSchema.post("save", function (doc) { syncUserSubscription(doc); });

userSubscriptionSchema.post("findOneAndUpdate", function (doc) { if (doc) syncUserSubscription(doc); });

userSubscriptionSchema.pre("updateOne", { document: false, query: true }, async function () {
  this._syncFilter = this.getFilter();
});
userSubscriptionSchema.post("updateOne", { document: false, query: true }, async function () {
  if (!this._syncFilter) return;
  const doc = await this.model.findOne(this._syncFilter).lean();
  if (doc) syncUserSubscription(doc);
});

userSubscriptionSchema.pre("deleteOne", { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).lean();
  this._deletedId = doc?._id?.toString();
});
userSubscriptionSchema.post("deleteOne", { document: false, query: true }, function () {
  if (this._deletedId) deleteUserSubscription(this._deletedId);
});
// ─────────────────────────────────────────────────────────────────────────────

const UserSubscription =
    mongoose.models.user_subscriptions ??
    mongoose.model("user_subscriptions", userSubscriptionSchema);
module.exports = UserSubscription;
