const { default: zod } = require("zod");

// ── Admin: create/update subscription plan ──
const createPlanSchema = zod.object({
    name: zod.string().trim().nonempty("Plan name is required!"),
    description: zod.string().trim().optional(),
    price: zod.number().min(0, "Price cannot be negative!"),
    billingCycle: zod.enum(["monthly", "yearly", "lifetime"]).optional(),
    maxShops: zod.number().int().min(1).optional(),
    maxModeratorsPerShop: zod.number().int().min(0).optional(),
    maxProductsPerShop: zod.number().int().min(-1).optional(),
    maxInvoicesPerMonth: zod.number().int().min(-1).optional(),
    features: zod
        .object({
            receiptCustomization: zod.boolean().optional(),
            exportPdf: zod.boolean().optional(),
            analytics: zod.boolean().optional(),
        })
        .optional(),
    sortOrder: zod.number().int().optional(),
});

const updatePlanSchema = createPlanSchema.partial();

// ── User: purchase subscription ──
const purchaseSubscriptionSchema = zod.object({
    planId: zod.string().nonempty("Plan ID is required!"),
    paymentMethod: zod.enum(["bkash", "nagad", "card", "bank"]),
    paymentReference: zod.string().trim().nonempty("Transaction ID is required!"),
    paymentAmount: zod.number().min(0),
});

// ── Admin: approve/reject ──
const approveSubscriptionSchema = zod.object({
    action: zod.enum(["approve", "reject"]),
    rejectionReason: zod.string().trim().optional(),
});

module.exports = {
    createPlanSchema,
    updatePlanSchema,
    purchaseSubscriptionSchema,
    approveSubscriptionSchema,
};
