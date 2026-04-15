const { default: zod } = require("zod");

const addToCartSchema = zod
  .object({
    userId: zod.string("User id must be string!").trim().optional(),
    guestId: zod.string("Guest id must be string!").trim().optional(),
    productId: zod
      .string("Product id must be string!")
      .trim()
      .nonempty("Product id is required!"),
    varientId: zod.string("Varient id must be string!").trim().optional(),
    quantity: zod.coerce
      .number("Quantity must be number!")
      .min(1, "User id is required!"),
  })
  .refine((data) => data.userId || data.guestId, {
    message: "Either userId or guestId must be provided",
    path: ["userId"], // can point to userId or guestId
  });

const changeCartQuantitySchema = zod.object({
  type: zod.enum(["INC", "DEC"], "Invalid type"),
});

const mergeGuestCartSchema = zod.object({
  userId: zod.string("User id must be string!").trim(),
  guestId: zod.string("Guest id must be string!").trim(),
});
const applyCartCouponSchema = zod.object({
  couponCode: zod
    .string("Coupon code must be string!")
    .trim()
    .nonempty("Coupon code is required!"),
});

module.exports = {
  addToCartSchema,
  changeCartQuantitySchema,
  mergeGuestCartSchema,
  applyCartCouponSchema,
};
