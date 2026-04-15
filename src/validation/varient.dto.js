const { default: zod } = require("zod");

const fileSchema = zod.object({
  fieldname: zod.string(),
  originalname: zod.string(),
  mimetype: zod.enum(["image/jpeg", "image/png"]),
  size: zod
    .number()
    .max(2 * 1024 * 1024, "Each image must not be greater than 2MB!"),
});

const createVarientSchema = zod.object({
  productId: zod
    .string("Product Id must be string!")
    .trim()
    .nonempty("Product Id is required!"),
  sku: zod.string("SKU must be string!").trim().nonempty("SKU is required!"),
  price: zod.coerce
    .number("Varient price must be number")
    .positive("Varient price must be positive")
    .min(1, "Varient price is required!"),
  stock: zod.coerce
    .number("Stock must be number")
    .positive("Stock must be positive")
    .min(1, "Stock is required!"),
  image: fileSchema,
});

const updateVarientSchema = zod.object({
  productId: zod.string("Product Id must be string!").trim().optional(),
  sku: zod.string("SKU must be string!").trim().optional(),
  price: zod.coerce
    .number("Varient price must be number")
    .positive("Varient price must be positive")
    .optional(),
  stock: zod.coerce
    .number("Stock must be number")
    .positive("Stock must be positive")
    .optional(),
  image: fileSchema.optional(),
});

module.exports = { createVarientSchema, updateVarientSchema };
