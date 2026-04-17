const { default: zod } = require("zod");

const fileSchema = zod.object({
  fieldname: zod.string(),
  originalname: zod.string(),
  mimetype: zod.enum(["image/jpeg", "image/png"]),
  size: zod
    .number()
    .max(20 * 1024 * 1024, "Each image must not be greater than 20MB!"),
});
const createProductSchema = zod.object({
  name: zod
    .string("Product name must be a string")
    .trim()
    .nonempty("Product name is required!"),
  varientId: zod
    .string("Varient id must be a string")
    .trim()
    .nonempty("Varient id is required!"),
  brandId: zod.string("Brand id must be a string").trim().optional(),
  description: zod
    .string("Product description must be a string")
    .trim()
    .nonempty("Product description is required!"),
  price: zod.coerce
    .number("Product price must be number")
    .positive("Product price must be positive")
    .min(1, "Product price is required!"),
  previousPrice: zod.coerce
    .number("Previous price must be number")
    .nonnegative("Previous price must be 0 or positive")
    .optional(),
  extraPrice: zod.coerce
    .number("Extra price must be number")
    .nonnegative("Previous price must be 0 or positive")
    .optional(),
  buyingPrice: zod.coerce
    .number("Buying price must be number")
    .nonnegative("Buying price must be 0 or positive")
    .optional(),
  stock: zod.coerce
    .number("Stock must be number")
    .positive("Stock must be positive")
    .min(1, "Product stock is required!"),
  location: zod
    .enum([
      "All over BD",
      "Insite City",
      "Barishal",
      "Chattogram",
      "Dhaka",
      "Khulna",
      "Mymensingh",
      "Rajshahi",
      "Rangpur",
      "Sylhet",
    ])
    .optional(),
  featured: zod.enum(["true", "false"], "Invalid featured status").optional(),
  freeDelivery: zod
    .enum(["true", "false"], "Invalid free delivery status")
    .optional(),
  images: zod.array(fileSchema).optional(),
});

const updateProductSchema = zod.object({
  name: zod
    .string("Product name must be a string")
    .trim()
    .nonempty("Product name is required!"),
  varientId: zod
    .string("Varient id must be a string")
    .trim()
    .nonempty("Varient id is required!"),
  brandId: zod.string("Brand id must be a string").trim().optional(),
  description: zod
    .string("Product description must be a string")
    .trim()
    .nonempty("Product description is required!"),
  price: zod.coerce
    .number("Product price must be number")
    .positive("Product price must be positive")
    .min(1, "Product price is required!"),
  previousPrice: zod.coerce
    .number("Previous price must be number")
    .nonnegative("Previous price must be 0 or positive")
    .optional(),
  extraPrice: zod.coerce
    .number("Extra price must be number")
    .nonnegative("Previous price must be 0 or positive")
    .optional(),
  buyingPrice: zod.coerce
    .number("Buying price must be number")
    .nonnegative("Buying price must be 0 or positive")
    .optional(),
  stock: zod.coerce
    .number("Stock must be number")
    .positive("Stock must be positive")
    .min(1, "Product stock is required!"),
  featured: zod.enum(["true", "false"], "Invalid featured status").optional(),
  location: zod
    .enum([
      "All over BD",
      "Insite City",
      "Barishal",
      "Chattogram",
      "Dhaka",
      "Khulna",
      "Mymensingh",
      "Rajshahi",
      "Rangpur",
      "Sylhet",
    ])
    .optional(),
  freeDelivery: zod
    .enum(["true", "false"], "Invalid free delivery status")
    .optional(),
  status: zod.enum(["active", "inactive"], "Invalid status").optional(),
  images: zod
    .union([zod.array(fileSchema), zod.null(), zod.undefined()])
    .optional(),
});

const activeInactiveProductSchema = zod.object({
  status: zod.enum(["active", "inactive"], "Invalid status"),
});

const productImageUploadSchema = zod.object({
  productId: zod
    .string("Product id must be string")
    .trim()
    .nonempty("Product id is required!"),
});

const addProductVarientSchema = zod.object({
  productId: zod
    .string("Product id must be string")
    .trim()
    .nonempty("Product id is required!"),
  varientId: zod
    .string("Varient id must be string")
    .trim()
    .nonempty("Varient id is required!"),
});
const removeProductVarientSchema = zod.object({
  productId: zod
    .string("Product id must be string")
    .trim()
    .nonempty("Product id is required!"),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  activeInactiveProductSchema,
  productImageUploadSchema,
  addProductVarientSchema,
  removeProductVarientSchema,
};
