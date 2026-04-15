const { default: zod } = require("zod");

const createBrandSchema = zod.object({
  name: zod
    .string("Brand name must be string")
    .trim()
    .nonempty("Brand name is required!"),
});
const updateBrandSchema = zod.object({
  name: zod.string("Brand name must be string").trim().optional(),
});
const activeInactiveBrandSchema = zod.object({
  status: zod.enum(["active", "inactive"], "Invalid status!"),
});

module.exports = {
  createBrandSchema,
  updateBrandSchema,
  activeInactiveBrandSchema,
};
