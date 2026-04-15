const { default: zod } = require("zod");

const createVarientAttributeSchema = zod.object({
  name: zod.string("Name must be string!").trim().nonempty("Name is required!"),
  value: zod
    .string("Value must be string!")
    .trim()
    .nonempty("Value is required!"),
});

module.exports = { createVarientAttributeSchema };
