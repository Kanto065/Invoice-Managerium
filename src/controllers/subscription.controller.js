const { catchAsyncError } = require("../middlewares/catchAsync.middleware");
const SubscriptionPlan = require("../models/subscription-plan.model");
const UserSubscription = require("../models/user-subscription.model");
const BillingCycle = require("../models/billing-cycle.model");
const ErrorHandler = require("../helper/error.helper");

// Helper: slugify plan name
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-")
        .replace(/-+/g, "-");
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ADMIN — Plan CRUD                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

// ===> Create plan <===
exports.createPlan = catchAsyncError(async (req, res, next) => {
    const {
        name,
        description,
        price,
        maxShops,
        maxModeratorsPerShop,
        maxProductsPerShop,
        maxInvoicesPerMonth,
        features,
        sortOrder,
    } = req.body;

    const slug = slugify(name);

    const existing = await SubscriptionPlan.findOne({ slug });
    if (existing) {
        return next(new ErrorHandler("A plan with this name already exists!", 409));
    }

    const plan = await SubscriptionPlan.create({
        name,
        slug,
        description: description || "",
        price,
        maxShops: maxShops ?? 1,
        maxModeratorsPerShop: maxModeratorsPerShop ?? 0,
        maxProductsPerShop: maxProductsPerShop ?? 10,
        maxInvoicesPerMonth: maxInvoicesPerMonth ?? 20,
        features: features || {},
        sortOrder: sortOrder ?? 0,
    });

    return res.status(201).json({
        success: true,
        plan,
        message: "Plan created successfully!",
    });
});

// ===> List all plans <===
exports.listPlans = catchAsyncError(async (req, res, next) => {
    const plans = await SubscriptionPlan.find().sort({ sortOrder: 1 });
    return res.status(200).json({
        success: true,
        plans,
    });
});

// ===> Get single plan <===
exports.getPlan = catchAsyncError(async (req, res, next) => {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
        return next(new ErrorHandler("Plan not found!", 404));
    }
    return res.status(200).json({
        success: true,
        plan,
    });
});

// ===> Update plan <===
exports.updatePlan = catchAsyncError(async (req, res, next) => {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
        return next(new ErrorHandler("Plan not found!", 404));
    }

    const updateData = { ...req.body };
    if (updateData.name) {
        updateData.slug = slugify(updateData.name);
    }
    if (updateData.features) {
        updateData.features = { ...plan.features.toObject(), ...updateData.features };
    }

    await SubscriptionPlan.updateOne({ _id: plan._id }, { $set: updateData });
    const updated = await SubscriptionPlan.findById(plan._id);

    return res.status(200).json({
        success: true,
        plan: updated,
        message: "Plan updated successfully!",
    });
});

// ===> Delete plan <===
exports.deletePlan = catchAsyncError(async (req, res, next) => {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
        return next(new ErrorHandler("Plan not found!", 404));
    }

    // Don't allow deleting if users are on this plan
    const activeCount = await UserSubscription.countDocuments({
        planId: plan._id,
        status: "active",
    });
    if (activeCount > 0) {
        return next(
            new ErrorHandler(
                `Cannot delete: ${activeCount} active subscribers on this plan.`,
                400
            )
        );
    }

    await plan.deleteOne();
    return res.status(200).json({
        success: true,
        message: "Plan deleted successfully!",
    });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  USER — Purchase subscription                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

// ===> Purchase a plan <===
exports.purchasePlan = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id;
    const { planId, billingCycleId, paymentMethod, paymentReference } = req.body;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
        return next(new ErrorHandler("Plan not found!", 404));
    }
    if (!plan.isActive) {
        return next(new ErrorHandler("This plan is no longer available!", 400));
    }

    const billingCycle = await BillingCycle.findOne({ _id: billingCycleId, isActive: true });
    if (!billingCycle) {
        return next(new ErrorHandler("Invalid or inactive billing cycle!", 400));
    }

    let calculatedAmount = (plan.price * billingCycle.durationInMonths) - billingCycle.discountAmount;
    if (calculatedAmount < 0) calculatedAmount = 0;

    // Check if user already has a pending request
    const pendingSub = await UserSubscription.findOne({
        userId,
        status: "pending",
    });
    if (pendingSub) {
        return next(
            new ErrorHandler(
                "You already have a pending subscription request. Wait for admin approval.",
                400
            )
        );
    }

    const subscription = await UserSubscription.create({
        userId,
        planId,
        billingCycleId,
        status: "pending",
        paymentMethod,
        paymentReference,
        paymentAmount: calculatedAmount,
    });

    return res.status(201).json({
        success: true,
        subscription,
        message:
            "Subscription request submitted! Admin will review and approve shortly.",
    });
});

// ===> My subscription <===
exports.mySubscription = catchAsyncError(async (req, res, next) => {
    const userId = req.user._id;

    const activeSub = await UserSubscription.findOne({
        userId,
        status: { $in: ["active", "pending"] },
    })
        .populate("planId")
        .sort({ createdAt: -1 });

    return res.status(200).json({
        success: true,
        subscription: activeSub,
    });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ADMIN — Manage subscription requests                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

// ===> List all subscriptions (with filters) <===
exports.listSubscriptions = catchAsyncError(async (req, res, next) => {
    const { status, page = 1, limit = 15 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (status) filter.status = status;

    const [subscriptions, total] = await Promise.all([
        UserSubscription.find(filter)
            .populate("userId", "name email phone image")
            .populate("planId", "name price billingCycle")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        UserSubscription.countDocuments(filter),
    ]);

    return res.status(200).json({
        success: true,
        subscriptions,
        total,
    });
});

// ===> Approve or reject <===
exports.handleSubscription = catchAsyncError(async (req, res, next) => {
    const sub = await UserSubscription.findById(req.params.id);
    if (!sub) {
        return next(new ErrorHandler("Subscription not found!", 404));
    }
    if (sub.status !== "pending") {
        return next(
            new ErrorHandler(`Cannot modify a subscription with status "${sub.status}".`, 400)
        );
    }

    const { action, rejectionReason } = req.body;

    if (action === "approve") {
        const plan = await SubscriptionPlan.findById(sub.planId);
        const billingCycle = await BillingCycle.findById(sub.billingCycleId);
        const now = new Date();
        let endDate = new Date(now);

        if (billingCycle) {
            endDate.setMonth(endDate.getMonth() + billingCycle.durationInMonths);
        } else {
            // Fallback just in case
            endDate.setMonth(endDate.getMonth() + 1);
        }

        // Expire any existing active subscription for this user
        await UserSubscription.updateMany(
            { userId: sub.userId, status: "active" },
            { $set: { status: "expired" } }
        );

        sub.status = "active";
        sub.startDate = now;
        sub.endDate = endDate;
        sub.approvedBy = req.user._id;
        sub.approvedAt = now;
        await sub.save();

        return res.status(200).json({
            success: true,
            message: "Subscription approved!",
            subscription: sub,
        });
    }

    if (action === "reject") {
        sub.status = "cancelled";
        sub.rejectionReason = rejectionReason || "Rejected by admin";
        await sub.save();

        return res.status(200).json({
            success: true,
            message: "Subscription rejected.",
            subscription: sub,
        });
    }
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ADMIN — Stats                                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

exports.subscriptionStats = catchAsyncError(async (req, res, next) => {
    const [pendingCount, activeCount, totalRevenue] = await Promise.all([
        UserSubscription.countDocuments({ status: "pending" }),
        UserSubscription.countDocuments({ status: "active" }),
        UserSubscription.aggregate([
            { $match: { status: "active" } },
            { $group: { _id: null, total: { $sum: "$paymentAmount" } } },
        ]),
    ]);

    return res.status(200).json({
        success: true,
        stats: {
            pending: pendingCount,
            active: activeCount,
            revenue: totalRevenue[0]?.total || 0,
        },
    });
});
/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ADMIN — Toggle Plan Status                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

exports.activeInactivePlan = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const updateData = { isActive };
    if (!isActive) {
        updateData.deactivatedAt = new Date();
    } else {
        updateData.deactivatedAt = null;
    }

    await SubscriptionPlan.updateOne({ _id: id }, { $set: updateData });
    
    return res.status(200).json({
        success: true,
        message: `Subscription plan marked as ${isActive ? "Active" : "Inactive"}!`,
    });
});
