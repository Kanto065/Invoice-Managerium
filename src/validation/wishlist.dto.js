const { default: zod } = require("zod");

const addToWishlistSchema = zod.object({
  productId: zod
    .string("Product id must be string")
    .trim()
    .nonempty("Product id is required!"),
});

module.exports = {
  addToWishlistSchema,
};
