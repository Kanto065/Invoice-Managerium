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

const BillingCycle =
    mongoose.models.billing_cycles ??
    mongoose.model("billing_cycles", billingCycleSchema);
module.exports = BillingCycle;
