const { catchAsyncError } = require("./catchAsync.middleware");
const UserSubscription = require("../models/user-subscription.model");
const ErrorHandler = require("../helper/error.helper");

/**
 * Middleware to check if the user has an active, non-expired subscription.
 * Should be used AFTER authCheck as it relies on req.user._id.
 */
exports.checkSubscription = catchAsyncError(async (req, res, next) => {
    // Only strictly required for owners/managers. 
    // Super admins might bypass this, but for now we enforce it for everyone trying to use business features.
    if (req.user.role === "admin") {
        return next();
    }

    const userId = req.user._id;

    // Find the most recent subscription
    const subscription = await UserSubscription.findOne({
        userId,
        status: "active",
    }).sort({ createdAt: -1 });

    if (!subscription) {
        return next(
            new ErrorHandler(
                "You do not have an active subscription. Please purchase a plan to continue.",
                403
            )
        );
    }

    // Check expiration date
    const now = new Date();
    if (subscription.endDate && now > subscription.endDate) {
        // If it's expired but still marked 'active' in DB (cron hasn't run), we block it here.
        return next(
            new ErrorHandler(
                "Your subscription has expired. Please renew your plan to continue.",
                403
            )
        );
    }

    // Attach subscription to req for later use if needed (e.g. limit checks)
    req.subscription = subscription;
    next();
});
