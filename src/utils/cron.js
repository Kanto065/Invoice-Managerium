const cron = require('node-cron');
const UserSubscription = require("../models/user-subscription.model");
const { cleanupOrphanImages } = require('./cleanup');

const initializeCronJobs = () => {
    // Run at midnight every Sunday
    cron.schedule('0 0 * * 0', async () => {
        console.log('[CRON] Running weekly image cleanup...');
        await cleanupOrphanImages();
    });

    // Run at midnight every day for subscription expiration
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running daily subscription expiration check...');
        try {
            const now = new Date();
            const gracePeriodMs = 24 * 60 * 60 * 1000;
            const thresholdDate = new Date(now.getTime() - gracePeriodMs);

            const result = await UserSubscription.updateMany(
                { status: "active", endDate: { $lt: thresholdDate } },
                { $set: { status: "expired" } }
            );
            console.log(`[CRON] Subscription cleanup: ${result.modifiedCount} marked expired.`);
        } catch (error) {
            console.error('[CRON] Subscription check failed:', error);
        }
    });

    console.log("🕒 Cron jobs initialized. Scheduled cleanup every Sunday, subscription check daily.");
};

module.exports = { initializeCronJobs };
