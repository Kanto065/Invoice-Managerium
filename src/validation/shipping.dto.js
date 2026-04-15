const { default: zod } = require("zod");

const createShippingSchema = zod.object({
  division: zod.enum(
    [
      "All over BD",
      "Insite City",
      "Barishal",
      "Chattogram",
      "Dhaka",
      "Khulna",
      "Rajshahi",
      "Rangpur",
      "Mymensingh",
      "Sylhet",
    ],
    "Invalid division name!"
  ),
  cost: zod.coerce
    .number("Cost must be number!")
    .nonnegative("Cost must be positive!")
    .min(1, "Cost is required!"),
});
const updateShippingSchema = zod.object({
  division: zod.string("Division name must be string!").trim().optional(),
  cost: zod.coerce
    .number("Cost must be number!")
    .nonnegative("Cost must be positive!")
    .optional(),
});

module.exports = {
  createShippingSchema,
  updateShippingSchema,
};
