const dayjs = require("dayjs");
const { default: zod } = require("zod");

const createDiscountSchema = zod
  .object({
    name: zod.string().min(1, "Discount name is required"),
    type: zod.enum(
      ["product", "category", "coupon", "quantity"],
      "Invalid type!"
    ),
    method: zod.enum(["percentage", "flat", "tier", "bogo"], "Invalid method!"),
    value: zod.coerce.number().optional(),
    code: zod.string().optional(),
    minQty: zod.coerce.number().optional(),
    productIds: zod.array(zod.string()).optional(),
    categoryIds: zod.array(zod.string()).optional(),
    tierIds: zod.array(zod.string()).optional(),
    minCartValue: zod.coerce.number().optional(),
    usageLimit: zod.coerce.number().optional(),
    startDate: zod.union([
      zod
        .string()
        .refine((val) => dayjs(val).isValid(), {
          message: "Invalid startDate string",
        })
        .transform((val) => dayjs(val)),
      zod.custom((val) => dayjs.isDayjs(val), {
        message: "startDate must be a Dayjs object",
      }),
    ]),
    endDate: zod.union([
      zod
        .string()
        .refine((val) => dayjs(val).isValid(), {
          message: "Invalid endDate string",
        })
        .transform((val) => dayjs(val)),
      zod.custom((val) => dayjs.isDayjs(val), {
        message: "endDate must be a Dayjs object",
      }),
    ]),
  })
  .superRefine((data, ctx) => {
    // 1. Product discount
    if (data.type === "product") {
      if (data.method !== "percentage" && data.method !== "flat") {
        ctx.addIssue({
          path: ["method"],
          code: "custom",
          message: "Product discounts must use method: 'percentage' or 'flat'!",
        });
      }
      if (!data.productIds?.length) {
        ctx.addIssue({
          path: ["productIds"],
          code: "custom",
          message: "At least one product is required!",
        });
      }

      if (!data.value || data.value <= 0) {
        ctx.addIssue({
          path: ["value"],
          code: "custom",
          message: "Value is required for product discounts!",
        });
      }
    }

    // 2. Category discount
    if (data.type === "category") {
      if (data.method !== "percentage" && data.method !== "flat") {
        ctx.addIssue({
          path: ["method"],
          code: "custom",
          message:
            "Category discounts must use method: 'percentage' or 'flat'!",
        });
      }
      if (!data.categoryIds?.length) {
        ctx.addIssue({
          path: ["categoryIds"],
          code: "custom",
          message: "At least one category is required!",
        });
      }
      if (!data.value || data.value <= 0) {
        ctx.addIssue({
          path: ["value"],
          code: "custom",
          message: "Value is required for category discounts!",
        });
      }
    }

    // 3. Coupon
    if (data.type === "coupon") {
      if (!data.code) {
        ctx.addIssue({
          path: ["code"],
          code: "custom",
          message: "Coupon code is required!",
        });
      }
      if (data.method !== "percentage" && data.method !== "flat") {
        ctx.addIssue({
          path: ["method"],
          code: "custom",
          message: "Coupon discounts must use method: 'percentage' or 'flat'!",
        });
      }
      if (!data.minCartValue || data.minCartValue <= 0) {
        ctx.addIssue({
          path: ["minCartValue"],
          code: "custom",
          message: "Minimum cart value is required!",
        });
      }
      if (!data.usageLimit || data.usageLimit <= 0) {
        ctx.addIssue({
          path: ["usageLimit"],
          code: "custom",
          message: "Usage limit is required!",
        });
      }
    }

    // 4. Tier discount
    if (data.type === "quantity" && data.method === "tier") {
      if (!data.productIds?.length) {
        ctx.addIssue({
          path: ["productIds"],
          code: "custom",
          message: "At least one product is required!",
        });
      }
      if (!data.tierIds?.length) {
        ctx.addIssue({
          path: ["tierIds"],
          code: "custom",
          message: "At least one tier is required!",
        });
      }
    }

    // 5. BOGO discount
    if (data.type === "quantity" && data.method === "bogo") {
      if (!data.productIds?.length) {
        ctx.addIssue({
          path: ["productIds"],
          code: "custom",
          message: "At least one product is required!",
        });
      }
      if (!data.minQty || data.minQty <= 0) {
        ctx.addIssue({
          path: ["minQty"],
          code: "custom",
          message: "MinQty is required for BOGO!",
        });
      }
      if (!data.value || data.value <= 0) {
        ctx.addIssue({
          path: ["value"],
          code: "custom",
          message: "Value (free items) is required for BOGO!",
        });
      }
    }
  });

const applyCouponDiscountSchema = zod.object({
  productIds: zod
    .array(
      zod
        .string("Product id must be string!")
        .trim()
        .nonempty("Product id cannot be empty!")
    )
    .nonempty("At least one product id is required!"),
});
const activeInactiveDiscountSchema = zod.object({
  status: zod.enum(["active", "inactive"], "Invalid status"),
});
const createDiscountTierSchema = zod.object({
  min: zod.coerce
    .number("Tier minimum value must be number!")
    .positive("Tier minimum value must be positive!")
    .min(1, "Tier minimum value is required!"),
  value: zod.coerce
    .number("Tier value must be number!")
    .positive("Tier value must be positive!")
    .min(1, "Tier value is required!"),
});

module.exports = {
  createDiscountSchema,
  applyCouponDiscountSchema,
  activeInactiveDiscountSchema,
  createDiscountTierSchema,
};
