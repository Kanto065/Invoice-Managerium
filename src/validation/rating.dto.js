const { default: zod } = require("zod");

const createRatingSchema = zod.object({
  productId: zod
    .string("Product id must be string")
    .trim()
    .nonempty("Product ID is required!"),
  rating: zod
    .number("Rating must be number")
    .positive()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  review: zod
    .string("Review must be string")
    .trim()
    .nonempty("Review is required"),
});

const deleteRatingSchema = zod.object({
  productId: zod
    .string("Product id must be string")
    .trim()
    .nonempty("Product id is required"),
});
const activeInactiveRatingSchema = zod.object({
  status: zod.enum(["active", "inactive"], "Invalid status"),
});
module.exports = {
  deleteRatingSchema,
  createRatingSchema,
  activeInactiveRatingSchema,
};
