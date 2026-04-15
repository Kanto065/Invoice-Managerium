const { default: zod } = require("zod");

const fileSchema = zod.object({
  fieldname: zod.string(),
  originalname: zod.string(),
  mimetype: zod.enum(["image/jpeg", "image/png", "image/svg+xml"]),
  size: zod
    .number()
    .max(2 * 1024 * 1024, "Each image must not be greater than 2MB!"),
});
const createCategorySchema = zod.object({
  name: zod
    .string("Category name must be string")
    .trim()
    .nonempty("Category name is required"),
  parentId: zod.string("Parent ID must be string").trim().optional(),
  image: fileSchema,
});

const updateCategorySchema = zod.object({
  name: zod.string("Category name must be string").trim().optional(),
  parentId: zod.string("Parent ID must be string").trim().optional(),
  image: fileSchema.optional(),
});
const activeInactiveCategorySchema = zod.object({
  status: zod.enum(["active", "inactive"], "Invalid status!"),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  activeInactiveCategorySchema,
};
