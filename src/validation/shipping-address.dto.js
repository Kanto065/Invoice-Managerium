const { default: zod } = require("zod");

const createShippingAddressSchema = zod.object({
  id: zod.string("Id must be string").optional(),
  street: zod
    .string("Street must be string")
    .trim()
    .nonempty("Street is required!"),
  city: zod.string("City must be string").trim().nonempty("City is required!"),
  postCode: zod
    .number("Post code must be number")
    .positive()
    .min(1, "Post code is required!"),
  country: zod
    .string("Country must be string")
    .trim()
    .nonempty("Country is required!"),
});

const updateShippingAddressSchema = zod.object({
  id: zod.string("Id must be string").optional(),
  street: zod.string("Street must be string").trim().optional(),
  city: zod.string("City must be string").trim().optional(),
  postCode: zod.number("Post code be number").positive().optional(),
  country: zod.string("Country must be string").trim().optional(),
});

module.exports = {
  createShippingAddressSchema,
  updateShippingAddressSchema,
};
