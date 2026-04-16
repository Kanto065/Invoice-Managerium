const { default: zod } = require("zod");

const itemSchema = zod.object({
  name: zod.string().trim().nonempty("Item name is required!"),
  quantity: zod.number().int().min(1, "Quantity must be at least 1!"),
  unitPrice: zod.number().min(0, "Unit price cannot be negative!"),
});

const createInvoiceSchema = zod.object({
  customerName: zod.string().trim().optional(),
  customerPhone: zod.string().trim().optional(),
  customerEmail: zod.string().trim().email().optional().or(zod.literal("")),
  items: zod
    .array(itemSchema)
    .min(1, "At least one item is required!"),
  discount: zod.number().min(0).optional(),
  tax: zod.number().min(0).optional(),
  notes: zod.string().trim().optional(),
  status: zod.enum(["draft", "issued"]).optional(),
});

const updateInvoiceStatusSchema = zod.object({
  status: zod.enum(["draft", "issued", "paid", "void"]),
});

module.exports = {
  createInvoiceSchema,
  updateInvoiceStatusSchema,
};
