const { default: zod } = require("zod");

const createBillingCycleSchema = zod.object({
  name: zod.string("Name must be string").trim().nonempty("Name is required!"),
  durationInMonths: zod.coerce
    .number("Duration in months must be a number")
    .int()
    .positive("Duration must be a positive integer"),
  discountAmount: zod.coerce
    .number("Discount amount must be a number")
    .nonnegative("Discount amount cannot be negative")
    .default(0),
  isActive: zod.boolean().optional(),
  sortOrder: zod.coerce.number().optional(),
});

const updateBillingCycleSchema = zod.object({
  name: zod.string("Name must be string").trim().optional(),
  durationInMonths: zod.coerce
    .number("Duration in months must be a number")
    .int()
    .positive("Duration must be a positive integer")
    .optional(),
  discountAmount: zod.coerce
    .number("Discount amount must be a number")
    .nonnegative("Discount amount cannot be negative")
    .optional(),
  isActive: zod.boolean().optional(),
  sortOrder: zod.coerce.number().optional(),
});

const activeInactiveBillingCycleSchema = zod.object({
  isActive: zod.boolean({
      required_error: "isActive is required!"
  }),
});

module.exports = {
  createBillingCycleSchema,
  updateBillingCycleSchema,
  activeInactiveBillingCycleSchema,
};
