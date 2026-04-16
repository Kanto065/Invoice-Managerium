/**
 * Seed script — creates the Free subscription plan and auto-assigns
 * it to all existing users who don't have a subscription.
 *
 * Usage:  node seed_free_plan.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const SubscriptionPlan = require("./src/models/subscription-plan.model");
const UserSubscription = require("./src/models/user-subscription.model");
const User = require("./src/models/user.model");

const FREE_PLAN = {
    name: "Free",
    slug: "free",
    description: "Get started with basic invoicing — no cost, no commitment.",
    price: 0,
    billingCycle: "lifetime",
    maxShops: 1,
    maxModeratorsPerShop: 0,
    maxProductsPerShop: 10,
    maxInvoicesPerMonth: 20,
    features: {
        receiptCustomization: false,
        exportPdf: false,
        analytics: false,
    },
    isActive: true,
    sortOrder: 0,
};

async function seed() {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ Connected to MongoDB");

    // 1. Upsert Free plan
    let plan = await SubscriptionPlan.findOne({ slug: "free" });
    if (!plan) {
        plan = await SubscriptionPlan.create(FREE_PLAN);
        console.log("✅ Free plan created:", plan._id);
    } else {
        console.log("ℹ️  Free plan already exists:", plan._id);
    }

    // 2. Auto-assign Free plan to users without an active subscription
    const users = await User.find({ role: { $ne: "admin" } });
    let assigned = 0;

    for (const user of users) {
        const hasSub = await UserSubscription.findOne({
            userId: user._id,
            status: { $in: ["active", "pending"] },
        });
        if (!hasSub) {
            await UserSubscription.create({
                userId: user._id,
                planId: plan._id,
                status: "active",
                paymentMethod: "free",
                paymentAmount: 0,
                startDate: new Date(),
                endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 100), // 100 years
            });
            assigned++;
        }
    }

    console.log(`✅ Assigned Free plan to ${assigned} users`);

    // 3. Migrate existing users with role "customer" to "owner"
    const migrated = await User.updateMany(
        { role: "customer" },
        { $set: { role: "owner" } }
    );
    if (migrated.modifiedCount > 0) {
        console.log(`✅ Migrated ${migrated.modifiedCount} users from "customer" to "owner"`);
    }

    await mongoose.disconnect();
    console.log("✅ Done!");
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
