const { default: zod } = require("zod");

// ── Shop validation ──
const createShopSchema = zod.object({
    name: zod
        .string("Shop name must be a string!")
        .trim()
        .nonempty("Shop name is required!")
        .max(100, "Shop name max 100 characters!"),
    contactNumber: zod.string().trim().optional(),
    address: zod
        .object({
            address_line1: zod.string().trim().optional(),
            address_line2: zod.string().trim().optional(),
            city: zod.string().trim().optional(),
            state: zod.string().trim().optional(),
            postal_code: zod.string().trim().optional(),
            country: zod.string().trim().optional(),
        })
        .optional(),
    socialLinks: zod
        .object({
            facebook: zod.string().trim().optional(),
            instagram: zod.string().trim().optional(),
        })
        .optional(),
});

const updateShopSchema = zod.object({
    name: zod.string().trim().max(100).optional(),
    contactNumber: zod.string().trim().optional(),
    address: zod
        .object({
            address_line1: zod.string().trim().optional(),
            address_line2: zod.string().trim().optional(),
            city: zod.string().trim().optional(),
            state: zod.string().trim().optional(),
            postal_code: zod.string().trim().optional(),
            country: zod.string().trim().optional(),
        })
        .optional(),
    socialLinks: zod
        .object({
            facebook: zod.string().trim().optional(),
            instagram: zod.string().trim().optional(),
        })
        .optional(),
    receiptConfig: zod
        .object({
            headerText: zod.string().trim().optional(),
            footerText: zod.string().trim().optional(),
            showLogo: zod.boolean().optional(),
            accentColor: zod.string().trim().optional(),
        })
        .optional(),
});

module.exports = {
    createShopSchema,
    updateShopSchema,
};
