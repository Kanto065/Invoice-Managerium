const cron = require('node-cron');
const { cleanupOrphanImages } = require('./cleanup');

const initializeCronJobs = () => {
    // Run at midnight every Sunday
    cron.schedule('0 0 * * 0', async () => {
        console.log('[CRON] Running weekly image cleanup...');
        await cleanupOrphanImages();
    });
    console.log("🕒 Cron jobs initialized. Scheduled cleanup every Sunday.");
};

module.exports = { initializeCronJobs };
