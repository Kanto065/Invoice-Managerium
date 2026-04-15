const { default: zod } = require("zod");

const createOrderSchema = zod.object({
  cartId: zod
    .string("Cart id must be string")
    .trim()
    .nonempty("Cart id is required"),
  phone: zod
    .string("Phone number must be a string!")
    .regex(
      /^(01)[0-9]{9}$/,
      "Phone number must be 11 digits and start with 01!"
    )
    .optional(),
  shippingAddressId: zod
    .string("Shipping address must be string")
    .trim()
    .nonempty("Shipping address ID is required"),
  totalAmount: zod
    .number("Total amount must be number")
    .positive()
    .min(1, "Total amount is required"),
  shippingAmount: zod
    .number("Shipping amount must be number")
    .positive()
    .min(1, "Shipping amount is required"),
  paymentType: zod.enum(
    ["cod", "bkash", "nagad", "card"],
    "Invalid payment type"
  ),
  transactionId: zod.string("Transaction id must be string").trim().optional(),
});
const changeOrderStatusSchema = zod.object({
  status: zod
    .enum(
      [
        "placed",
        "processing",
        "shipping",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      "Invalid staus"
    )
    .optional(),
  paymentStatus: zod
    .enum(["not_paid", "paid"], "Invalid payment status")
    .optional(),
});

module.exports = { createOrderSchema, changeOrderStatusSchema };
